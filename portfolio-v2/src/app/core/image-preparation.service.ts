import {Injectable,signal} from '@angular/core';
export class UploadCancelled extends Error{constructor(){super('Upload cancelled');this.name='UploadCancelled';}}
@Injectable({providedIn:'root'})export class ImagePreparationService{
 readonly request=signal<{file:File;resolve:(file:File|null)=>void}|null>(null);private queue:Promise<any>=Promise.resolve();
 prepare(file:File):Promise<File>{if(!file.type.startsWith('image/'))return Promise.resolve(file);const pending=this.queue.catch(()=>{}).then(()=>new Promise<File>((resolve,reject)=>{this.request.set({file,resolve:value=>{this.request.set(null);value?resolve(value):reject(new UploadCancelled());}});}));this.queue=pending;return pending;}
}
