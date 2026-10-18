import {AfterViewInit,Directive,DoCheck,ElementRef,OnDestroy,Renderer2,inject} from '@angular/core';
let sequence=0;
/** Preserve native select/ngModel semantics, with a themed, keyboard-accessible popup. */
@Directive({selector:'select'})export class StudioSelectDirective implements AfterViewInit,DoCheck,OnDestroy{
 private el=inject<ElementRef<HTMLSelectElement>>(ElementRef);private renderer=inject(Renderer2);private wrap!:HTMLDivElement;private button!:HTMLButtonElement;private list!:HTMLDivElement;private cleanups:(()=>void)[]=[];private opened=false;private index=0;private signature='';private observer?:MutationObserver;
 private get select(){return this.el.nativeElement;}
 ngAfterViewInit(){
  const native=this.select,id='studio-options-'+(++sequence);this.wrap=document.createElement('div');this.wrap.className='studio-select';native.before(this.wrap);this.wrap.append(native);native.classList.add('studio-native-select');native.tabIndex=-1;native.setAttribute('aria-hidden','true');
  this.button=document.createElement('button');this.button.type='button';this.button.className='studio-select-trigger';this.button.setAttribute('role','combobox');this.button.setAttribute('aria-haspopup','listbox');this.button.setAttribute('aria-controls',id);this.button.setAttribute('aria-expanded','false');this.wrap.append(this.button);
  this.list=document.createElement('div');this.list.id=id;this.list.className='studio-select-popup';this.list.setAttribute('role','listbox');this.list.setAttribute('popover','manual');this.wrap.append(this.list);this.list.hidden=true;
  this.listen(this.button,'click',()=>this.opened?this.close():this.open());this.listen(this.button,'keydown',(event:KeyboardEvent)=>this.key(event));this.listen(native,'change',()=>this.sync());this.listen(native,'focus',()=>this.button.focus());
  this.listen(document,'pointerdown',(e:PointerEvent)=>{if(!this.wrap.contains(e.target as Node))this.close();});this.listen(document,'keydown',(e:KeyboardEvent)=>{if(this.opened&&e.key==='Escape'){e.preventDefault();this.close();this.button.focus();}});this.listen(window,'resize',()=>this.close());this.cleanups.push(this.renderer.listen(document,'scroll',()=>{if(this.opened)this.position();}));
  [this.wrap,this.button,this.list].forEach(el=>this.decorate(el));
  this.observer=new MutationObserver(()=>this.sync());this.observer.observe(native,{childList:true,subtree:true,attributes:true});this.sync();
 }
 private listen(target:any,event:string,handler:(event:any)=>void){this.cleanups.push(this.renderer.listen(target,event,handler));}
 private decorate(element:HTMLElement){for(const attribute of Array.from(this.select.attributes))if(attribute.name.startsWith('_ngcontent-'))element.setAttribute(attribute.name,'');}
 ngDoCheck(){if(this.button)this.sync();}
 private sync(){
  this.button.disabled=this.select.disabled;const text=this.select.selectedOptions[0]?.textContent?.trim()||'Choose an option';if(this.button.textContent!==text)this.button.textContent=text;
  const label=this.select.getAttribute('aria-label')||this.select.labels?.[0]?.childNodes[0]?.textContent?.trim()||'Choose an option';this.button.setAttribute('aria-label',label);this.list.setAttribute('aria-label',label);
  const signature=Array.from(this.select.options).map(o=>o.value+'|'+o.textContent+'|'+o.disabled).join(';');if(signature!==this.signature){this.signature=signature;if(this.opened)this.render();}
 }
 private render(){
  this.list.replaceChildren();Array.from(this.select.options).forEach((option,index)=>{const item=document.createElement('div');this.decorate(item);item.setAttribute('role','option');item.id=this.list.id+'-'+index;item.textContent=option.textContent;item.setAttribute('aria-selected',String(option.selected));item.setAttribute('aria-disabled',String(option.disabled));item.className='studio-select-option';item.addEventListener('pointerdown',e=>e.preventDefault());item.addEventListener('click',()=>{if(!option.disabled)this.choose(index);});this.list.append(item);});this.highlight(this.index);
 }
 private position(){const rect=this.button.getBoundingClientRect(),below=innerHeight-rect.bottom-12,above=rect.top-12,up=below<170&&above>below,room=Math.max(90,up?above:below);Object.assign(this.list.style,{position:'fixed',left:Math.max(8,Math.min(rect.left,innerWidth-rect.width-8))+'px',width:Math.min(rect.width,innerWidth-16)+'px',maxHeight:Math.min(285,room)+'px',top:up?'auto':rect.bottom+7+'px',bottom:up?innerHeight-rect.top+7+'px':'auto',margin:'0'});}
 private open(){if(this.select.disabled)return;this.opened=true;this.index=Math.max(0,this.select.selectedIndex);this.list.hidden=false;this.render();this.position();if(this.list.showPopover)this.list.showPopover();this.button.setAttribute('aria-expanded','true');this.highlight(this.index);}
 private close(){if(!this.opened)return;this.opened=false;if(this.list.hidePopover&&this.list.matches(':popover-open'))this.list.hidePopover();this.list.hidden=true;this.button.setAttribute('aria-expanded','false');this.button.removeAttribute('aria-activedescendant');}
 private choose(index:number){this.select.selectedIndex=index;this.select.dispatchEvent(new Event('change',{bubbles:true}));this.select.dispatchEvent(new Event('blur'));this.sync();this.close();this.button.focus();}
 private highlight(index:number){this.index=index;Array.from(this.list.children).forEach((el,i)=>el.classList.toggle('is-focused',i===index));this.button.setAttribute('aria-activedescendant',this.list.id+'-'+index);this.list.children[index]?.scrollIntoView({block:'nearest'});}
 private key(event:KeyboardEvent){const count=this.select.options.length;if(!count)return;if(['ArrowDown','ArrowUp','Home','End','Enter',' '].includes(event.key)){event.preventDefault();if(!this.opened){this.open();return;}if(event.key==='Enter'||event.key===' '){if(!this.select.options[this.index]?.disabled)this.choose(this.index);return;}let next=event.key==='Home'?0:event.key==='End'?count-1:Math.max(0,Math.min(count-1,this.index+(event.key==='ArrowDown'?1:-1)));this.highlight(next);}else if(event.key==='Tab')this.close();else if(event.key.length===1){const match=Array.from(this.select.options).findIndex(o=>!o.disabled&&o.text.toLowerCase().startsWith(event.key.toLowerCase()));if(match>=0){if(!this.opened)this.open();this.highlight(match);}}}
 ngOnDestroy(){this.observer?.disconnect();this.cleanups.forEach(fn=>fn());this.close();if(this.wrap?.parentNode){this.wrap.before(this.select);this.wrap.remove();}this.select.classList.remove('studio-native-select');this.select.removeAttribute('aria-hidden');this.select.removeAttribute('tabindex');}
}
