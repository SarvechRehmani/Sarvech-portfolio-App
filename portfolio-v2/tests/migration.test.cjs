const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const signal=value=>Object.assign(()=>value,{set:next=>{value=next;},update:update=>{value=update(value);}});
const core={Component:()=>()=>{},Injectable:()=>()=>{},ViewEncapsulation:{None:2},signal,computed:fn=>fn,afterEveryRender:()=>{},inject:()=>({nativeElement:{querySelector:()=>null},onDestroy(){},messageContext(){return {};}})};
function load(file,overrides={}){
  file=path.resolve(file);
  const exports={};
  const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
  vm.runInNewContext(code,{exports,require:name=>name==='@angular/core'?{...core,...overrides.core}:overrides.modules?.[name]||load(path.resolve(path.dirname(file),name.endsWith('.js')?name:name+'.ts'),overrides),window:{scrollY:0},...overrides.globals},{filename:file});
  return exports;
}
test('project pagination is 3 → 5 → 7 → 8 and filtering resets to 3',()=>{
  const {ProjectsComponent}=load('src/app/sections/projects.component.ts');
  const component=new ProjectsComponent();
  assert.equal(component.visible().length,3);
  const first=component.visible()[0].id;
  for(const expected of [5,7,8]){component.loadMore();assert.equal(component.visible().length,expected);assert.equal(component.visible()[0].id,first);}
  component.filter('web');assert.ok(component.visible().every(p=>p.category==='web'));assert.equal(component.count(),3);
});
test('skill preview clears; a clicked skill persists and connections remain bounded in the template',()=>{
  const {SkillsComponent}=load('src/app/sections/skills.component.ts');
  const component=new SkillsComponent();
  component.hover({pointerType:'mouse'},'Java');assert.equal(component.active(),'Java');
  component.hovered.set(null);assert.equal(component.active(),null);
  component.pinned.set('Java');component.hover({pointerType:'mouse'},'Angular');assert.equal(component.active(),'Angular');
  component.hovered.set(null);assert.equal(component.active(),'Java');assert.ok(component.connections().includes('Spring Boot'));
  component.reset();assert.equal(component.active(),null);
  assert.match(fs.readFileSync('src/app/sections/skills.component.html','utf8'),/connections\(\)\.slice\(0,\s*6\)/);
});
test('Contact calls Supabase directly, forwards the abort signal and surfaces failures',async()=>{
  let request;class SupabaseService{}class AnalyticsService{}
  const client={rpc:(name,args)=>({abortSignal:async signal=>{request={name,args,signal};return {error:null};}})};
  const overrides={modules:{'./supabase.service':{SupabaseService},'./analytics.service':{AnalyticsService}},core:{inject:token=>token===SupabaseService?{client}:{messageContext:()=>({})}},globals:{DOMException}};
  const {EmailService}=load('src/app/core/email.service.ts',overrides);
  const message={name:'Test',email:'test@example.com',subject:'Hello',message:'Mocked message only.'},controller=new AbortController();await new EmailService().send(message,controller.signal);
  assert.deepEqual(JSON.parse(JSON.stringify(request.args.payload)),message);assert.equal(request.name,'portfolio_contact');assert.equal(request.signal,controller.signal);
  client.rpc=()=>({abortSignal:async()=>({error:{code:'P0001'}})});await assert.rejects(new EmailService().send(message,controller.signal),e=>e.status===400);
  controller.abort();await assert.rejects(new EmailService().send(message,controller.signal),e=>e.name==='AbortError');
});

test('runtime disposal removes listeners and stops timers, observers and animation frames',()=>{
  const cleared=[];let disconnected=false,removed=false;
  const {createRuntimeScope}=load('src/app/runtime/runtime-scope.js',{globals:{window:{setTimeout:()=>1,setInterval:()=>2,requestAnimationFrame:()=>3,clearTimeout:id=>cleared.push(id),clearInterval:id=>cleared.push(id),cancelAnimationFrame:id=>cleared.push(id)}}});
  const scope=createRuntimeScope();
  scope.listen({addEventListener(){},removeEventListener(){removed=true;}},'click',()=>{});
  scope.observe({disconnect(){disconnected=true;}});scope.setTimeout(()=>{},1);scope.setInterval(()=>{},1);scope.requestAnimationFrame(()=>{});scope.destroy();
  assert.equal(removed,true);assert.equal(disconnected,true);assert.deepEqual(cleared,[1,2,3]);assert.equal(scope.requestAnimationFrame(()=>{}),0);
});
test('all project and certificate media is mapped to Supabase Storage with matching source bytes',()=>{
  const data=load('src/app/runtime/portfolio-data.js');
  assert.equal(Object.keys(data.projectsData).length,8);assert.equal(data.certificatesData.length,10);
  const manifest=JSON.parse(fs.readFileSync('tests/media-manifest.json','utf8'));
  const verify=url=>{const entry=manifest.find(m=>m.url===url);assert.ok(entry,url);assert.match(url,/^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/portfolio\//);assert.equal(fs.statSync(path.join('public',entry.local)).size,entry.size);};
  for(const p of Object.values(data.projectsData))for(const image of p.images)verify(image);
  for(const c of data.certificatesData)verify(c.image);
  assert.ok(fs.existsSync('public/assets/Sarvech-Rehmani-CV.pdf'));
});
