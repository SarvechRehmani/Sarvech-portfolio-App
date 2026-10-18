import {Injectable,inject} from '@angular/core';
import {CmsService} from './cms.service';
import {themeTokens,royalBlue,defaultSections} from './brand';
@Injectable({providedIn:'root'}) export class BrandService{
 private readonly cms=inject(CmsService);
 appearance(){const layout=this.cms.snapshot()['layout'];
  try{const preference=localStorage.getItem('sarvech-theme');document.documentElement.dataset['theme']=(preference==='dark'||preference==='light')?preference:layout?.default_mode==='light'?'light':'dark';}catch{document.documentElement.dataset['theme']=layout?.default_mode==='light'?'light':'dark';}
 }
 apply(){this.appearance();
  const layout=this.cms.snapshot()['layout'];

  document.documentElement.dataset['themeTransition']=layout?.theme_transition||'none';
  const motionPreview=new URLSearchParams(location.search);if(motionPreview.has('preview')&&this.cms.admin()&&['none','blur','portal','slide'].includes(motionPreview.get('theme-motion')||''))document.documentElement.dataset['themeTransition']=motionPreview.get('theme-motion')!;
  const theme=layout?.theme||royalBlue;
  let sheet=document.getElementById('portfolio-brand-palette');
  if(!sheet){sheet=document.createElement('style');sheet.id='portfolio-brand-palette';document.head.append(sheet);}
  const mode=(key:'dark'|'light')=>{const colors={...royalBlue[key],...theme[key]};colors['loader-bg']=theme[key]?.['loader-bg']||colors.bg;colors['loader-text']=theme[key]?.['loader-text']||colors.text;return themeTokens.filter(token=>typeof colors[token]==='string'&&!/[;{}<>]|url|expression/i.test(colors[token])).map(token=>`--${token}:${colors[token]}`).join(';');};
  sheet.textContent=`:root{${mode('dark')}}:root[data-theme=light]{${mode('light')}}`;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
  const params=new URLSearchParams(location.search),token=params.get('draft'),preview=params.has('preview')&&this.cms.admin();
  if(token||preview)document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link=>{const url=new URL(link.href,location.origin);if(url.origin===location.origin&&!url.pathname.startsWith('/admin')&&!link.hasAttribute('data-published-link')&&/^(\/|\/index\.html|\/project\.html|\/projects\/[^/]+|\/blog(?:\/[^/]+)?)$/.test(url.pathname)){if(token)url.searchParams.set('draft',token);else url.searchParams.set('preview','1');link.href=url.href;}});
  this.navigation(this.cms.snapshot()['layout']?.sections||defaultSections.map(key=>({key,enabled:true})));
 }
 layout(){
  const main=document.getElementById('main');if(!main||document.getElementById('project-detail'))return;
  const sections=this.cms.snapshot()['layout']?.sections||defaultSections.map(key=>({key,enabled:true}));
  for(const item of sections){const section=item.key==='additional'?main.querySelector<HTMLElement>('portfolio-additional'):document.getElementById(item.key);if(!section)continue;
   section.hidden=!item.enabled;section.style.display=item.enabled?'':'none';section.inert=!item.enabled;section.setAttribute('aria-hidden',String(!item.enabled));main.append(section);
   document.querySelectorAll<HTMLElement>(`.header nav a[href$="#${item.key}"]`).forEach(link=>{link.hidden=!item.enabled;link.style.display=item.enabled?'':'none';});
  }
  this.navigation(sections);
 }
 private navigation(sections:{key:string;enabled:boolean}[]){
  // Reorder existing navigation items to follow the same home section order.
  // Home stays first; the separate contact CTA remains outside this list.
  document.querySelectorAll<HTMLElement>('.header nav').forEach(nav=>{
   for(const item of sections){
    const link=Array.from(nav.querySelectorAll<HTMLAnchorElement>('a[href]')).find(a=>{
     try{return new URL(a.href,location.origin).hash==='#'+item.key;}catch{return false;}
    });
    if(link){
     const target=new URL(link.href,location.origin);if(!/^\/(?:index\.html)?$/.test(location.pathname)){target.pathname='/';link.href=target.href;}
     link.hidden=!item.enabled;link.style.display=item.enabled?'':'none';nav.append(link);
    }
   }
  });
  const contact=sections.find(item=>item.key==='contact');
  document.querySelectorAll<HTMLElement>('.header .nav-cta').forEach(link=>{link.hidden=contact?.enabled===false;link.style.display=contact?.enabled===false?'none':'';});
 }
}
