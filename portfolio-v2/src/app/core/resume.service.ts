import {renderResume} from './resume-layout';
import {Injectable,inject} from '@angular/core';
import {CmsService,Snapshot} from './cms.service';
import {AnalyticsService} from './analytics.service';
@Injectable({providedIn:'root'})
export class ResumeService {
  private readonly cms=inject(CmsService);
  private readonly analytics=inject(AnalyticsService);
  private library:Promise<typeof import('jspdf')>|null=null;
  private cache:{key:string;blob:Blob}|null=null;
  prefetch(){return this.library??=import('jspdf');}
  async pdf(snapshot:Snapshot):Promise<Blob>{
    if(snapshot.profile['resume_mode']==='uploaded'){
      const url=snapshot.profile['resume_url'];if(!url)throw Error('Upload a resume PDF first.');const response=await fetch(url);if(!response.ok)throw Error('Resume file unavailable.');return response.blob();
    }
    const key=JSON.stringify(snapshot);if(this.cache?.key===key)return this.cache.blob;
    const {jsPDF}=await this.prefetch();const doc=new jsPDF({unit:'mm',format:'a4'});renderResume(doc,snapshot);
    const blob=doc.output('blob');this.cache={key,blob};return blob;
  }
  async download(snapshot=this.cms.snapshot(),preview=false,target?:Window|null){const tab=preview?(target||window.open('','_blank')):null;if(tab)tab.opener=null;try{if(preview&&!tab)throw Error('Allow popups to preview the PDF.');const blob=await this.pdf(snapshot),url=URL.createObjectURL(blob);if(preview)tab!.location.href=url;else{const a=document.createElement('a');a.href=url;a.download=(snapshot.profile['name']||'Resume')+'-Resume.pdf';document.body.append(a);a.click();a.remove();}setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(error){tab?.close();throw error;}}
  bind(root:ParentNode=document){const cleanup: (()=>void)[]=[];root.querySelectorAll<HTMLAnchorElement>('a[download],a[href*="CV.pdf"],a[href*="Resume.pdf"]').forEach(link=>{const prefetch=()=>{if(this.cms.snapshot().profile['resume_mode']!=='uploaded')void this.prefetch();};const click=async(event:Event)=>{event.preventDefault();if(link.getAttribute('aria-busy')==='true')return;const original=link.innerHTML;link.setAttribute('aria-busy','true');link.textContent='Preparing…';try{await this.download();this.analytics.event('resume','Resume download');}catch{link.textContent='Unable to prepare. Try again.';await new Promise(r=>setTimeout(r,2000));}finally{link.innerHTML=original;link.removeAttribute('aria-busy');}};for(const event of ['pointerenter','focus','touchstart'])link.addEventListener(event,prefetch,{passive:true});link.addEventListener('click',click);cleanup.push(()=>{for(const event of ['pointerenter','focus','touchstart'])link.removeEventListener(event,prefetch);link.removeEventListener('click',click);});});return()=>cleanup.forEach(fn=>fn());}
}
