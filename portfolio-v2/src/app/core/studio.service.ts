import {Injectable,inject} from '@angular/core';
import {SessionService} from './session.service';
import {SupabaseService} from './supabase.service';
@Injectable({providedIn:'root'}) export class StudioService{
 private readonly session=inject(SessionService);private readonly supabase=inject(SupabaseService);
 async call(action:string,payload:Record<string,any>={}){await this.session.ensure();return action==='restore_backup'?this.supabase.rpc('portfolio_backup_restore',{payload}):this.supabase.rpc('portfolio_studio',{action,payload});}
 async manage(action:string,payload:Record<string,any>={}){await this.session.ensure();return this.supabase.rpc('portfolio_manage',{action,payload});}
 async dispatchMail(){return this.manage('dispatch_worker');}
 async deleteFile(row:any){
  await this.session.ensure();
  const current=(await this.call('media')).find((item:any)=>item.id===row.id);
  if(!current?.unused)throw Error('This file is still used by content or history.');
  const {error}=await this.supabase.client.storage.from('portfolio').remove([current.storage_path]);if(error)throw Error(error.message);
  await this.call('delete_media_record',{id:row.id});
 }
}
