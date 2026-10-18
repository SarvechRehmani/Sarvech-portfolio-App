import {BrandTheme,royalBlue} from './brand';
/** Only a published palette enters the studio; draft edits never recolor it. */
export function studioPalette(theme:BrandTheme,light:boolean):Record<string,string>{
 const mode=light?'light':'dark',colors={...royalBlue[mode],...theme[mode]},dark={...royalBlue.dark,...theme.dark};
 const safe=(value:string,fallback:string)=>value&&!/[;{}<>]|url|expression/i.test(value)?value:fallback;
 const map:Record<string,string>={bg:'bg',card:'surface',input:'bg',text:'text',muted:'muted',border:'border',accent:'accent',hover:'hover','on-accent':'on-accent','accent-hover':'accent-hover'};
 const result:Record<string,string>={};for(const [key,token]of Object.entries(map))result['--a-'+key]=safe(colors[token],royalBlue[mode][token]);
 for(const [key,token]of Object.entries({bg:'bg',text:'text',muted:'muted',border:'border',hover:'hover',accent:'accent','on-accent':'on-accent'}))result['--nav-'+key]=safe(dark[token],royalBlue.dark[token]);
 return result;
}
