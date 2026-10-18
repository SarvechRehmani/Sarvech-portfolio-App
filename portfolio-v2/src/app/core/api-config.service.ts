import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
@Injectable({providedIn:'root'})
export class ApiConfigService {
  private readonly http=inject(HttpClient);
  supabaseUrl=environment.supabaseUrl;
  supabasePublishableKey=environment.supabasePublishableKey;
  supabaseFunctionsKey='';
  async load(){
    try {
      const config=await firstValueFrom(this.http.get<{supabaseUrl:string;supabasePublishableKey:string;supabaseFunctionsKey?:string}>('/config.json'));
      if(config.supabaseUrl && /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) && config.supabasePublishableKey){
        this.supabaseUrl=config.supabaseUrl;this.supabasePublishableKey=config.supabasePublishableKey;this.supabaseFunctionsKey=config.supabaseFunctionsKey||'';
      }
    } catch { /* Built-in public connection settings keep local startup instant. */ }
  }
}
