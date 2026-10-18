const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
test('summary fills both margins and work locations align opposite the company',()=>{
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/core/resume-layout.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports});
 const {jsPDF}=require('jspdf'),doc=new jsPDF({unit:'mm',format:'a4'}),calls=[],write=doc.text.bind(doc);
 doc.text=(value,x,y,options)=>{calls.push({value,x,y,options,width:doc.getTextWidth(String(value))});return write(value,x,y,options);};
 exports.renderResume(doc,{profile:{name:'Example Owner',resume_summary:('Reliable software with thoughtful interfaces and dependable services. ').repeat(8)},jobs:[{title:'Developer',company:'Example Company',location:'Karachi, Pakistan',date:'2024 - Present'}]});
 const first=calls.find(call=>call.value==='Reliable ');assert.ok(first);const line=calls.filter(call=>call.y===first.y);assert.ok(line.length>5);const last=line.at(-1);assert.ok(Math.abs(last.x+last.width-194)<.1);
 const company=calls.find(call=>call.value==='Example Company'),city=calls.find(call=>call.value==='Karachi, Pakistan');assert.equal(city.y,company.y);assert.equal(city.x,194);assert.equal(city.options.align,'right');
});
function service(fetchImpl){
  const exports={};class Cms{}class Analytics{}
  const layoutExports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/core/resume-layout.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{exports:layoutExports});
  const code=ts.transpileModule(fs.readFileSync('src/app/core/resume.service.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,experimentalDecorators:true}}).outputText;
  const snapshot={profile:{name:'Test Owner',description:['Text based summary'],socials:[],soft_skills:['Communication'],languages:['English']},skill_groups:[{title:'Backend',names:['Java']}],jobs:[],projects:[{name:'Included project',in_resume:true},{name:'Excluded project',in_resume:false}],education:[],certificates:[]};
  vm.runInNewContext(code,{exports,require:name=>name==='./resume-layout'?layoutExports:name==='@angular/core'?{Injectable:()=>()=>{},inject:token=>token===Cms?{snapshot:()=>snapshot}:{event(){}}}:name==='./cms.service'?{CmsService:Cms}:name==='./analytics.service'?{AnalyticsService:Analytics}:require(name),Blob,URL,setTimeout,fetch:fetchImpl});
  return {resume:new exports.ResumeService(),snapshot};
}
test('generated resume is a text PDF, caches unchanged data and reflects new skills',async()=>{
  const {resume,snapshot}=service();const first=await resume.pdf(snapshot);assert.equal(first.type,'application/pdf');const text=await first.text();assert.ok(text.startsWith('%PDF'));assert.ok(text.includes('Java'));assert.ok(!text.includes('Excluded project'));assert.equal(await resume.pdf(snapshot),first);snapshot.skill_groups[0].names.push('Dynamic test skill');const updated=await resume.pdf(snapshot);assert.notEqual(updated,first);assert.ok((await updated.text()).includes('Dynamic test skill'));
});
test('uploaded resume returns exactly the supplied bytes',async()=>{
  const original=new Blob(['%PDF-1.4 exact uploaded bytes'],{type:'application/pdf'});const {resume,snapshot}=service(async()=>({ok:true,blob:async()=>original}));snapshot.profile.resume_mode='uploaded';snapshot.profile.resume_url='https://example.com/resume.pdf';assert.equal(await resume.pdf(snapshot),original);
});
