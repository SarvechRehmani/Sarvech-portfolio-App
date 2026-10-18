import {Injectable,inject,signal} from '@angular/core';
import {SupabaseService} from './supabase.service';
@Injectable({providedIn:'root'}) export class AccountService{
 readonly supabase=inject(SupabaseService);readonly email=signal('');readonly factors=signal<any[]>([]);
 async load(){const {data,error}=await this.supabase.client.auth.getUser();if(error)throw Error(error.message);this.email.set(data.user?.email||'');const response=await this.supabase.client.auth.mfa.listFactors();if(response.error)throw Error(response.error.message);this.factors.set(response.data.all.filter(factor=>factor.factor_type==='totp'));}
 async updatePassword(password:string){if(password.length<12)throw Error('Use at least 12 characters for your password.');const {error}=await this.supabase.client.auth.updateUser({password});if(error)throw Error(error.message);}
 async updateEmail(email:string){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid email address.');const {error}=await this.supabase.client.auth.updateUser({email},{emailRedirectTo:location.origin+'/admin'});if(error)throw Error(error.message);}
 async enroll(){
  await this.load();for(const factor of this.factors().filter(f=>f.status==='unverified'))await this.supabase.client.auth.mfa.unenroll({factorId:factor.id});
  const {data,error}=await this.supabase.client.auth.mfa.enroll({factorType:'totp',friendlyName:'Portfolio authenticator',issuer:'Sarvech Portfolio'});if(error)throw Error(error.message);return data;
 }
 async verify(factorId:string,code:string){if(!/^\d{6}$/.test(code))throw Error('Enter the six-digit authenticator code.');const {error}=await this.supabase.client.auth.mfa.challengeAndVerify({factorId,code});if(error)throw Error(error.message);}
 async loginCode(code:string){await this.load();const factor=this.factors().find(f=>f.status==='verified');if(!factor)throw Error('No verified authenticator found.');await this.verify(factor.id,code);}
 async cancelEnrollment(id:string){const {error}=await this.supabase.client.auth.mfa.unenroll({factorId:id});if(error)throw Error(error.message);}
 async signOut(scope:'local'|'global'){const {error}=await this.supabase.client.auth.signOut({scope});if(error)throw Error(error.message);}
}
