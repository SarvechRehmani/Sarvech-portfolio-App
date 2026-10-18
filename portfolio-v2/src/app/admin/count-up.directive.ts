import {Directive,ElementRef,Input,OnChanges,OnDestroy,inject} from '@angular/core';
@Directive({selector:'[studioCount]'})export class CountUpDirective implements OnChanges,OnDestroy{
 @Input()studioCount=0;private el=inject<ElementRef<HTMLElement>>(ElementRef);private frame=0;private current=0;
 ngOnChanges(){cancelAnimationFrame(this.frame);const end=Number(this.studioCount)||0,start=this.current,at=performance.now();if(matchMedia('(prefers-reduced-motion: reduce)').matches){this.current=end;this.el.nativeElement.textContent=end.toLocaleString();return;}const tick=(now:number)=>{const p=Math.min(1,(now-at)/420);this.current=Math.round(start+(end-start)*(1-Math.pow(1-p,3)));this.el.nativeElement.textContent=this.current.toLocaleString();if(p<1)this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);}
 ngOnDestroy(){cancelAnimationFrame(this.frame);}
}
