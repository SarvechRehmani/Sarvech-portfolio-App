const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const signal=v=>Object.assign(()=>v,{set:next=>v=next});

test('a new visitor gets the published default mode while a saved preference wins',()=>{
 const root={dataset:{}},snapshot={layout:{default_mode:'light'}};let preference=null;
 const {BrandService}=load('src/app/core/brand.service.ts',{'@angular/core':{Injectable:()=>()=>{},inject:()=>({snapshot:()=>snapshot})},'./cms.service':{},'./brand':{}},{document:{documentElement:root},localStorage:{getItem:()=>preference}});
 const service=new BrandService();service.appearance();assert.equal(root.dataset.theme,'light');preference='dark';service.appearance();assert.equal(root.dataset.theme,'dark');preference='invalid';service.appearance();assert.equal(root.dataset.theme,'light');
});

test('parallel admin preflights share authorization and re-check a changed JWT',async()=>{
 class SupabaseService{};let token='first',checks=0,allowed=true,signouts=0;
 const client={auth:{onAuthStateChange(){},signOut:async()=>{signouts++;return {};},getSession:async()=>({data:{session:{access_token:token}}}),mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1',nextLevel:'aal1'}})}}};
 const {SessionService}=load('src/app/core/session.service.ts',{'@angular/core':{Injectable:()=>()=>{},signal,inject:()=>({client,rpc:async()=>{checks++;await new Promise(resolve=>setImmediate(resolve));return allowed;}})},'./supabase.service':{SupabaseService}});
 const session=new SessionService();await Promise.all([session.ensure(),session.ensure(),session.ensure()]);assert.equal(checks,1);
 await session.ensure();assert.equal(checks,1);
 token='different';allowed=false;await assert.rejects(session.ensure(),/Admin access required/);assert.equal(checks,2);assert.equal(signouts,1);assert.equal(session.accessToken(),null);
});

test('studio palette follows the supplied published brand in dark and light modes',()=>{
 const brand=load('src/app/core/brand.ts');
 const {studioPalette}=load('src/app/core/studio-palette.ts',{'./brand':brand});
 assert.equal(studioPalette(brand.forestGreen,false)['--a-accent'],'#c3f578');
 assert.equal(studioPalette(brand.forestGreen,true)['--a-accent'],'#467923');
 assert.equal(studioPalette(brand.blackTheme,false)['--a-on-accent'],'#000000');
 assert.equal(studioPalette(brand.royalBlue,true)['--a-bg'],'#f0f5ff');
});

test('home layout reorders navigation with sections and hides disabled links',()=>{
 const layout={sections:[{key:'projects',enabled:true},{key:'skills',enabled:false},{key:'about',enabled:true}]};
 const nodes=Object.fromEntries(['home','strip','about','skills','projects'].map(id=>[id,{id,style:{},setAttribute(){}}]));
 const children=Object.values(nodes),links=['about','skills','projects'].map(id=>({id,href:'https://example.com/#'+id,style:{}}));
 const append=(items,item)=>{items.splice(items.indexOf(item),1);items.push(item);};
 const nav={querySelectorAll:()=>[...links],append:link=>append(links,link)};
 const main={querySelector:()=>null,append:node=>append(children,node)};
 const document={getElementById:id=>id==='main'?main:id==='project-detail'?null:nodes[id],querySelectorAll:selector=>selector==='.header nav'?[nav]:[]};
 const {BrandService}=load('src/app/core/brand.service.ts',{'@angular/core':{Injectable:()=>()=>{},inject:()=>({snapshot:()=>({layout})})},'./cms.service':{CmsService:class{}},'./brand':{defaultSections:[],royalBlue:{},themeTokens:[]}},{document,location:{origin:'https://example.com'},URL});
 new BrandService().layout();
 assert.deepEqual(children.map(node=>node.id),['home','strip','projects','skills','about']);
 assert.deepEqual(links.map(link=>link.id),['projects','skills','about']);
 assert.equal(links.find(link=>link.id==='skills').hidden,true);
 assert.equal(links.find(link=>link.id==='projects').hidden,false);
});
function load(file,dependencies={},globals={}){const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText,{exports,require:name=>dependencies[name],URLSearchParams,structuredClone,...globals});return exports;}
test('private preview content never enters the published cache and disappears on revocation',async()=>{
 class SessionService{}class SupabaseService{};let revoked=false,poll;
 const published={profile:{name:'Published'}};const rpc=async()=>{if(revoked)throw Error('Revoked');return {profile:{name:'Private draft'}};};
 const fakeDocument={querySelector:()=>null,createElement:()=>({dataset:{}}),head:{append(){}},querySelectorAll:()=>[]};
 const {CmsService}=load('src/app/core/cms.service.ts',{'@angular/core':{Injectable:()=>()=>{},signal,inject:token=>token===SessionService?{}:{rpc}},'./image-preparation.service':{ImagePreparationService:class{}},'./session.service':{SessionService},'./supabase.service':{SupabaseService},'./fallback.json':{default:published},dompurify:{}},{location:{search:'?draft='+ 'a'.repeat(64)},document:fakeDocument,localStorage:{setItem(){throw Error('Private data must never be cached');},getItem:()=>null},setInterval:fn=>{poll=fn;return 1;},clearInterval(){}});
 const cms=new CmsService();await cms.load();assert.equal(cms.snapshot().profile.name,'Private draft');assert.equal(cms.sharedDenied(),false);
 revoked=true;poll();await new Promise(resolve=>setImmediate(resolve));assert.equal(cms.sharedDenied(),true);assert.equal(cms.snapshot().profile.name,'Published');
});
test('password-only login stops at MFA before admin calls when an authenticator is enabled',async()=>{
 class SupabaseService{};let calls=0;
 const client={auth:{onAuthStateChange(){},signInWithPassword:async()=>({data:{session:{access_token:'password-only'}}}),mfa:{getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:'aal1',nextLevel:'aal2'}})}}};
 const {SessionService}=load('src/app/core/session.service.ts',{'@angular/core':{Injectable:()=>()=>{},signal,inject:()=>({client,rpc:async()=>{calls++;return true;}})},'./supabase.service':{SupabaseService}});
 const session=new SessionService();await session.login('owner@example.com','password');assert.equal(session.mfaRequired(),true);assert.equal(calls,0);
});
test('theme imports reject executable CSS and accept the documented JSON format',()=>{
 const {validateTheme,royalBlue}=load('src/app/core/brand.ts',{}, {CSS:{supports:()=>true}});
 assert.equal(validateTheme({format:'portfolio-theme-v1',...royalBlue}).name,'Royal Blue');
 const malformed=structuredClone(royalBlue);malformed.dark.accent='url(https://example.invalid/tracker)';
 assert.throws(()=>validateTheme({format:'portfolio-theme-v1',...malformed}),/Invalid color/);
 assert.throws(()=>validateTheme({format:'portfolio-theme-v1',name:'Missing mode',dark:{}}),/required|Missing/);
});
test('media deletion re-checks references and never calls Storage for an in-use file',async()=>{
 class SessionService{}class SupabaseService{};let deletes=0;
 const {StudioService}=load('src/app/core/studio.service.ts',{'@angular/core':{Injectable:()=>()=>{},inject:token=>token===SessionService?{ensure:async()=>{}}:{rpc:async()=>[{id:'file',unused:false}],client:{storage:{from:()=>({remove:async()=>{deletes++;return {};}})}}}},'./image-preparation.service':{ImagePreparationService:class{}},'./session.service':{SessionService},'./supabase.service':{SupabaseService}});
 await assert.rejects(new StudioService().deleteFile({id:'file'}),/still used/);assert.equal(deletes,0);
});
