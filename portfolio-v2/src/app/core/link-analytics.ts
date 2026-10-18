export function trackedLink(href:string,origin:string):{type:'project'|'social';label:string}|null{
 try{const url=new URL(href,origin);
  if(url.origin===origin&&(/^\/projects\/[^/]+$/.test(url.pathname)||url.pathname==='/project.html'&&url.searchParams.has('id')))return {type:'project',label:url.pathname+url.search};
  if(url.origin!==origin&&/^https?:$/.test(url.protocol))return {type:'social',label:url.href};
 }catch{}return null;
}
