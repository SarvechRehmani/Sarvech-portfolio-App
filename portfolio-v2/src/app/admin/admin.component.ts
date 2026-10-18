import {WorkspaceService} from '../core/workspace.service';
import {WorkspaceAlertsComponent} from './workspace-alerts.component';
import {VisitorJourneyComponent} from './visitor-journey.component';
import {EmailHistoryComponent} from './email-history.component';
import {ApiConfigService} from '../core/api-config.service';
import {PublishReviewComponent} from './publish-review.component';
import {DraftBuffer} from './draft-buffer';
import {compareReview,contentHealth,fieldChanges} from './editor-tools';
import {StudioSelectDirective} from './studio-select.directive';
import {CountUpDirective} from './count-up.directive';
import {MediaViewerComponent} from './media-viewer.component';
import {ToastService} from '../core/toast.service';
import {revealTheme,themeEffects} from '../core/theme-motion.js';
import {featuresToHtml,htmlToFeatures} from './feature-editor';
import {AccountOtpService} from '../core/account-otp.service';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {RichEditorComponent} from './rich-editor.component';
import {NgStyle} from '@angular/common';
import {studioPalette} from '../core/studio-palette';
import {SupabaseService} from '../core/supabase.service';
import { Component, inject, signal, DestroyRef, ChangeDetectorRef, effect, computed, untracked } from "@angular/core";
import {
  FormsModule,
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import DOMPurify from "dompurify";
import { CmsService, ContentRow } from "../core/cms.service";
import { ResumeService } from "../core/resume.service";
import { fields, Field } from "./fields";
import {StudioService} from '../core/studio.service';
import {AccountService} from '../core/account.service';
import {SessionService} from '../core/session.service';
import {BrandTheme,royalBlue,validateTheme} from '../core/brand';
@Component({
  selector: "portfolio-admin",
  imports: [WorkspaceAlertsComponent, VisitorJourneyComponent, EmailHistoryComponent, PublishReviewComponent, FormsModule, ReactiveFormsModule, NgStyle, DragDropModule, RichEditorComponent, StudioSelectDirective, CountUpDirective, MediaViewerComponent],
  templateUrl: "./admin.component.html",
  styleUrls: ["./studio.css", "./polish.css", "./finishing.css", "./refinement.css", "./inbox-controls.css", "./interaction-polish.css"],
})
export class AdminComponent {
  readonly cms = inject(CmsService);
  readonly studio=inject(StudioService);readonly workspace=inject(WorkspaceService);
  journeyLink=signal<any>(null);followupId="";followupLabels="";followupNotes="";followupAt="";followupDone=false;readonly backupReport=signal<any>(null);readonly backupChecks=signal<any[]>([]);private followupBaseline="";
  readonly account=inject(AccountService);readonly otp=inject(AccountOtpService);
  readonly toast=inject(ToastService);readonly themeEffects=themeEffects;
  readonly mediaSelection=signal<any>(null);connectionSource='';connectionSearch='';
  gallery(){return this.filteredMedia().filter(row=>row['content_type']?.startsWith('image/')||row['content_type']==='application/pdf');}
  openMedia(row:ContentRow){this.mediaSelection.set(row);}
  skillSource(){return (this.draft['names']||[]).includes(this.connectionSource)?this.connectionSource:this.draft['names']?.[0]||'';}
  skillChoices(){return [...new Set([...this.rows().flatMap(row=>row.data['names']||[]),...(this.draft['names']||[])])].filter(name=>name!==this.skillSource()&&name.toLowerCase().includes(this.connectionSearch.toLowerCase()));}
  skillConnected(name:string){return (this.draft['connections_by_skill']?.[this.skillSource()]||[]).includes(name);}
  skillConnectionCount(){return (this.draft['connections_by_skill']?.[this.skillSource()]||[]).length;}
  setSkillConnection(name:string,checked:boolean){const source=this.skillSource();if(!source)return;const map={...(this.draft['connections_by_skill']||{})},targets=new Set<string>(map[source]||[]);checked?targets.add(name):targets.delete(name);map[source]=[...targets].slice(0,7);this.draft['connections_by_skill']=map;}
  placeholder(field:Field){return field.placeholder||(/url|link|website/i.test(field.key)?'https://example.com':/email/i.test(field.key)?'you@example.com':field.type==='textarea'?'Write '+field.label.toLowerCase()+'…':'Enter '+field.label.toLowerCase()+'…');}
  chartTick(index:number,length:number){const step=length>60?14:length>15?7:1;return index===0||index===length-1||index%step===0;}
  metricLabel(key:string){return ({visits:'Visits',unique_visitors:'Visitor sessions',resume:'Resume downloads',projects:'Project clicks',social:'Social clicks',messages:'Messages'} as Record<string,string>)[key]||key;}
  metricIcon(key:string){return key==='resume'?'↓':key==='messages'?'✉':key==='projects'?'◇':key==='social'?'↗':key==='unique_visitors'?'◎':'↗';}
  private readonly config=inject(ApiConfigService);
  async checkLinks(){if(this.checkingLinks())return;this.checkingLinks.set(true);this.linkResults.set([]);try{await this.flushEditor();await this.session.ensure();const report=contentHealth((await this.supabase.rpc('portfolio_editor_review')).review);this.healthReport.set(report);for(let i=0;i<report.links.length;i+=8){const response=await fetch(this.config.supabaseUrl+'/functions/v1/portfolio-mail/health-links',{method:'POST',headers:{Authorization:'Bearer '+this.session.accessToken(),apikey:this.config.supabaseFunctionsKey||this.config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify({urls:report.links.slice(i,i+8)})});const data=await response.json();if(!response.ok)throw Error(data.error||'Link checking unavailable.');this.linkResults.update(rows=>[...rows,...data.results]);if(i+8<report.links.length)await new Promise(resolve=>setTimeout(resolve,1300));}}catch(error){this.noticeError.set(true);this.notice.set(error instanceof Error?error.message:'Link check failed.');}finally{this.checkingLinks.set(false);}}
  linkResultCount(status:string){return this.linkResults().filter(row=>row.status===status).length;}
  linkFilter='all';filteredLinkResults(){return this.linkResults().filter(row=>this.linkFilter==='all'||row.status===this.linkFilter);}
  readonly healthReport=signal<{issues:any[];links:string[]}>({issues:[],links:[]});readonly linkResults=signal<any[]>([]);readonly checkingLinks=signal(false);
  skillGroups(){const available=new Set(this.skillChoices());const groups=this.rows().filter(r=>r.id!==this.editingId).map(r=>({title:r.data['title'],names:(r.data['names']||[]).filter((n:string)=>available.has(n))}));groups.unshift({title:this.draft['title']||'This category',names:(this.draft['names']||[]).filter((n:string)=>available.has(n))});return groups.filter(g=>g.names.length);}
  readonly askImageDescription=()=>this.promptAction('Describe this image','Add useful text for screen readers and search engines.','text','Save description');
  readonly noticeError=signal(false);
  get unreadMessages(){return this.rows().filter(row=>!row['is_read']&&!row['is_spam']).length;}
  showPassword=false;recoveryStep='';recoveryEmail='';recoveryCode='';recoveryPassword='';recoveryConfirm='';
  emailStep='current';currentEmail='';emailCode='';pendingEmail='';
  private linkHash='';
  async acceptEmailLink(){await this.run(async()=>{if(this.recoveryStep==='email_link'){await this.otp.verifyEmailLink(this.linkHash);this.notice.set('Confirmation accepted. Supabase requires both old and new addresses to confirm the change.');this.recoveryStep='';}else{this.recoveryStep=await this.otp.verifyRecoveryLink(this.linkHash);}this.linkHash='';history.replaceState(null,'',location.pathname);});}
  async sendRecovery(){await this.run(async()=>{await this.otp.requestRecovery(this.recoveryEmail);this.recoveryStep='code';this.notice.set('If this account is registered, a recovery code has been sent.');});}
  async verifyRecovery(){await this.run(async()=>{this.recoveryStep=await this.otp.verifyRecovery(this.recoveryEmail,this.recoveryCode);this.recoveryCode='';});}
  async recoveryMfa(){await this.run(async()=>{await this.account.loginCode(this.recoveryCode);await this.otp.authorizeRecovery();this.recoveryStep='password';this.recoveryCode='';});}
  async saveRecoveryPassword(){if(this.recoveryPassword!==this.recoveryConfirm){this.notice.set('Passwords do not match.');return;}await this.run(async()=>{await this.otp.completeRecovery(this.recoveryPassword);this.recoveryPassword='';this.recoveryConfirm='';this.recoveryStep='';this.loginForm.controls.password.reset();this.notice.set('Password updated. Sign in with your new password.');});}
  async cancelRecovery(){await this.otp.cancelRecovery();this.recoveryStep='';this.recoveryCode='';this.recoveryPassword='';this.recoveryConfirm='';}
  async sendCurrentEmail(){await this.run(async()=>{await this.otp.requestCurrentCode(this.currentEmail);this.emailStep='current_code';this.notice.set('Verification code sent to your current email.');});}
  async verifyCurrentEmail(){await this.run(async()=>{await this.otp.verifyCurrentCode(this.currentEmail,this.emailCode);this.emailCode='';this.emailStep='new';this.notice.set('Current email verified. Enter your new email.');});}
  async sendNewEmail(){await this.run(async()=>{this.pendingEmail=await this.otp.requestNewEmail(this.newEmail);this.emailStep='secure_current';this.notice.set('Supabase sent separate confirmation codes to both addresses. Confirm the current address, then the new address.');});}
  async confirmCurrentChange(){await this.run(async()=>{await this.otp.confirmEmailCode(this.pendingEmail,this.emailCode);this.emailCode='';this.emailStep='new_code';});}
  async confirmNewChange(){await this.run(async()=>{await this.otp.confirmEmailCode(this.pendingEmail,this.emailCode,true);await this.account.load();this.emailStep='current';this.emailCode='';this.newEmail='';this.pendingEmail='';this.notice.set('Login email changed after both addresses were confirmed.');});}
  readonly session=inject(SessionService);
  private readonly resume = inject(ResumeService);
  private readonly router = inject(Router);
  readonly loginForm = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  readonly tabs = [
    ["recruiters", "Recruiter links"],
    ["activity", "Login activity"],
    ["dashboard", "Overview"],
    ["profile", "Profile & Hero"],
    ["resume", "Resume"],
    ["layout", "Layout & brand"],
    ["sharing", "Share a draft"],["health","Content health"],
    ["focus_items", "What I do"],
    ["jobs", "Experience"],
    ["projects", "Projects"],
    ["skill_groups", "Skills"],
    ["education", "Education"],
    ["certificates", "Certificates"],
    ["testimonials", "Testimonials"],
    ["blog_posts", "Blog"],
    ["messages", "Messages"],["email_history","Email history"],
    ["media", "Media"],
    ["analytics", "Analytics"],
    ["content_history", "History & backup"],
    ["account", "Account & security"],
  ];
  readonly overview = signal<Record<string, any> | null>(null);
  readonly loading = signal(false);
  readonly themes=signal<BrandTheme[]>([]);
  layoutDraft:any={sections:[]};
  maintenanceAutoEnd=false;maintenanceEndLocal='';readonly deviceTimezone=Intl.DateTimeFormat().resolvedOptions().timeZone;
  maintenanceLocal(value:string|null|undefined){const date=new Date(value||'');return Number.isFinite(date.getTime())?new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16):'';}
  loadMaintenanceTime(){this.maintenanceAutoEnd=!!this.layoutDraft.maintenance_until;this.maintenanceEndLocal=this.maintenanceLocal(this.layoutDraft.maintenance_until);}
  maintenanceEndPassed(){return !!this.maintenanceEndLocal&&new Date(this.maintenanceEndLocal).getTime()<=Date.now();}
  readonly links=signal<any[]>([]);
  readonly state=signal<any>({});readonly scheduleNotice=signal('');
  readonly pdfBusy=signal(false);
  readonly modal=signal<{title:string;message:string;danger?:boolean;input?:string;label:string;resolve:(value:string|false)=>void}|null>(null);
  modalValue='';
  historyPage=1;historySize=5;historyTotal=0;
  mediaPage=1;mediaSize=8;mediaFilter='all';linkLabel='Feedback preview';linkHours=24;createdLink='';
  newPassword='';confirmPassword='';newEmail='';authCode='';enrollment:any=null;
  layoutDrag=-1;
  readonly sectionLabels:Record<string,string>={about:'About & what I do',experience:'Experience',education:'Education',skills:'Skills',projects:'Projects',certificates:'Certificates',contact:'Contact',additional:'Soft skills & languages',testimonials:'Testimonials',blog:'Blog link'};
  search = "";
  messageFilter = "all";
  editingVersion: number | undefined;
  readonly active = signal("profile");
  readonly rows = signal<ContentRow[]>([]);
  readonly notice = signal("");
  readonly busy = signal(false);
  readonly editing = signal(false);
  readonly dirty = signal(false);
  readonly authenticated = signal(false);
  readonly stats = signal<any>(null);
  readonly light = signal(localStorage.getItem('studio-appearance') !== 'dark');
  readonly checkingSession=signal(true);
  readonly sidebarOpen=signal(false);
  readonly publishedTheme=signal<BrandTheme>(royalBlue);
  readonly adminVariables=computed(()=>studioPalette(this.publishedTheme(),this.light()));
  private readonly supabase=inject(SupabaseService);
  private themePublication='';
  private themeRequest:Promise<void>|null=null;
  loadPublishedTheme(force=false):Promise<void>{if(force&&this.themeRequest)return this.themeRequest.then(()=>this.loadPublishedTheme());return this.themeRequest??=this.supabase.rpc('portfolio_site').then(site=>{this.publishedTheme.set(site.layout?.theme||royalBlue);this.publishedMotion.set(site.layout?.theme_transition||'none');this.ownerName.set(site.profile?.name||'');}).catch(()=>{}).finally(()=>this.themeRequest=null);}
  readonly navGroups=[
    {label:'',keys:['dashboard']},
    {label:'Content',keys:['profile','resume','focus_items','jobs','projects','skill_groups','education','certificates','testimonials','blog_posts']},
    {label:'Site',keys:['layout','sharing','recruiters','health']},
    {label:'Inbox & data',keys:['messages','email_history','analytics','media','content_history']},
    {label:'Security',keys:['account','activity']}
  ];
  groupTabs(keys:string[]){return keys.map(key=>this.tabs.find(tab=>tab[0]===key)!);}
  readonly themeTransition=signal(false);
  readonly publishedMotion=signal('none');private readonly appearanceView=inject(ChangeDetectorRef);private appearanceBusy=false;
  private themeTimer:ReturnType<typeof setTimeout>|null=null;
  async toggleAppearance(event?:Event){
    if(this.appearanceBusy)return;
    const apply=()=>{this.light.update(value=>!value);try{localStorage.setItem('studio-appearance',this.light()?'light':'dark');}catch{}this.appearanceView.detectChanges();};
    const effect=this.active()==='layout'?(this.layoutDraft.theme_transition||'none'):this.publishedMotion();
    if(effect==='none'||matchMedia('(prefers-reduced-motion: reduce)').matches){apply();return;}
    const button=event?.currentTarget as HTMLElement;
    if(!button){apply();return;}
    this.appearanceBusy=true;
    try{if(!await revealTheme(button,effect,apply)){this.themeTransition.set(true);apply();if(this.themeTimer)clearTimeout(this.themeTimer);this.themeTimer=setTimeout(()=>this.themeTransition.set(false),300);}}finally{this.appearanceBusy=false;}
  }

  readonly askEditorLink=()=>this.promptAction('Insert a link','Enter an HTTP or HTTPS address.','url','Insert link');
  operationKind(operation:unknown){const value=String(operation||'').toLowerCase();return /create|insert/.test(value)?'created':/delet/.test(value)?'deleted':'updated';}
  contentTitle(value:unknown){const key=String(value||'');return this.tabs.find(tab=>tab[0]===key)?.[1]||String(value||'Content').replace(/<[^>]*>/g,' ').replace(/_/g,' ').trim();}
  historyKind(row:ContentRow){const op=String(row['operation']||'').toLowerCase();return /creat|insert/.test(op)?'created':/delet/.test(op)?'deleted':'updated';}
  linkExpired(link:any){return !!link.revoked_at||new Date(link.expires_at).getTime()<=Date.now();}
  email = "";
  password = "";
  days = 30;
  draft: Record<string, any> = {};
  editingId = "";
  position = 0;
  dragIndex = -1;
  richInitial: Record<string, string> = {};
  readonly autosave=new DraftBuffer<any>(()=>this.appearanceView.markForCheck(),localStorage);
  private layoutBaseline:any;private trackingEditor=false;private changeQueued=false;
  tracking(){return this.trackingEditor;}
  private snapshotEditor(){return this.active()==='layout'?{layout:structuredClone(this.layoutDraft),autoEnd:this.maintenanceAutoEnd,endLocal:this.maintenanceEndLocal}:{data:structuredClone(this.draft)};}
  editorChanged(){if(this.changeQueued)return;this.changeQueued=true;queueMicrotask(()=>{this.changeQueued=false;if(this.trackingEditor&&!this.loading())this.autosave.update(this.snapshotEditor());});}
  private beginEditor(){const section=this.active(),table=this.table;this.trackingEditor=true;this.autosave.start('portfolio-editor:'+this.session.userId()+':'+section+':'+(this.editingId||'new'),this.snapshotEditor(),async value=>{
    if(section==='layout'){const payload={...value.layout};let until=null;if(value.autoEnd){const date=new Date(value.endLocal);if(!value.endLocal||!Number.isFinite(date.getTime()))throw Error('Choose a valid maintenance end date.');if(date.getTime()<=Date.now()&&value.endLocal!==this.maintenanceLocal(this.layoutBaseline?.maintenance_until))throw Error('Choose an end time in the future.');until=value.endLocal===this.maintenanceLocal(this.layoutBaseline?.maintenance_until)?this.layoutBaseline?.maintenance_until:date.toISOString();}payload.maintenance_until=until;this.layoutBaseline=await this.supabase.rpc('portfolio_save_layout_checked',{expected:this.layoutBaseline,payload});}
    else{const data=value.data;if(table==='skill_groups'){const map=data.connections_by_skill||{};data.connections_by_skill=Object.fromEntries((data.names||[]).map((name:string)=>[name,(map[name]||[]).filter((target:string)=>target!==name).slice(0,7)]));}if(!(data[table==='profile'||table==='testimonials'?'name':'title']||'').trim())throw Error('Complete the required name or title to sync this draft.');if(fields[section]?.some(f=>f.key==='slug')&&!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug||''))throw Error('Enter a valid URL slug to sync this draft.');const row=await this.cms.save(table,{id:this.editingId||undefined,data,position:this.position,version:this.editingVersion});this.editingVersion=row.version;this.editingId=row.id;this.rows.update(rows=>rows.some(r=>r.id===row.id)?rows.map(r=>r.id===row.id?row:r):[...rows,row]);this.autosave.rekey('portfolio-editor:'+this.session.userId()+':'+section+':'+row.id);}
    this.dirty.set(true);
  });}
  async flushEditor(){if(this.trackingEditor)this.autosave.update(this.snapshotEditor());await this.autosave.flush();}
  async canLeaveEditor(){if(this.followupDirty()){try{await this.persistFollowup();}catch(e){this.toast.show(e instanceof Error?e.message:'Private follow-up could not save. Stay and retry.','error');return false;}}if(!this.trackingEditor)return true;try{await this.flushEditor();return true;}catch{return this.confirmAction('Keep recovery and leave?','This draft could not sync. A recovery copy is kept on this device. Stay to retry, or leave and restore it later.','Keep recovery & leave');}}
  async closeEditor(){if(!await this.canLeaveEditor())return;this.trackingEditor=false;this.autosave.stop();this.editing.set(false);}
  recoveryFields(){return this.autosave.recovery?fieldChanges({},this.autosave.recovery).filter(field=>field.after).slice(0,8):[];}
  restoreRecovery(){const value=this.autosave.recovery;if(!value)return;if(this.active()==='layout'){this.layoutDraft=structuredClone(value.layout);this.maintenanceAutoEnd=value.autoEnd;this.maintenanceEndLocal=value.endLocal;}else{this.editing.set(false);this.appearanceView.detectChanges();this.draft=structuredClone(value.data);this.refreshRich();this.editing.set(true);}this.autosave.recovery=null;this.editorChanged();this.appearanceView.markForCheck();}
  private refreshRich(){this.richInitial={};for(const field of this.currentFields){if(field.type==='rich')this.richInitial[field.key]=this.draft[field.key]||'';if(field.type==='rich-list')this.richInitial[field.key]=featuresToHtml(this.draft[field.key]||[]);}}
  constructor() {
    const unload=(event:BeforeUnloadEvent)=>{if(this.followupDirty()){event.preventDefault();event.returnValue='';}if(this.trackingEditor){this.autosave.update(this.snapshotEditor());this.autosave.persist();if(this.autosave.unsaved){event.preventDefault();event.returnValue='';}}};
    window.addEventListener('beforeunload',unload);inject(DestroyRef).onDestroy(()=>{window.removeEventListener('beforeunload',unload);this.autosave.stop();});
    effect(()=>{const message=this.notice();if(message){const kind=this.noticeError()?'error':/saved|published|copied|updated|created|restored|confirmed|enabled|queued/i.test(message)?'success':'info';untracked(()=>{this.toast.show(message,kind);this.notice.set('');});}});
    void this.loadPublishedTheme();
    const mobile=window.matchMedia('(max-width:680px)');
    const closeDesktopDrawer=()=>{if(!mobile.matches)this.sidebarOpen.set(false);};
    mobile.addEventListener('change',closeDesktopDrawer);
    inject(DestroyRef).onDestroy(()=>mobile.removeEventListener('change',closeDesktopDrawer));
    effect(()=>{if(this.authenticated()&&!this.session.accessToken()){this.authenticated.set(false);this.cms.clearPrivate();this.notice.set('Your session expired. Please sign in again.');void this.router.navigateByUrl('/admin/login');}});
    const authQuery=new URLSearchParams(location.search||location.hash.slice(1));
    if(authQuery.has('token_hash')&&['recovery','email_change'].includes(authQuery.get('type')||'')){this.linkHash=authQuery.get('token_hash')||'';this.recoveryStep=authQuery.get('type')==='recovery'?'recovery_link':'email_link';}
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.append(meta);
    inject(DestroyRef).onDestroy(() => meta.remove());
    void this.cms
      .verify()
      .then(() => {
        if(this.recoveryStep==='recovery_link'||this.recoveryStep==='email_link')return;
        this.authenticated.set(true);
        localStorage.setItem("no-track", "1");
        return this.open("dashboard");
      })
      .catch(() => {}).finally(()=>this.checkingSession.set(false));
  }
  readonly tabIcons: Record<string, string> = {
    dashboard: "ph-squares-four",
    profile: "ph-user-circle",
    resume: "ph-file-text",
    focus_items: "ph-code",
    jobs: "ph-briefcase",
    projects: "ph-stack",
    skill_groups: "ph-atom",
    education: "ph-graduation-cap",
    certificates: "ph-certificate",
    testimonials: "ph-quotes",
    blog_posts: "ph-notebook",
    messages: "ph-envelope",
    media: "ph-images",
    analytics: "ph-chart-bar",
    content_history: "ph-clock-counter-clockwise",
  };
  readonly tabPaths: Record<string, string> = {email_history:"M3 5h18v14H3z M3 5l9 7 9-7 M16 14h3",health:'M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6',
    recruiters: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M16 4h6m-3-3v6M17 13h5m-5 4h5",
    activity: "M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7zM8 12l3 3 5-6",
    layout:'M3 3h18v18H3z M3 9h18 M9 9v12',
    sharing:'M10 13a5 5 0 0 0 7 0l4-4a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7 0l-4 4a5 5 0 0 0 7 7l2-2',
    account:'M12 2 3 6v6c0 6 9 10 9 10s9-4 9-10V6z M8 12l3 3 5-6',
    dashboard: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    profile: "M20 21v-2a7 7 0 0 0-14 0v2 M12 3a4 4 0 1 0 0 8a4 4 0 0 0 0-8",
    resume: "M14 2H5v20h14V7z M14 2v5h5 M8 12h8 M8 16h8",
    focus_items: "m8 6-6 6 6 6 m8-12 6 6-6 6 M14 4l-4 16",
    jobs: "M8 7V4h8v3 M3 7h18v14H3z M3 12h18 M10 11v4h4v-4",
    projects: "m12 3 10 5-10 5L2 8z M2 12l10 5 10-5 M2 16l10 5 10-5",
    skill_groups:
      "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18 M3 12h18 M12 3c-6 5-6 13 0 18 M12 3c6 5 6 13 0 18",
    education: "m2 9 10-5 10 5-10 5z M6 11v6c4 3 8 3 12 0v-6 M22 9v9",
    certificates: "M12 2a7 7 0 1 0 0 14a7 7 0 0 0 0-14 M8 15l-1 7 5-3 5 3-1-7",
    testimonials:
      "M3 5h7v7H3V5 M3 12v3c0 3 3 4 5 4 M14 5h7v7h-7V5 M14 12v3c0 3 3 4 5 4",
    blog_posts:
      "M5 3h15v18H5z M3 7h4 M3 12h4 M3 17h4 M10 7h6 M10 11h6 M10 15h4",
    messages: "M3 5h18v14H3z m0 0 9 7 9-7",
    media: "M3 3h18v18H3z M3 17l6-6 5 5 3-3 4 4 M15 7h.01",
    analytics: "M3 3v18h18 M7 17v-5 M12 17V7 M17 17V3",
    content_history: "M3 11a9 9 0 1 1 3 8 M3 3v8h8 M12 7v5l3 2",
  };
  get activeTitle() {
    return this.tabs.find((tab) => tab[0] === this.active())?.[1] || "Content";
  }
  copyLabel(selector: string) {
    const labels: Record<string, string> = {
      ".about-copy h3": "About introduction",
      ".contact-copy h2": "Contact heading",
      ".hero-copy>.eyebrow": "Hero greeting",
      "#about .section-heading h2": "About heading",
      "#skills .section-heading h2": "Skills heading",
      "#projects .section-heading h2": "Projects heading",
      ".contact-copy>p:not(.eyebrow)": "Contact introduction",
      ".hero-topline>span:last-child": "Portfolio edition",
      "#education .section-heading h2": "Education heading",
      "#experience .section-heading h2": "Experience heading",
      "#certificates .section-heading h2": "Certificates heading",
    };
    return labels[selector] || "Additional website text";
  }
  recordRows(key: string): Record<string, any>[] {
    return this.draft[key] || [];
  }
  addRecord(key: string) {
    this.draft[key] = [...this.recordRows(key), {}];
  }
  removeRecord(key: string, index: number) {
    this.draft[key] = this.recordRows(key).filter((_, i) => i !== index);
  }
  objectValue(key: string, child: string) {
    return this.draft[key]?.[child] || "";
  }
  setObjectValue(key: string, child: string, value: string) {
    this.draft[key] = { ...(this.draft[key] || {}), [child]: value };
  }
  copyRows() {
    return Object.entries(this.draft["site_copy"] || {}).map(
      ([selector, value]) => ({
        selector,
        text: typeof value === "string" ? value : (value as any)?.text || "",
      }),
    );
  }
  updateCopy(selector: string, value: string) {
    this.draft["site_copy"] = {
      ...(this.draft["site_copy"] || {}),
      [selector]: value,
    };
  }
  thumbnail(row: ContentRow) {
    return (
      row.data?.["images"]?.[0] ||
      row.data?.["image"] ||
      row.data?.["avatar"] ||
      ""
    );
  }
  get currentFields() {
    return fields[this.active()] || [];
  }
  get table() {
    return this.active() === "resume" ? "profile" : this.active();
  }
  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.noticeError.set(true);this.notice.set("Enter a valid email and your password to continue.");
      return;
    }
    await this.run(async () => {
      const value = this.loginForm.getRawValue();
      await this.cms.login(value.email, value.password);
      if(this.session.mfaRequired()){this.loginForm.controls.password.reset();this.notice.set('Enter the six-digit code from your authenticator app.');return;}
      this.loginForm.controls.password.reset();
      this.authenticated.set(true);
      await this.router.navigateByUrl("/admin");
      await this.open("dashboard");
    });
  }
  async signOut() {
    if(!await this.canLeaveEditor())return;this.trackingEditor=false;this.autosave.stop();
    await this.cms.logout();
    this.authenticated.set(false);
    this.rows.set([]);
    await this.router.navigateByUrl("/admin/login");
  }
  async run(action: () => Promise<any>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.notice.set("");
    this.noticeError.set(false);
    try {
      await action();
    } catch (e) {
      if(e instanceof Error&&e.name==='UploadCancelled')return;
      this.noticeError.set(true);
      this.notice.set(e instanceof Error ? e.message : "Request failed");
    } finally {
      this.busy.set(false);this.editorChanged();
    }
  }
  async open(tab: string) {
    if(!await this.canLeaveEditor())return;this.trackingEditor=false;this.autosave.stop();
    this.sidebarOpen.set(false);this.active.set(tab);this.editing.set(false);this.notice.set('');this.rows.set([]);this.loading.set(true);this.search='';
    try{
      const content=tab==='dashboard'?Promise.all([this.cms.request('/admin/dashboard'),this.cms.request('/admin/analytics?days=7'),this.studio.manage('health'),this.supabase.rpc('portfolio_schedule_notice')]):
        tab==='analytics'?Promise.all([this.cms.request('/admin/analytics?days='+this.days),this.studio.manage('socials',{days:this.days}),this.studio.manage('geography',{days:this.days})]):
        tab==='email_history'?Promise.resolve({}):tab==='health'?this.supabase.rpc('portfolio_editor_review'):tab==='layout'?Promise.all([this.studio.call('layout'),this.studio.call('themes')]):
        tab==='messages'?Promise.all([this.studio.manage('messages'),this.studio.manage('contact_state')]):
        tab==='recruiters'?this.studio.manage('recruiters'):
        tab==='activity'?Promise.all([this.studio.manage('activity'),this.studio.manage('geo_settings')]):
        tab==='account'?Promise.all([this.account.load(),this.studio.manage('geo_settings')]):
        tab==='sharing'?this.studio.call('links'):
        tab==='content_history'?Promise.all([this.studio.call('history',{page:this.historyPage,size:this.historySize}),this.workspace.call('backup_checks')]):
        tab==='media'?this.studio.call('media'):this.cms.list(tab==='resume'?'profile':tab);
      const [state,result,counts]=await Promise.all([this.studio.call('state'),content,this.studio.manage('counts')]);
      this.counts.set(counts);
      if(this.active()!==tab)return;
      this.state.set(state);this.dirty.set(!state?.published_at||new Date(state.draft_updated_at)>new Date(state.published_at));
      if(state.published_at!==this.themePublication){this.themePublication=state.published_at;void this.loadPublishedTheme();}
      if(tab==='dashboard'){this.overview.set(result[0]);this.stats.set(result[1]);this.health.set(result[2]);this.scheduleNotice.set(result[3]||'');}
      else if(tab==='analytics'){this.stats.set(result[0]);this.socialStats.set(result[1]);this.geography.set(result[2]);}
      else if(tab==='messages'){this.rows.set(result[0]);this.contactState.set(result[1]);this.selectedMessages.clear();}
      else if(tab==='recruiters')this.recruiters.set(result);
      else if(tab==='activity'){this.activity.set(result[0]);this.geoEnabled.set(result[1].enabled);}
      else if(tab==='account')this.geoEnabled.set(result[1].enabled);
      else if(tab==='health'){this.healthReport.set(contentHealth(result.review));}else if(tab==='layout'){this.layoutDraft=structuredClone(result[0]);this.layoutBaseline=structuredClone(result[0]);this.loadMaintenanceTime();this.themes.set(result[1]);this.editingId='layout';this.beginEditor();}
      else if(tab==='sharing')this.links.set(result);
      else if(tab==='content_history'){this.rows.set(result[0].items);this.historyTotal=result[0].total;this.backupChecks.set(result[1]);}
      else if(!['account','email_history'].includes(tab)){this.rows.set(result);if(['profile','resume'].includes(tab))await this.edit(result[0],true);}
    }catch(e){if(this.active()===tab)this.notice.set(e instanceof Error?e.message:String(e));}
    finally{if(this.active()===tab)this.loading.set(false);}
  }
  async edit(row?: ContentRow,skipGuard=false) {
    if(!skipGuard&&!await this.canLeaveEditor())return;
    this.editingId = row?.id || "";
    this.editingVersion = row?.version;
    this.position = row?.position ?? this.rows().length;
    this.draft = structuredClone(row?.data || {});
    this.connectionSource='';this.connectionSearch='';
    this.richInitial = {};
    for (const field of this.currentFields)
      if (field.type === "rich")
        this.richInitial[field.key] = this.draft[field.key] || "";
    for (const field of this.currentFields)
      if (field.type === "rich-list") this.richInitial[field.key] = featuresToHtml(this.draft[field.key] || []);
    this.editing.set(true);this.beginEditor();
  }
  setFeatures(key:string,html:string){this.draft[key]=htmlToFeatures(html);}
  listValue(key: string) {
    return (this.draft[key] || []).join("\n");
  }
  setList(key: string, value: string) {
    this.draft[key] = value
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  slug(title: string) {
    return title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  titleChanged() {
    if (!this.editingId && this.currentFields.some((f) => f.key === "slug"))
      this.draft["slug"] = this.slug(this.draft["title"] || "");
  }
  async save(){await this.run(async()=>{await this.flushEditor();this.notice.set('Draft saved. Review and Publish to update the website.');});}
  async remove(row: ContentRow) {
    if (!await this.confirmAction('Delete this item?','Content can be restored from History.','Delete item',true)) return;
    await this.run(async () => {
      await this.cms.remove(this.table, row.id);
      await this.open(this.active());
    });
  }
  readonly review=signal<any>(null);reviewMode='publish';reviewDate='';readonly reviewChanges=computed(()=>this.review()?compareReview(this.review().review):[]);
  async showReview(mode:string){await this.run(async()=>{await this.flushEditor();this.reviewMode=mode;this.review.set(await this.supabase.rpc('portfolio_editor_review'));});}
  publish(){return this.showReview('publish');}
  async confirmReview(){await this.run(async()=>{await this.flushEditor();const at=this.reviewMode==='schedule'?new Date(this.reviewDate):null;if(at&&!Number.isFinite(at.getTime()))throw Error('Choose a valid future publication time.');await this.supabase.rpc('portfolio_apply_review',{action:this.reviewMode,expected:this.review().hash,publish_at:at?.toISOString()||null});this.review.set(null);this.state.set(await this.studio.call('state'));if(this.reviewMode==='publish'){this.dirty.set(false);await this.loadPublishedTheme(true);}this.notice.set(this.reviewMode==='publish'?'Reviewed changes published.':'Reviewed draft scheduled. Further edits will require a new review.');});}
  async reorder(from: number, to: number) {
    if (this.busy() || to < 0 || to >= this.rows().length || from === to) return;
    const before=[...this.rows()];const rows = [...before];
    rows.splice(to, 0, rows.splice(from, 1)[0]);this.rows.set(rows);
    await this.run(async () => {
      try{await this.cms.request("/admin/reorder/" + this.table, {
        method: "POST",
        body: JSON.stringify(rows.map((r) => r.id)),
      });}catch(error){this.rows.set(before);throw error;}
      this.rows.set(rows);
      this.dirty.set(true);
    });
  }
  drop(index: number, event: DragEvent) {
    event.preventDefault();
    if (this.dragIndex >= 0) void this.reorder(this.dragIndex, index);
    this.dragIndex = -1;
  }
  async upload(event: Event, field: Field) {
    const input=event.target as HTMLInputElement,files=Array.from(input.files||[]);input.value='';
    if (!files.length) return;
    await this.run(async () => {
      const urls = [];
      for (const file of Array.from(files)){
        if(field.key==='resume_url'&&file.type!=='application/pdf')throw Error('Choose a PDF for the uploaded resume.');
        if(field.key!=='resume_url'&&!file.type.startsWith('image/'))throw Error('Choose an image for this field.');
        urls.push(await this.cms.upload(file));
      }
      if (field.type === "images")
        this.draft[field.key] = [...(this.draft[field.key] || []), ...urls];
      else this.draft[field.key] = urls[0];
    });
  }
  moveImage(key: string, from: number, to: number) {
    const images = [...(this.draft[key] || [])];
    if (to < 0 || to >= images.length) return;
    images.splice(to, 0, images.splice(from, 1)[0]);
    this.draft[key] = images;
  }
  cover(key: string, index: number) {
    const images = [...(this.draft[key] || [])];
    images.unshift(images.splice(index, 1)[0]);
    this.draft[key] = images;
  }
  removeImage(key: string, index: number) {
    this.draft[key] = (this.draft[key] || []).filter(
      (_: any, i: number) => i !== index,
    );
  }
  command(command: string) {
    document.execCommand(command, false);
  }
  async link() {
    const url = await this.promptAction('Insert a link','Enter a full HTTPS website address.','url','Insert link');
    if (url && /^https?:\/\//.test(url))
      document.execCommand("createLink", false, url);
  }
  block(tag: string) {
    document.execCommand("formatBlock", false, tag);
  }
  paste(event: ClipboardEvent) {
    event.preventDefault();
    document.execCommand(
      "insertText",
      false,
      event.clipboardData?.getData("text/plain") || "",
    );
  }
  async inlineImage(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    await this.run(async () => {
      const url = await this.cms.upload(file);
      if (this.editorRange) {
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(this.editorRange);
        const node = this.editorRange.commonAncestorContainer;
        const element =
          node.nodeType === Node.ELEMENT_NODE
            ? (node as HTMLElement)
            : node.parentElement;
        element?.closest<HTMLElement>(".rich-editor")?.focus();
      }
      document.execCommand("insertImage", false, url);
    });
  }
  private editorRange: Range | null = null;
  rememberSelection() {
    const selection = window.getSelection();
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer;
      const element =
        node.nodeType === Node.ELEMENT_NODE
          ? (node as Element)
          : node.parentElement;
      if (element?.closest(".rich-editor"))
        this.editorRange = range.cloneRange();
    }
  }
  richInput(key: string, event: Event) {
    this.draft[key] = (event.target as HTMLElement).innerHTML;
  }
  async analytics() {await this.run(async()=>{const [stats,socials,geography]=await Promise.all([this.cms.request('/admin/analytics?days='+this.days),this.studio.manage('socials',{days:this.days}),this.studio.manage('geography',{days:this.days})]);this.stats.set(stats);this.socialStats.set(socials);this.geography.set(geography);});}
  readonly geography=signal<any>({countries:[],cities:[],recent:[]});
  readonly geoColors=['var(--a-accent)','#35b8a7','#a582ef','#e5a24a','#e27791','#7183a5'];
  countryTotal(){return (this.geography()?.countries||[]).reduce((sum:number,row:any)=>sum+Number(row.count),0);}
  countryPercent(count:number){return Math.round(Number(count)/Math.max(1,this.countryTotal())*100);}
  countryGradient(){let at=0;const total=this.countryTotal();if(!total)return 'var(--a-border)';return 'conic-gradient('+(this.geography()?.countries||[]).map((row:any,i:number)=>{const from=at;at+=Number(row.count)/total*100;return this.geoColors[i%this.geoColors.length]+' '+from+'% '+at+'%';}).join(',')+')';}
  maxDaily() {
    return Math.max(1, ...(this.stats()?.daily || []).map((v: any) => v.count));
  }
  async mark(row: ContentRow) {
    await this.run(async () => {
      await this.cms.save("messages", { id: row.id, is_read: !row["is_read"] });
      await this.open("messages");
    });
  }
  reply(row: ContentRow) {
    return (
      "mailto:" +
      row["email"] +
      "?subject=" +
      encodeURIComponent("Re: " + row["subject"])
    );
  }
  async restore(row: ContentRow) {
    if(!await this.confirmAction('Revert this change?','The previous version will be restored to draft. Review it before publishing.','Restore to draft'))return;
    await this.run(async () => {
      if(row['table_name']==='layout')await this.studio.call('restore_layout',{id:row.id});
      else await this.cms.request("/admin/restore/" + row.id, { method: "POST" });
      this.notice.set("Restored to draft. Publish when ready.");
      this.dirty.set(true);
    });
  }
  async backup() {
    await this.run(async () => {
      const data=await this.studio.call('backup');const report=await this.workspace.call('backup_check',{backup:data});this.backupReport.set(report);
      this.downloadJson({...data,verification:report});
      this.notice.set(report.passed?'Backup downloaded and restore rehearsal passed. Uploaded bytes are not included.':'Backup downloaded, but restore verification needs review. See the report.');
    });
  }
  downloadJson(data: any,name='portfolio-backup.json') {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.append(a);a.click();a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async pdf(preview: boolean) {
    if (this.busy()) return;
    const tab = preview ? window.open("", "_blank") : null;
    if (tab) tab.opener = null;
    if (preview && !tab) {
      this.notice.set("Allow popups to preview the PDF.");
      return;
    }
    await this.run(async () => {
      this.pdfBusy.set(true);
      try{
      const snapshot = await this.cms.request("/admin/draft");
      if (["profile", "resume"].includes(this.active()))
        snapshot.profile = { ...snapshot.profile, ...this.draft };
      await this.resume.download(snapshot, preview, tab);
      this.notice.set(preview?'PDF preview opened.':'PDF download started.');
      }catch(error){tab?.close();throw error;}finally{this.pdfBusy.set(false);}
    });
  }
  display(row: ContentRow) {
    return (
      row.data?.["title"] ||
      row.data?.["name"] ||
      row.data?.["company"] ||
      "Untitled"
    );
  }
  filteredRows(){return this.rows().filter(row=>JSON.stringify(row).toLowerCase().includes(this.search.toLowerCase())&&(this.active()!=='messages'||this.matchesMessage(row,this.messageFilter)));}
  matchesMessage(row:ContentRow,filter:string){if(filter==='spam')return !!row['is_spam'];if(row['is_spam'])return false;if(filter==='due')return this.followupDue(row);if(filter==='scheduled')return !!row['follow_up_at']&&!row['follow_up_done'];if(filter==='unread')return !row['is_read'];if(filter==='read')return !!row['is_read'];if(filter==='pending')return !row['replied_at'];if(filter==='replied')return !!row['replied_at'];return true;}
  async uploadMedia(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;
    await this.run(async () => {
      for (const file of Array.from(files)) await this.cms.upload(file);
      await this.open("media");
    });
  }
  async removeMedia(row: ContentRow) {
    if(!await this.confirmAction('Permanently delete this file?','Only unused files can be deleted. The file will be removed from Supabase Storage.','Delete file',true))return;
    await this.run(async () => {
      await this.studio.deleteFile(row);
      await this.open("media");
    });
  }
  confirmAction(title:string,message:string,label='Continue',danger=false):Promise<boolean>{return new Promise(resolve=>{this.modalValue='';this.modal.set({title,message,label,danger,resolve:value=>resolve(value!==false)});});}
  promptAction(title:string,message:string,input='text',label='Continue'):Promise<string|false>{return new Promise(resolve=>{this.modalValue='';this.modal.set({title,message,label,input,resolve});});}
  closeModal(accept=false){const current=this.modal();if(!current)return;this.modal.set(null);current.resolve(accept?(current.input?this.modalValue:'yes'):false);}
  async loadHistory(){const response=await this.studio.call('history',{page:this.historyPage,size:this.historySize});this.rows.set(response.items);this.historyTotal=response.total;}
  get historyPages(){return Math.max(1,Math.ceil(this.historyTotal/this.historySize));}
  async historyNavigate(page:number){this.historyPage=Math.max(1,Math.min(page,this.historyPages));await this.run(()=>this.loadHistory());}
  async historyResize(){this.historyPage=1;await this.run(()=>this.loadHistory());}
  async deleteHistory(row:ContentRow){if(!await this.confirmAction('Delete this history entry?','This permanently removes its saved versions and frees reusable database space. Current draft and published content stay intact.','Delete history',true))return;await this.run(async()=>{await this.studio.call('delete_history',{id:row.id});if(this.rows().length===1&&this.historyPage>1)this.historyPage--;await this.loadHistory();this.notice.set('History entry and its saved versions deleted.');});}
  async restoreBackup(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;if(file.size>10*1024*1024){this.notice.set('Maximum backup size is 10 MB.');return;}let data:any;try{data=JSON.parse(await file.text());if(!['portfolio-backup-v1','portfolio-backup-v2'].includes(data.format))throw Error();}catch{this.notice.set('Choose a valid portfolio backup JSON file.');return;}
    const check=await this.workspace.call('backup_check',{backup:data}).catch(e=>{this.notice.set(e.message);return null;});this.backupReport.set(check);if(!check?.passed){this.notice.set('Backup restore rehearsal did not pass. Review the verification report first.');return;}
    if(!await this.confirmAction('Restore this backup to draft?','Matching items will be updated and new ones added. Nothing is deleted. Messages and uploaded bytes are not imported. Review the draft before publishing.','Restore backup'))return;
    await this.run(async()=>{const result=await this.studio.call('restore_backup',data);await this.open('content_history');this.notice.set(`${result.restored} items restored to draft. Review, then Publish.`);});
  }
  filteredMedia(){return this.rows().filter(row=>this.mediaFilter==='all'||this.mediaFilter==='unused'&&row['unused']||this.mediaFilter==='images'&&row['content_type']?.startsWith('image/')||this.mediaFilter==='pdfs'&&row['content_type']==='application/pdf');}
  mediaTotal(){return this.filteredMedia().length;}
  mediaPages(){return Math.max(1,Math.ceil(this.mediaTotal()/this.mediaSize));}
  mediaCurrentPage(){return Math.min(this.mediaPages(),Math.max(1,this.mediaPage));}
  mediaRows(){const start=(this.mediaCurrentPage()-1)*this.mediaSize;return this.filteredMedia().slice(start,start+this.mediaSize);}
  async copyMedia(row:ContentRow){try{await navigator.clipboard.writeText(row['url']);this.notice.set('Media link copied.');}catch{this.notice.set('Open the file and copy its address.');}}
  socialIcon(label:string){const key=label.toLowerCase();return key.includes('github')?'fa-brands fa-github':key.includes('linkedin')?'fa-brands fa-linkedin-in':key.includes('facebook')?'fa-brands fa-facebook-f':key.includes('instagram')?'fa-brands fa-instagram':key.includes('thread')?'fa-brands fa-threads':key.includes('youtube')?'fa-brands fa-youtube':key.includes('twitter')||key==='x'?'fa-brands fa-x-twitter':'fa-solid fa-arrow-up-right-from-square';}
  bytes(value:number){return value>=1048576?(value/1048576).toFixed(1)+' MB':Math.ceil(value/1024)+' KB';}
  date(value:string){return value?new Date(value).toLocaleString():'';}
  async createLink(){await this.run(async()=>{const token=Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');await this.studio.call('create_link',{token,label:this.linkLabel,hours:Number(this.linkHours)});this.createdLink=location.origin+'/?draft='+token;this.links.set(await this.studio.call('links'));this.notice.set('Private link created. Copy it now or from Shared previews.');});}
  async copySharedLink(link:any){await this.run(async()=>{const result=await this.studio.call('copy_link',{id:link.id});this.createdLink=location.origin+'/?draft='+result.token;await this.copyLink();});}
  async copyLink(){try{await navigator.clipboard.writeText(this.createdLink);this.notice.set('Private link copied.');}catch{this.notice.set('Select the link above and copy it manually.');}}
  async revokeLink(link:any){if(!await this.confirmAction('Revoke this private link?','It will immediately reject new requests. Already-open previews check again every 15 seconds. Previously viewed or downloaded content cannot be recalled.','Revoke link',true))return;await this.run(async()=>{await this.studio.call('revoke_link',{id:link.id});this.links.set(await this.studio.call('links'));this.createdLink='';this.notice.set('Private link revoked.');});}
  async saveLayout(){await this.run(async()=>{await this.flushEditor();this.notice.set('Layout saved to draft. Review and Publish to apply.');});}
  moveSection(from:number,to:number){const sections=[...this.layoutDraft.sections];if(to<0||to>=sections.length)return;sections.splice(to,0,sections.splice(from,1)[0]);this.layoutDraft={...this.layoutDraft,sections};}
  dropSection(index:number,event:DragEvent){event.preventDefault();if(this.layoutDrag>=0)this.moveSection(this.layoutDrag,index);this.layoutDrag=-1;}
  themeExample(){this.downloadJson({format:'portfolio-theme-v1',...royalBlue},'portfolio-theme-example.json');}
  async importTheme(event:Event){const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;await this.run(async()=>{if(file.size>15000)throw Error('Theme files must be smaller than 15 KB.');const data=validateTheme(JSON.parse(await file.text()));await this.studio.call('import_theme',data);this.themes.set(await this.studio.call('themes'));this.notice.set('Theme imported. Select it, save the layout and Publish.');});}
  async deleteTheme(theme:BrandTheme){if(!await this.confirmAction('Delete this theme?','A theme used by a live layout, draft or saved layout history cannot be deleted.','Delete theme',true))return;await this.run(async()=>{await this.studio.call('delete_theme',{id:theme.id});this.themes.set(await this.studio.call('themes'));});}
  schedule(){return this.showReview('schedule');}
  async cancelSchedule(){await this.run(async()=>{await this.studio.call('cancel_schedule');this.state.set(await this.studio.call('state'));this.notice.set('Scheduled publication cancelled.');});}
  async updatePassword(){if(this.newPassword!==this.confirmPassword){this.notice.set('Passwords do not match.');return;}await this.run(async()=>{await this.account.updatePassword(this.newPassword);this.newPassword='';this.confirmPassword='';this.notice.set('Password updated.');});}
  async updateEmail(){await this.run(async()=>{await this.account.updateEmail(this.newEmail);this.newEmail='';this.notice.set('Confirmation requested. Check the new address and, if required, your current inbox.');});}
  async enrollAuthenticator(){await this.run(async()=>{this.enrollment=await this.account.enroll();this.authCode='';});}
  async confirmAuthenticator(){await this.run(async()=>{await this.account.verify(this.enrollment.id,this.authCode);this.enrollment=null;this.authCode='';await this.account.load();this.notice.set('Authenticator enabled. Keep your setup key somewhere safe.');});}
  async cancelAuthenticator(){await this.run(async()=>{if(this.enrollment)await this.account.cancelEnrollment(this.enrollment.id);this.enrollment=null;this.authCode='';});}
  async verifyLoginCode(){await this.run(async()=>{await this.account.loginCode(this.authCode);await this.cms.verify();this.authCode='';this.loginForm.controls.password.reset();localStorage.setItem('no-track','1');this.authenticated.set(true);await this.router.navigateByUrl('/admin');await this.open('dashboard');});}
  async globalSignOut(){if(!await this.canLeaveEditor())return;if(!await this.confirmAction('Sign out on all devices?','Every refresh session will be ended. Existing access tokens can remain valid until their normal expiry.','Sign out everywhere',true))return;await this.run(async()=>{await this.account.signOut('global');this.authenticated.set(false);await this.router.navigateByUrl('/admin/login');});}
  prefetchPdf(){void this.resume.prefetch().catch(()=>{});}
  verifiedAuthenticator(){return this.account.factors().some(f=>f.status==='verified');}
  trapModal(event:Event){const key=event as KeyboardEvent;const root=(event.currentTarget as HTMLElement);const nodes=Array.from(root.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]'));const first=nodes[0],last=nodes.at(-1);if(key.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!key.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}

  readonly geoEnabled=signal(true);
  async setGeo(enabled:boolean){await this.run(async()=>{await this.studio.manage('set_geo',{enabled});this.geoEnabled.set(enabled);this.notice.set(enabled?'Approximate admin login location lookup enabled.':'Future admin IP location lookups disabled.');});}
  async refreshLocations(){await this.run(async()=>{try{await this.studio.dispatchMail();}catch{}await this.open('activity');this.notice.set('Location lookup requested. Refresh activity shortly. IP locations are approximate.');});}
  readonly ownerName=signal('');
  readonly counts=signal<Record<string,number>>({});readonly health=signal<any>(null);readonly socialStats=signal<any[]>([]);
  readonly recruiters=signal<any[]>([]);readonly activity=signal<any[]>([]);readonly contactState=signal<any>({enabled:true,mail_ready:false});
  recruiterCompany='';recruiterSlug='';recruiterNote='';selectedMessages=new Set<string>();replyingId='';replySubject='';replyBody='';
  readonly messageFilters=[{key:'all',label:'All'},{key:'due',label:'Follow-ups due'},{key:'scheduled',label:'Scheduled'},{key:'unread',label:'Unread'},{key:'pending',label:'Pending reply'},{key:'replied',label:'Replied'},{key:'read',label:'Read'},{key:'spam',label:'Spam'}];
  messageCount(filter:string){return this.rows().filter(row=>this.matchesMessage(row,filter)).length;}
  selectMessage(id:string,checked:boolean){checked?this.selectedMessages.add(id):this.selectedMessages.delete(id);}
  get allMessagesSelected(){const rows=this.filteredRows();return rows.length>0&&rows.every(row=>this.selectedMessages.has(row.id));}
  selectAllMessages(checked:boolean){for(const row of this.filteredRows())this.selectMessage(row.id,checked);}
  async messageAction(operation:string,row?:ContentRow){const ids=row?[row.id]:[...this.selectedMessages];if(!ids.length)return;if(operation==='delete'&&!await this.confirmAction('Delete selected messages?','The selected messages will be removed from your inbox.','Delete messages',true))return;await this.run(async()=>{await this.studio.manage('message_action',{operation,ids});await this.open('messages');this.notice.set('Inbox updated.');});}
  async toggleContact(enabled:boolean){await this.run(async()=>{await this.studio.manage('contact_toggle',{enabled});this.contactState.set({...this.contactState(),enabled});this.notice.set(enabled?'Contact form opened.':'Contact form closed. Visitors can still email you directly.');});}
  exportMessages(){const rows=this.filteredRows();const cell=(value:unknown)=>{let text=String(value??'');if(/^[=+@-]/.test(text.trimStart()))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};const data=[['Name','Email','Subject','Message','Received','Read','Spam','Replied'],...rows.map(row=>[row['name'],row['email'],row['subject'],row['message'],row.created_at,row['is_read'],row['is_spam'],row['replied_at']])].map(row=>row.map(cell).join(',')).join('\r\n');this.downloadBlob(new Blob(['\uFEFF'+data],{type:'text/csv;charset=utf-8'}),'portfolio-messages.csv');}
  private downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  toggleReply(row:ContentRow){if(this.replyingId===row.id){this.replyingId='';return;}this.replyingId=row.id;this.replySubject='Re: '+row['subject'];this.replyBody='Hi '+row['name']+',\n\n\n\nBest regards,\n'+(this.ownerName()||this.cms.snapshot().profile.name);}
  replyApp(row:ContentRow){return 'mailto:'+encodeURIComponent(row['email'])+'?subject='+encodeURIComponent(this.replySubject)+'&body='+encodeURIComponent(this.replyBody);}
  async sendReply(row:ContentRow){if(!this.contactState().mail_ready){this.notice.set('Configure the private email worker first. See the Gmail SMTP setup guide.');return;}if(!await this.confirmAction('Send this email reply?','This sends your written reply to '+row['email']+'. Their response will go to your own inbox.','Send reply'))return;await this.run(async()=>{await this.studio.manage('queue_reply',{id:row.id,subject:this.replySubject,body:this.replyBody});this.replyingId='';try{await this.studio.dispatchMail();}catch{}await this.open('messages');this.notice.set('Reply queued. Replied status appears after SMTP acceptance; inbox delivery is not confirmed.');});}
  followupDue(row:ContentRow){return !!row['follow_up_at']&&!row['follow_up_done']&&new Date(row['follow_up_at']).getTime()<=Date.now();}
  async editFollowup(row:ContentRow){if(this.followupId===row.id)return;if(!await this.canLeaveEditor())return;this.followupId=row.id;this.followupLabels=(row['labels']||[]).join(', ');this.followupNotes=row['private_notes']||'';this.followupDone=!!row['follow_up_done'];const d=row['follow_up_at']?new Date(row['follow_up_at']):null;this.followupAt=d?new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16):'';this.followupBaseline=this.followupSignature();}
  followupSignature(){return JSON.stringify([this.followupLabels,this.followupNotes,this.followupAt,this.followupDone]);}
  followupDirty(){return !!this.followupId&&this.followupBaseline!==this.followupSignature();}
  async persistFollowup(){await this.workspace.call('save_followup',{id:this.followupId,labels:this.followupLabels.split(',').map(v=>v.trim()).filter(Boolean),notes:this.followupNotes,at:this.followupAt?new Date(this.followupAt).toISOString():null,done:this.followupDone});this.followupId='';}
  async saveFollowup(row:ContentRow){await this.run(async()=>{await this.workspace.call('save_followup',{id:row.id,labels:this.followupLabels.split(',').map(v=>v.trim()).filter(Boolean),notes:this.followupNotes,at:this.followupAt?new Date(this.followupAt).toISOString():null,done:this.followupDone});this.followupId='';await this.open('messages');this.notice.set('Private follow-up saved. Due reminders appear on Overview.');});}
  async testBackup(event?:Event){let data:any;try{if(event){const input=event.target as HTMLInputElement,file=input.files?.[0];input.value='';if(!file)return;if(file.size>10*1024*1024)throw Error('Maximum backup size is 10 MB.');data=JSON.parse(await file.text());}await this.run(async()=>{const report=await this.workspace.call('backup_check',data?{backup:data}:{});this.backupReport.set(report);this.backupChecks.set(await this.workspace.call('backup_checks'));this.notice.set(report.detail);});}catch(e){this.notice.set(e instanceof Error?e.message:'Choose a valid JSON backup.');}}
  compactRecruiterUrl(row:any){return location.origin+'/recruiter?ref='+encodeURIComponent(row.slug);}
  async copyCompactRecruiter(row:any){try{await navigator.clipboard.writeText(this.compactRecruiterUrl(row));this.notice.set('Compact recruiter link copied.');}catch{this.notice.set(this.compactRecruiterUrl(row));}}
  recruiterUrl(row:any){return location.origin+'/?ref='+encodeURIComponent(row.slug);}
  async copyRecruiter(row:any){try{await navigator.clipboard.writeText(this.recruiterUrl(row));this.notice.set('Recruiter link copied.');}catch{this.notice.set('Copy the displayed recruiter URL manually.');}}
  async createRecruiter(){await this.run(async()=>{await this.studio.manage('create_recruiter',{company:this.recruiterCompany,slug:this.recruiterSlug||this.slug(this.recruiterCompany),note:this.recruiterNote});this.recruiterCompany='';this.recruiterSlug='';this.recruiterNote='';await this.open('recruiters');this.notice.set('Recruiter link created.');});}
  async deleteRecruiter(row:any){if(!await this.confirmAction('Delete this recruiter link?','The reference will stop attributing new visits. Overall anonymous analytics are kept.','Delete link',true))return;await this.run(async()=>{await this.studio.manage('delete_recruiter',{id:row.id});await this.open('recruiters');});}
  deviceName(agent:string){if(/Android/i.test(agent))return 'Android';if(/iPhone|iPad/i.test(agent))return 'iPhone / iPad';if(/Windows/i.test(agent))return 'Windows';if(/Macintosh|Mac OS/i.test(agent))return 'macOS';if(/Linux/i.test(agent))return 'Linux';return 'Unknown device';}
  browserName(agent:string){return /Edg/i.test(agent)?'Edge':/Firefox/i.test(agent)?'Firefox':/Chrome/i.test(agent)?'Chrome':/Safari/i.test(agent)?'Safari':'Browser';}
  async recognizeSession(row:any){await this.run(async()=>{await this.studio.manage('recognize_session',{id:row.id});await this.open('activity');});}
  async revokeSession(row:any){if(!await this.confirmAction('Expire this admin session?','This immediately blocks its portfolio database and Storage access and prevents refresh. '+(row.current?'You will also be signed out here.':''),'Expire session',true))return;await this.run(async()=>{await this.studio.manage('revoke_session',{id:row.id});if(row.current)await this.signOut();else await this.open('activity');});}
}


