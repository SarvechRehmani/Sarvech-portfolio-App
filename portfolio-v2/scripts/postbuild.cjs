const fs=require('node:fs');
const root='dist/portfolio/browser';
const config=JSON.parse(fs.readFileSync('public/config.json','utf8'));
const url=process.env.SUPABASE_URL||config.supabaseUrl;
const key=process.env.SUPABASE_PUBLISHABLE_KEY||config.supabasePublishableKey;
if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('SUPABASE_URL must be an HTTPS Supabase project URL');
if(!key.startsWith('sb_publishable_'))throw Error('Use a Supabase publishable key, never a secret/service-role key');
const functionsKey=process.env.SUPABASE_FUNCTIONS_ANON_KEY||config.supabaseFunctionsKey||'';
if(functionsKey&&JSON.parse(Buffer.from(functionsKey.split('.')[1]||'','base64url').toString()).role!=='anon')throw Error('Functions key must be a public anon JWT');
fs.writeFileSync(`${root}/config.json`,JSON.stringify({supabaseUrl:url,supabasePublishableKey:key,...(functionsKey?{supabaseFunctionsKey:functionsKey}:{})}));
fs.writeFileSync(`${root}/_redirects`,'/* /index.html 200\n');
fs.copyFileSync(`${root}/index.html`,`${root}/project.html`);
console.log('Angular + direct Supabase distribution ready: '+root);

