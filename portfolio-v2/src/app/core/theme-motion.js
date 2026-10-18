export const themeEffects=[{value:'none',label:'No effect — normal switch'},{value:'blur',label:'Smooth blur'},{value:'portal',label:'Portal from the toggle'},{value:'slide',label:'Top-to-bottom reveal'}];
export function themeRevealFrames(effect,rect,width,height,strong=false){
 if(effect==='blur')return strong?[{offset:0,opacity:0,filter:'blur(16px)',transform:'scale(1.025)'},{offset:.42,opacity:.65,filter:'blur(7px)',transform:'scale(1.01)'},{offset:1,opacity:1,filter:'blur(0px)',transform:'scale(1)'}]:[{opacity:0,filter:'blur(8px)',transform:'scale(1.015)'},{opacity:1,filter:'blur(0px)',transform:'scale(1)'}];
 if(effect==='slide')return [{clipPath:'inset(0 0 100% 0)'},{clipPath:'inset(0 0 0% 0)'}];
 const x=rect.left+rect.width/2,y=rect.top+rect.height/2,r=Math.ceil(Math.hypot(Math.max(x,width-x),Math.max(y,height-y)));
 return [{clipPath:`circle(0px at ${x}px ${y}px)`},{clipPath:`circle(${r}px at ${x}px ${y}px)`}];
}
export async function revealTheme(button,effect,apply){
 if(!effect||effect==='none'){apply();return true;}
 if(!document.startViewTransition)return false;
 const rect=button.getBoundingClientRect();let applied=false;
 let animation,outgoing,transition,watchdog;
 document.documentElement.classList.add('theme-revealing');
 try{
  transition=document.startViewTransition(()=>{if(!applied){applied=true;apply();}});
  watchdog=setTimeout(()=>transition.skipTransition(),3000);
  await transition.ready;
  const publicSite=!button.closest?.('.admin-shell'),duration=publicSite?(effect==='blur'?780:900):(effect==='blur'?500:560);
  if(effect==='blur')outgoing=document.documentElement.animate([{opacity:1,filter:'blur(0px)'},{opacity:0,filter:publicSite?'blur(12px)':'blur(8px)'}],{duration,easing:'ease-in-out',fill:'both',pseudoElement:'::view-transition-old(root)'});
  animation=document.documentElement.animate(themeRevealFrames(effect,rect,innerWidth,innerHeight,publicSite),{duration,easing:publicSite?'cubic-bezier(.4,0,.2,1)':'cubic-bezier(.2,.75,.2,1)',fill:'both',pseudoElement:'::view-transition-new(root)'});
  await animation.finished;
 }catch{if(!applied){applied=true;apply();}}finally{clearTimeout(watchdog);animation?.cancel();outgoing?.cancel();transition?.skipTransition();document.documentElement.classList.remove('theme-revealing');}
 return true;
}
