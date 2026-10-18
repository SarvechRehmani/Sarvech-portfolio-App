/** A single deadline timer, not a database poll. Long windows are re-armed safely. */
export class MaintenanceExpiry {
 private timer:ReturnType<typeof setTimeout>|undefined;
 private version=0;
 constructor(private reload:()=>void,private now=()=>Date.now(),private later:typeof setTimeout=setTimeout,private cancel:typeof clearTimeout=clearTimeout){}
 schedule(enabled:boolean,until:string|null|undefined){
  this.clear();const deadline=Date.parse(until||'');if(!enabled||!Number.isFinite(deadline))return;
  const version=this.version;
  const arm=()=>{if(version!==this.version)return;const left=deadline-this.now();
   if(left>2_147_000_000){this.timer=this.later(arm,2_147_000_000);return;}
   // A stale/offline cached maintenance response retries at most once per minute.
   this.timer=this.later(()=>{if(version===this.version)this.reload();},left>0?left+250:60_000);
  };arm();
 }
 clear(){this.version++;if(this.timer!==undefined)this.cancel(this.timer);this.timer=undefined;}
}
