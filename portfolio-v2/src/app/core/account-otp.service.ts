import {Injectable,inject} from '@angular/core';
import {createClient} from '@supabase/supabase-js';
import {SupabaseService} from './supabase.service';
import {ApiConfigService} from './api-config.service';
@Injectable({providedIn:'root'})export class AccountOtpService{
 private readonly supabase=inject(SupabaseService);private readonly config=inject(ApiConfigService);
 private verifiedCurrent='';private currentExpiry=0;private recoveryToken='';private pendingRecovery=false;
 private validCode(code:string){if(!/^\d{6,10}$/.test(code.trim()))throw Error('Enter the verification code from your email.');return code.trim();}
 private validEmail(email:string){const normalized=email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))throw Error('Enter a valid email address.');return normalized;}
 async requestCurrentCode(email:string){
  this.verifiedCurrent='';this.currentExpiry=0;const {data,error}=await this.supabase.client.auth.getUser();if(error||!data.user)throw Error('Sign in again.');
  const current=this.validEmail(email);if(current!==data.user.email?.toLowerCase())throw Error('Enter your current login email.');
  const response=await this.supabase.client.auth.signInWithOtp({email:current,options:{shouldCreateUser:false}});if(response.error)throw Error(response.error.message);
 }
 async verifyCurrentCode(email:string,code:string){
  const current=this.validEmail(email),{data,error}=await this.supabase.client.auth.getUser();if(error||!data.user||current!==data.user.email?.toLowerCase())throw Error('Current account changed. Start again.');
  const proof=createClient(this.config.supabaseUrl,this.config.supabasePublishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  try{const response=await proof.auth.verifyOtp({email:current,token:this.validCode(code),type:'email'});if(response.error)throw Error(response.error.message);if(response.data.user?.id!==data.user.id)throw Error('Verify the signed-in account email.');this.verifiedCurrent=current;this.currentExpiry=Date.now()+600000;}
  finally{await proof.auth.signOut({scope:'local'});}
 }
 async requestNewEmail(email:string){
  const {data,error}=await this.supabase.client.auth.getUser();if(error||!data.user||this.verifiedCurrent!==data.user.email?.toLowerCase()||Date.now()>this.currentExpiry)throw Error('Verify your current email first.');
  const next=this.validEmail(email);if(next===this.verifiedCurrent)throw Error('Choose a different new email.');
  const response=await this.supabase.client.auth.updateUser({email:next},{emailRedirectTo:location.origin+'/admin/login'});if(response.error)throw Error(response.error.message);return next;
 }
 async confirmEmailCode(newEmail:string,code:string,final=false){
  const response=await this.supabase.client.auth.verifyOtp({email:this.validEmail(final?newEmail:this.verifiedCurrent),token:this.validCode(code),type:'email_change'});if(response.error)throw Error(response.error.message);
  if(final){const current=await this.supabase.client.auth.getUser();if(current.error||current.data.user?.email?.toLowerCase()!==newEmail.toLowerCase())throw Error('Both email addresses must be confirmed. Check the remaining confirmation code.');this.verifiedCurrent='';this.currentExpiry=0;}
 }
 async requestRecovery(email:string){const {error}=await this.supabase.client.auth.resetPasswordForEmail(this.validEmail(email),{redirectTo:location.origin+'/admin/login'});if(error)throw Error(error.message);}
 async verifyRecovery(email:string,code:string){
  const response=await this.supabase.client.auth.verifyOtp({email:this.validEmail(email),token:this.validCode(code),type:'recovery'});if(response.error)throw Error(response.error.message);
  return this.acceptRecovery();
 }
 async verifyRecoveryLink(token_hash:string){if(!/^[a-f0-9]{32,128}$/i.test(token_hash))throw Error('Invalid recovery link. Request a fresh email.');const response=await this.supabase.client.auth.verifyOtp({token_hash,type:'recovery'});if(response.error)throw Error(response.error.message);return this.acceptRecovery();}
 async verifyEmailLink(token_hash:string){if(!/^[a-f0-9]{32,128}$/i.test(token_hash))throw Error('Invalid email confirmation link.');const response=await this.supabase.client.auth.verifyOtp({token_hash,type:'email_change'});if(response.error)throw Error(response.error.message);}
 private async acceptRecovery(){
  this.pendingRecovery=true;this.recoveryToken='';const assurance=await this.supabase.client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(assurance.data?.nextLevel==='aal2'&&assurance.data.currentLevel!=='aal2')return 'mfa';
  await this.authorizeRecovery();return 'password';
 }
 async authorizeRecovery(){if(!this.pendingRecovery)throw Error('Verify the recovery email first.');if(!await this.supabase.rpc('portfolio_is_admin'))throw Error('An authorized admin account is required.');const {data}=await this.supabase.client.auth.getSession();this.recoveryToken=data.session?.access_token||'';if(!this.recoveryToken)throw Error('Recovery session expired.');}
 async completeRecovery(password:string){
  const {data}=await this.supabase.client.auth.getSession();if(!this.recoveryToken||data.session?.access_token!==this.recoveryToken)throw Error('Verify your recovery code again.');
  if(password.length<12)throw Error('Use at least 12 characters.');const {error}=await this.supabase.client.auth.updateUser({password});if(error)throw Error(error.message);await this.cancelRecovery();
 }
 async cancelRecovery(){if(this.pendingRecovery)await this.supabase.client.auth.signOut({scope:'local'});this.pendingRecovery=false;this.recoveryToken='';}
}
