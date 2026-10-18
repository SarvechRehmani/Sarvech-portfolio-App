import {Injectable,inject} from '@angular/core';
import {SessionService} from './session.service';
import {SupabaseService} from './supabase.service';
@Injectable({providedIn:'root'}) export class WorkspaceService{
 private session=inject(SessionService);private db=inject(SupabaseService);
 async call(action:string,payload:Record<string,unknown>={}){await this.session.ensure();return action==='backup_check'?this.db.rpc('portfolio_backup_check',{payload}):this.db.rpc('portfolio_workspace',{action,payload});}
}
