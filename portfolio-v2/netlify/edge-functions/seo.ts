// Server-side sharing metadata reads the same published Supabase RPC as Angular.
export default async function(request:Request,context:{next:()=>Promise<Response>}){
 const url=new URL(request.url),path=url.pathname;
 if(!/^\/$|^\/index\.html$|^\/projects\/[a-z0-9-]+$|^\/blog(?:\/[a-z0-9-]+)?$/.test(path))return context.next();
 const response=await context.next();if(!(response.headers.get('content-type')||'').includes('text/html'))return response;
 if(url.searchParams.has('draft')||url.searchParams.has('preview')){const headers=new Headers(response.headers);headers.set('cache-control','no-store, private');headers.set('x-robots-tag','noindex, nofollow');return new Response(response.body,{status:response.status,headers});}
 try{
  const config=await fetch(url.origin+'/config.json').then(r=>r.json());const rpc=async(name:string,args:unknown={})=>{const r=await fetch(config.supabaseUrl+'/rest/v1/rpc/'+name,{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:JSON.stringify(args),signal:AbortSignal.timeout(2500)});if(!r.ok)throw Error();return r.json();};
  const snapshot=await rpc('portfolio_site'),profile=snapshot.profile;
  let title=profile.seo_title||profile.name,description=profile.seo_description||'',image=profile.og_image||profile.imageSrc||'',type='website';
  if(path.startsWith('/projects/')){const project=(snapshot.projects||[]).find((p:{slug:string})=>p.slug===path.split('/').pop());if(project){title=project.title+' · '+profile.name;description=project.overview||description;image=project.images?.[0]||image;}}
  if(path.startsWith('/blog/')){const post=(await rpc('portfolio_blog',{post_slug:path.split('/').pop()}))[0];if(post){title=(post.data.seo_title||post.data.title)+' · '+profile.name;description=post.data.seo_description||post.data.excerpt||description;image=post.data.cover||image;type='article';}}
  if(snapshot.layout?.maintenance_enabled){title=snapshot.layout.maintenance_title;description=snapshot.layout.maintenance_message;}
  image=new URL(image,url.origin).href;const canonical=url.origin+(path==='/index.html'?'/':path),esc=(s:unknown)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  let html=await response.text();html=html.replace(/<title>[\s\S]*?<\/title>/i,'').replace(/<meta\b[^>]*(?:name=["'](?:description|twitter:[^"']+)["']|property=["']og:[^"']+["'])[^>]*>/gi,'').replace(/<link[^>]*rel=["']canonical["'][^>]*>/gi,'');
  const person=JSON.stringify({'@context':'https://schema.org','@type':'Person',name:profile.name,url:url.origin,image,email:profile.email,sameAs:(profile.socials||[]).map((s:{url:string})=>s.url)}).replace(/</g,'\\u003c');
  const metadata=`<title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:image" content="${esc(image)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:type" content="${type}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><script type="application/ld+json">${person}</script>`;
  const headers=new Headers(response.headers);headers.delete('content-length');headers.set('cache-control','no-cache');return new Response(html.replace('</head>',metadata+'</head>'),{status:response.status,headers});
 }catch{return response;}
}
