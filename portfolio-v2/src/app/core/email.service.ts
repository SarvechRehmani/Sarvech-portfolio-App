import { Injectable, inject } from '@angular/core';
import { AnalyticsService } from './analytics.service';
import { SupabaseService } from './supabase.service';
export interface ContactMessage {name:string;email:string;subject:string;message:string;}
export class EmailFailure extends Error {constructor(readonly status:number){super('Message could not be sent');}}
@Injectable({providedIn:'root'}) export class EmailService {
  private readonly analytics=inject(AnalyticsService);
  private readonly supabase=inject(SupabaseService);
  async send(message:ContactMessage,signal:AbortSignal):Promise<void>{
    if(signal.aborted)throw new DOMException('Cancelled','AbortError');
    const {error}=await this.supabase.client.rpc('portfolio_contact',{payload:{...message,...this.analytics.messageContext()}}).abortSignal(signal);
    if(signal.aborted)throw new DOMException('Cancelled','AbortError');
    if(error)throw new EmailFailure(error.code==='P0001'?400:503);
  }
}
