const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
function setup(hostname='portfolio.example',owner=false){
 class SupabaseService{}class ApiConfigService{}
 const requests=[],sessions=new Map(),local=new Map(owner?[['no-track','1']]:[]),exports={};
 const code=ts.transpileModule(fs.readFileSync('src/app/core/analytics.service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(code,{exports,URL,URLSearchParams,location:{search:'?ref=example-company',hostname},document:{referrer:''},navigator:{userAgent:'Desktop'},crypto:{randomUUID:()=> 'anonymous-tab-session-1234'},localStorage:{getItem:k=>local.get(k)||null},sessionStorage:{getItem:k=>sessions.get(k)||null,setItem:(k,v)=>sessions.set(k,v)},fetch:(url,init)=>{requests.push({url,init});return Promise.resolve({status:204});},require:name=>name==='@angular/core'?{Injectable:()=>()=>{},inject:token=>token===SupabaseService?{rpc:()=>{throw Error('Unexpected direct RPC fallback');}}:{supabaseUrl:'https://test.supabase.co',supabasePublishableKey:'sb_publishable_example',supabaseFunctionsKey:'public-anon-gateway'}}:name==='./supabase.service'?{SupabaseService}:name==='./api-config.service'?{ApiConfigService}:require(name)});
 return {service:new exports.AnalyticsService(),requests};
}
test('visitor analytics uses the protected edge ingress without client-supplied IP or location',()=>{
 const {service,requests}=setup();service.event('visit','/projects/example');
 assert.equal(requests.length,1);assert.equal(requests[0].url,'https://test.supabase.co/functions/v1/portfolio-mail/analytics');
 const body=JSON.parse(requests[0].init.body);assert.equal(body.event.recruiter_ref,'example-company');assert.equal(body.event.session_id,'anonymous-tab-session-1234');
 assert.equal(body.event.label,'/projects/example');assert.equal(body.event.ip,undefined);assert.equal(body.event.country,undefined);assert.equal(requests[0].init.keepalive,true);
});
test('localhost and the owner browser do not send visitor IP requests',()=>{
 for(const [host,owner] of [['localhost',false],['127.0.0.1',false],['[::1]',false],['portfolio.example',true]]){const {service,requests}=setup(host,owner);service.event('visit','/');assert.equal(requests.length,0);}
});
