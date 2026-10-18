const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const signal=v=>Object.assign(()=>v,{set:next=>v=next});
function load(file,dependencies,globals={}){
 const exports={},code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
 vm.runInNewContext(code,{exports,require:name=>dependencies[name],URLSearchParams,structuredClone,...globals});return exports;
}
test('Supabase login refuses an authenticated user without admin membership',async()=>{
 class SupabaseService{};let signedOut=false,checked=false;
 const client={auth:{mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1',nextLevel:'aal1'}})},onAuthStateChange(){},signInWithPassword:async()=>({data:{session:{access_token:'test-jwt'}}}),getSession:async()=>({data:{session:{access_token:'test-jwt'}}}),signOut:async()=>{signedOut=true;return {};}}};
 const {SessionService}=load('src/app/core/session.service.ts',{'@angular/core':{Injectable:()=>()=>{},signal,inject:()=>({client,rpc:async()=>{checked=true;return false;}})},'./supabase.service':{SupabaseService}});
 const session=new SessionService();await assert.rejects(session.login('other@example.com','test-password'),/Admin access required/);assert.ok(checked&&signedOut);assert.equal(session.accessToken(),null);
});
test('admin UI commands map to Supabase RPC payloads without a local API request',async()=>{
 class SessionService{}class SupabaseService{};const calls=[];
 const modules={'@angular/core':{Injectable:()=>()=>{},signal,inject:token=>token===SessionService?{ensure:async()=>{}}:{rpc:async(name,args)=>{calls.push({name,args});return [];}}},'./image-preparation.service':{ImagePreparationService:class{}},'./session.service':{SessionService},'./supabase.service':{SupabaseService},'./fallback.json':{profile:{name:'Fallback'}},dompurify:{sanitize:s=>s}};
 const {CmsService}=load('src/app/core/cms.service.ts',modules);const cms=new CmsService();
 await cms.list('projects');await cms.save('projects',{id:'item-id',data:{title:'Example'},position:2,version:3});await cms.remove('projects','item-id');await cms.request('/admin/reorder/projects',{method:'POST',body:'["one","two"]'});await cms.request('/admin/analytics?days=90');
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),[
 {name:'portfolio_admin',args:{action:'list',section:'projects',payload:{}}},
 {name:'portfolio_admin',args:{action:'save',section:'projects',payload:{data:{title:'Example'},position:2,version:3,id:'item-id'}}},
 {name:'portfolio_admin',args:{action:'delete',section:'projects',payload:{id:'item-id'}}},
 {name:'portfolio_admin',args:{action:'reorder',section:'projects',payload:{ids:['one','two']}}},
 {name:'portfolio_admin',args:{action:'analytics',section:'',payload:{days:90}}}]);
});
