import {BlogArtworkComponent,nativeBlogCover} from '../shared/blog-artwork.component';
import {Component,inject,Input,signal,OnInit} from '@angular/core';
import {CmsService} from '../core/cms.service';
@Component({selector:'portfolio-additional',styleUrl:'./additional.css',imports:[BlogArtworkComponent],templateUrl:'./additional.component.html',styles:[`:host{display:contents}.additional-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}.additional-grid article,.article-card{padding:28px;border-radius:18px}.additional-grid .tags{margin-top:20px}.additional-grid article img{border-radius:50%;object-fit:cover;margin-bottom:15px}.article-card{display:block;transition:transform .25s,border-color .25s}.article-card:hover{transform:translateY(-4px);border-color:var(--accent)}.article-card .article-cover{width:100%;height:auto;aspect-ratio:1200/630;object-fit:cover;border-radius:10px;margin-bottom:20px}.article-card h3{font-size:23px;line-height:1.4;margin:12px 0}.article-card>p:not(.eyebrow){font-size:14px;color:var(--muted)}.article-link{display:inline-block;color:var(--accent);font-size:13px;margin-top:20px}@media(max-width:700px){.additional-grid{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.article-card{transition:none}}`]})
export class AdditionalComponent implements OnInit{
 @Input() part:'all'|'soft'|'testimonials'|'blog'='all';private readonly cms=inject(CmsService);
 readonly posts=signal<any[]>([]);readonly nativeCover=nativeBlogCover;
 get profile(){return this.cms.snapshot().profile;}
 get testimonials(){return (this.cms.snapshot()['testimonials']||[]).filter((item:any)=>item.visible!==false);}
 ngOnInit(){if((this.part==='blog'||this.part==='all')&&!this.cms.snapshot()['layout']?.sections?.some((s:any)=>s.key==='blog'&&!s.enabled))void this.cms.request('/blog',{},false).then(rows=>this.posts.set(rows)).catch(()=>{});}
 blogUrl(slug?:string){const params=new URLSearchParams(location.search),query=new URLSearchParams();for(const key of ['draft','preview'])if(params.has(key))query.set(key,params.get(key)!);return '/blog'+(slug?'/'+encodeURIComponent(slug):'')+(query.size?'?'+query:'');}
}

