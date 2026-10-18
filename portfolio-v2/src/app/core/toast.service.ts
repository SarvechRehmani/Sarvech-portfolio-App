import {Injectable,signal} from '@angular/core';
export interface Toast{ id:number;text:string;kind:'success'|'error'|'info'; }
@Injectable({providedIn:'root'})export class ToastService{
 readonly items=signal<Toast[]>([]);private next=0;private timers=new Map<number,ReturnType<typeof setTimeout>>();
 show(text:string,kind:Toast['kind']='info'){if(!text)return;const id=++this.next;this.items.update(items=>[...items.slice(-3),{id,text,kind}]);this.timers.set(id,setTimeout(()=>this.dismiss(id),kind==='error'?10000:6500));}
 dismiss(id:number){clearTimeout(this.timers.get(id));this.timers.delete(id);this.items.update(items=>items.filter(item=>item.id!==id));}
}
