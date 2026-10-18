import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
@Injectable({providedIn:'root'})
export class SessionService {
  private readonly supabase=inject(SupabaseService);
  readonly userId=signal('');
  readonly accessToken=signal<string|null>(null);
  readonly mfaRequired=signal(false);
  private verifiedToken:string|null=null;private verifiedUntil=0;
  private verification:{token:string;promise:Promise<void>}|null=null;
  constructor(){this.supabase.client.auth.onAuthStateChange((_event,session)=>{this.userId.set(session?.user?.id||'');const token=session?.access_token||null;if(token!==this.verifiedToken){this.verifiedToken=null;this.verifiedUntil=0;}this.accessToken.set(token);});}
  async login(email:string,password:string){
    const {data,error}=await this.supabase.client.auth.signInWithPassword({email,password});
    if(error)throw Error(error.message);
    this.userId.set(data.session.user?.id||'');this.accessToken.set(data.session.access_token);
    const assurance=await this.supabase.client.auth.mfa.getAuthenticatorAssuranceLevel();
    if(assurance.data?.nextLevel==='aal2'&&assurance.data.currentLevel!=='aal2'){this.mfaRequired.set(true);return;}
    try { await this.ensure(); } catch(error){await this.logout();throw error;}
  }
  async ensure(){
    const {data,error}=await this.supabase.client.auth.getSession();
    if(error || !data.session){this.accessToken.set(null);throw Error('Please sign in to continue.');}
    this.accessToken.set(data.session.access_token);
    const token=data.session.access_token;
    // Coalesce parallel UI preflights. Every database/Storage operation still
    // independently enforces admin membership and MFA server-side through RLS.
    if(this.verifiedToken===token&&Date.now()<this.verifiedUntil)return;
    if(this.verification?.token===token)return this.verification.promise;
    const promise=(async()=>{
      const assurance=await this.supabase.client.auth.mfa.getAuthenticatorAssuranceLevel();
      if(assurance.data?.nextLevel==='aal2'&&assurance.data.currentLevel!=='aal2'){this.mfaRequired.set(true);throw Error('Enter your authenticator code to continue.');}
      this.mfaRequired.set(false);
      if(!await this.supabase.rpc('portfolio_is_admin')){await this.logout();throw Error('Admin access required. Your session may have expired.');}
      this.verifiedToken=token;this.verifiedUntil=Date.now()+10000;
    })();
    this.verification={token,promise};
    try{await promise;}finally{if(this.verification?.promise===promise)this.verification=null;}
  }
  async refresh(){
    const {data,error}=await this.supabase.client.auth.refreshSession();
    if(error || !data.session)throw Error('Please sign in again.');
    this.accessToken.set(data.session.access_token);await this.ensure();
  }
  async logout(){this.verifiedToken=null;this.verifiedUntil=0;const {error}=await this.supabase.client.auth.signOut({scope:'local'});this.accessToken.set(null);this.mfaRequired.set(false);if(error)throw Error(error.message);}
}
