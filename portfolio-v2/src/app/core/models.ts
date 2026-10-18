export interface SocialLink{title:string;url:string;icon?:string}
export interface Profile{[key:string]:any;name:string;email?:string;phone?:string;location?:string;roles?:string[];description?:string[];socials?:SocialLink[];soft_skills?:string[];languages?:string[];resume_mode?:'generated'|'uploaded';resume_url?:string}
export interface Project{[key:string]:any;id?:string;legacy_id?:string;slug:string;title:string;images:string[];features:string[];technologies:string[];visible?:boolean;in_resume?:boolean;links?:Record<string,string|null>}
export interface Snapshot{profile:Profile;projects?:Project[];[section:string]:any}
export interface ContentRow{ id:string;data:Record<string,any>;position:number;version?:number;created_at?:string;[key:string]:any }
export interface ApiPage<T>{items:T[];page:number;size:number;total:number}
