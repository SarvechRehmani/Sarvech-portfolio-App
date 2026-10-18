import {ImagePreparationService} from './image-preparation.service';
import { Injectable, signal, inject } from '@angular/core';
import DOMPurify from 'dompurify';
import { SessionService } from './session.service';
import { SupabaseService } from './supabase.service';
import fallback from './fallback.json';
import { ContentRow, Snapshot } from './models';
export type { ContentRow, Snapshot } from './models';
@Injectable({providedIn:'root'})
export class CmsService {
  private readonly preparation=inject(ImagePreparationService);
  readonly snapshot=signal<Snapshot>(fallback as Snapshot);
  readonly admin=signal(false);
  readonly sharedDenied=signal(false);
  private shareTimer:ReturnType<typeof setInterval>|null=null;
  private readonly session=inject(SessionService);
  private readonly supabase=inject(SupabaseService);
  /** UI command adapter: calls Supabase RPC directly, with no HTTP middleware. */
  async request(path:string,options:RequestInit={},authenticated=true):Promise<any>{
    const [route,query]=path.split('?'),parts=route.split('/').filter(Boolean);
    if(parts[0]==='blog'){
      if(this.sharedPreview()||new URLSearchParams(location.search).has('preview')&&this.admin())return (this.snapshot()['draft_blog']||[]).filter((p:any)=>!parts[1]||p.data.slug===parts[1]);
      return this.supabase.rpc('portfolio_blog',{post_slug:parts[1]||null});
    }
    if(authenticated)await this.session.ensure();
    if(route==='/auth/me')return {admin:true};
    if(parts[0]!=='admin')throw Error('Unknown content command.');
    const body=typeof options.body==='string'?JSON.parse(options.body):options.body||{};
    let action=parts[1],section='',payload:Record<string,unknown>=body;
    if(action==='analytics')payload={days:Number(new URLSearchParams(query).get('days')||30)};
    else if(action==='reorder'){section=parts[2];payload={ids:body};}
    else if(action==='restore')payload={id:parts[2]};
    else if(!['draft','publish','dashboard'].includes(action)){
      section=action;action=options.method==='DELETE'?'delete':options.method&&options.method!=='GET'?'save':'list';
      payload={...body,...(parts[2]?{id:parts[2]}:{})};
    }
    return this.supabase.rpc('portfolio_admin',{action,section,payload});
  }
  async login(email:string,password:string){await this.session.login(email,password);if(this.session.mfaRequired())return;await this.verify();localStorage.setItem('no-track','1');}
  async verify(){try{await this.session.ensure();this.admin.set(true);return true;}catch(error){this.admin.set(false);throw error;}}
  clearPrivate(){this.snapshot.set(fallback as Snapshot);this.admin.set(false);this.sharedDenied.set(false);if(this.shareTimer)clearInterval(this.shareTimer);}
  async logout(){try{await this.session.logout();}finally{this.clearPrivate();}}
  async load():Promise<Snapshot>{
    const preview=new URLSearchParams(location.search).has('preview');
    const shared=new URLSearchParams(location.search).get('draft');
    if(shared){let meta=document.querySelector<HTMLMetaElement>('meta[name=robots]');if(!meta){meta=document.createElement('meta');meta.name='robots';meta.dataset['privatePreview']='1';document.head.append(meta);}meta.content='noindex,nofollow';let ref=document.querySelector<HTMLMetaElement>('meta[name=referrer]');if(!ref){ref=document.createElement('meta');ref.name='referrer';ref.dataset['privatePreview']='1';document.head.append(ref);}ref.content='no-referrer';}else document.querySelectorAll('meta[data-private-preview]').forEach(meta=>meta.remove());
    this.sharedDenied.set(false);if(this.shareTimer)clearInterval(this.shareTimer);
    try{
      if(preview)await this.verify();
      const next=shared?await this.supabase.rpc('portfolio_shared_draft',{token:shared}):preview?await this.request('/admin/draft'):await this.supabase.rpc('portfolio_site');
      if(next?.profile&&Object.keys(next.profile).length){this.snapshot.set(next);if(!preview&&!shared)try{localStorage.setItem('portfolio-published',JSON.stringify(next));}catch{}}
      if(shared)this.shareTimer=setInterval(()=>{if(new URLSearchParams(location.search).get('draft')!==shared){if(this.shareTimer)clearInterval(this.shareTimer);return;}void this.supabase.rpc('portfolio_shared_draft',{token:shared}).catch(()=>{this.snapshot.set(fallback as Snapshot);this.sharedDenied.set(true);if(this.shareTimer)clearInterval(this.shareTimer);});},15000);
    }catch(error){
      if(shared){this.snapshot.set(fallback as Snapshot);this.sharedDenied.set(true);return this.snapshot();}
      if(preview)throw error;
      this.snapshot.set(fallback as Snapshot);
      try{const cached=JSON.parse(localStorage.getItem('portfolio-published')||'null');if(cached?.profile)this.snapshot.set(cached);}catch{}
    }
    return this.snapshot();
  }
  list(section:string){return this.request('/admin/'+section);}
  sharedPreview(){return new URLSearchParams(location.search).has('draft');}
  save(section:string,row:Partial<ContentRow>){
    const data=structuredClone(row.data||{});
    for(const field of ['content','summary','long_description'])if(typeof data[field]==='string')data[field]=DOMPurify.sanitize(data[field]);
    for(const field of ['features','extraFeatures'])if(Array.isArray(data[field]))data[field]=data[field].map((item:string)=>DOMPurify.sanitize(item));
    if(data['site_copy'])for(const value of Object.values(data['site_copy']) as any[])if(value&&typeof value==='object'&&value.html)value.html=DOMPurify.sanitize(value.html);
    return this.request('/admin/'+section+(row.id?'/'+row.id:''),{method:row.id?'PUT':'POST',body:JSON.stringify(section==='messages'?{is_read:row.is_read}:{data,position:row.position??0,version:row.version})});
  }
  remove(section:string,id:string){return this.request('/admin/'+section+'/'+id,{method:'DELETE'});}
  async upload(file:File){
    await this.session.ensure();
    const allowed=['image/jpeg','image/png','image/webp','image/avif','image/gif','image/svg+xml','application/pdf'];
    if(file.size>15*1024*1024||file.size===0)throw Error('Maximum upload size is 15 MB.');
    if(!allowed.includes(file.type))throw Error('Upload an image or PDF file.');
    file=await this.preparation.prepare(file);
    if(file.size>15*1024*1024)throw Error('Prepared image exceeds 15 MB.');
    const {data:{user},error:authError}=await this.supabase.client.auth.getUser();
    if(authError||!user)throw Error('Please sign in again.');
    const ext=file.name.split('.').pop()?.replace(/[^a-z0-9]/gi,'').toLowerCase()||'bin';
    const path=`uploads/${user.id}/${crypto.randomUUID()}.${ext}`;
    const bucket=this.supabase.client.storage.from('portfolio');
    const {error}=await bucket.upload(path,file,{contentType:file.type,upsert:false});if(error)throw Error(error.message);
    const url=bucket.getPublicUrl(path).data.publicUrl;
    await this.supabase.rpc('portfolio_admin',{action:'register_media',payload:{path,url,filename:file.name,content_type:file.type,size:file.size}});
    return url;
  }
}
