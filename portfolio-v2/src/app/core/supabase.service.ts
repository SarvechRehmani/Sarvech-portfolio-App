import { Injectable, inject } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { ApiConfigService } from './api-config.service';
@Injectable({providedIn:'root'})
export class SupabaseService {
  private readonly config=inject(ApiConfigService);
  readonly client=createClient(this.config.supabaseUrl,this.config.supabasePublishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false,storageKey:'portfolio-supabase-auth'},
  });
  async rpc(name:string,args:Record<string,unknown>={}){
    const {data,error}=await this.client.rpc(name,args);
    if(error){if(error.code==='42501'&&['portfolio_admin','portfolio_manage','portfolio_studio'].includes(name))await this.client.auth.signOut({scope:'local'});throw Error(error.message);}
    return data;
  }
}
