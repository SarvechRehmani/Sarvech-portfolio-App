const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
test('deployment emits direct Supabase settings and refuses secret keys',()=>{
 const script=fs.readFileSync('scripts/postbuild.cjs','utf8');
 const run=env=>{const files={};vm.runInNewContext(script,{Buffer,require:()=>({readFileSync:()=>JSON.stringify({supabaseUrl:'https://test.supabase.co',supabasePublishableKey:'sb_publishable_test'}),copyFileSync(){},writeFileSync:(path,data)=>files[path]=data}),process:{env},console:{log(){}}});return files;};
 const built=run({SUPABASE_URL:'https://owner.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_owner'});
 assert.deepEqual(JSON.parse(built['dist/portfolio/browser/config.json']),{supabaseUrl:'https://owner.supabase.co',supabasePublishableKey:'sb_publishable_owner'});
 assert.equal(built['dist/portfolio/browser/_redirects'],'/* /index.html 200\n');
 assert.throws(()=>run({SUPABASE_PUBLISHABLE_KEY:'sb_secret_rejected'}));assert.throws(()=>run({SUPABASE_URL:'http://test.supabase.co'}));
 const jwt=role=>'header.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';
 assert.equal(JSON.parse(run({SUPABASE_FUNCTIONS_ANON_KEY:jwt('anon')})['dist/portfolio/browser/config.json']).supabaseFunctionsKey,jwt('anon'));
 assert.throws(()=>run({SUPABASE_FUNCTIONS_ANON_KEY:jwt('service_role')}),/public anon JWT/);
});
test('server-side sharing metadata reads published Supabase data without changing app markup',async()=>{
 const code=ts.transpileModule(fs.readFileSync('netlify/edge-functions/seo.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const exports={},html='<html><head><title>Old</title></head><body><app-root></app-root></body></html>';
 const requests=[];vm.runInNewContext(code,{exports,URL,Response,Headers,AbortSignal,fetch:async(url,options)=>{requests.push({url,options});return Response.json(String(url).endsWith('/config.json')?{supabaseUrl:'https://test.supabase.co',supabasePublishableKey:'sb_publishable_test'}:{profile:{name:'Owner',socials:[]},projects:[{slug:'sample',title:'Sample <project>',overview:'Published description',images:['assets/cover.png']}]});}});
 const result=await exports.default(new Request('https://portfolio.example.invalid/projects/sample'),{next:async()=>new Response(html,{headers:{'content-type':'text/html'}})});const output=await result.text();assert.match(output,/<title>Sample &lt;project&gt; · Owner<\/title>/);assert.match(output,/content="Published description"/);assert.match(output,/application\/ld\+json/);assert.ok(output.includes('<app-root></app-root>'));
 assert.equal(requests[1].url,'https://test.supabase.co/rest/v1/rpc/portfolio_site');assert.equal(requests[1].options.headers.apikey,'sb_publishable_test');
});
