import {Injectable,inject} from '@angular/core';
import {SupabaseService} from './supabase.service';
import {ApiConfigService} from './api-config.service';
@Injectable({providedIn:'root'}) export class AnalyticsService {
 private readonly supabase=inject(SupabaseService);
 private readonly config=inject(ApiConfigService);
 private get disabled(){const query=new URLSearchParams(location.search);return query.has('draft')||query.has('preview')||location.hostname==='localhost'||/^127\./.test(location.hostname)||['::1','[::1]'].includes(location.hostname)||localStorage.getItem('no-track')==='1';}
 context(){const query=new URLSearchParams(location.search),ref=query.get('ref');if(ref&&/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ref.toLowerCase()))sessionStorage.setItem('portfolio-recruiter',ref.toLowerCase().slice(0,80));let id=sessionStorage.getItem('portfolio-session');if(!id){id=crypto.randomUUID();sessionStorage.setItem('portfolio-session',id);}let referrer='';try{referrer=new URL(document.referrer).hostname;}catch{}return {session_id:id,recruiter_ref:sessionStorage.getItem('portfolio-recruiter')||'',referrer,device:/iPad|Tablet/i.test(navigator.userAgent)?'tablet':/Mobi/i.test(navigator.userAgent)?'mobile':'desktop'};}
 event(type:string,label:string){if(this.disabled)return;const payload={type,label:label.slice(0,300),...this.context()};
  if(this.config.supabaseFunctionsKey){void fetch(this.config.supabaseUrl+'/functions/v1/portfolio-mail/analytics',{method:'POST',headers:{'Content-Type':'application/json',apikey:this.config.supabasePublishableKey,Authorization:'Bearer '+this.config.supabaseFunctionsKey},body:JSON.stringify({event:payload}),keepalive:true}).catch(()=>{});}
  else void this.supabase.rpc('portfolio_event',{payload}).catch(()=>{});
 }
 messageContext(){return this.disabled?{}:this.context();}
}
