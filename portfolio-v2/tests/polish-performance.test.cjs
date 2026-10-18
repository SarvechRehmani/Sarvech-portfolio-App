const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
test('no effect switches once without taking snapshots or measuring the button',async()=>{
 const exports={};let applied=0;
 const code=ts.transpileModule(fs.readFileSync('src/app/core/theme-motion.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,document:{startViewTransition(){throw Error('An instant switch must not capture snapshots');}}});
 await exports.revealTheme({getBoundingClientRect(){throw Error('Unexpected layout read');}},'none',()=>applied++);
 assert.equal(applied,1);
 assert.ok(exports.themeEffects.some(effect=>effect.value==='none'));
});
test('theme snapshots release their animation and transition after switching once',async()=>{
 const exports={},classes=new Set();let applied=0,cancelled=0,skipped=0;
 const root={classList:{add:v=>classes.add(v),remove:v=>classes.delete(v)},animate:()=>({finished:Promise.resolve(),cancel:()=>cancelled++})};
 const code=ts.transpileModule(fs.readFileSync('src/app/core/theme-motion.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 vm.runInNewContext(code,{exports,innerWidth:1000,innerHeight:700,setTimeout:()=>1,clearTimeout(){},document:{documentElement:root,startViewTransition:callback=>{callback();return {ready:Promise.resolve(),skipTransition:()=>skipped++}}}});
 await exports.revealTheme({getBoundingClientRect:()=>({left:800,top:20,width:40,height:40})},'portal',()=>applied++);
 assert.equal(applied,1);assert.equal(cancelled,1);assert.equal(skipped,1);assert.equal(classes.size,0);
});
test('mail notification escapes visitor content and preserves plain text fallback',()=>{
 let code=fs.readFileSync('supabase/functions/portfolio-mail/index.ts','utf8').replace(/^import .*;\r?\n/gm,'');
 const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports,Deno:{serve(){}},Response});
 const html=exports.mailHtml({kind:'notification',sender_name:'<script>bad</script>',sender_email:'friend@example.com',message_subject:'Hello & welcome',message_body:'<img src=x onerror=alert(1)>',text:'fallback'});
 assert.ok(html.includes('&lt;script&gt;bad&lt;/script&gt;'));assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('friend@example.com'));assert.ok(html.includes('Hello &amp; welcome'));
 assert.match(fs.readFileSync('supabase/functions/portfolio-mail/index.ts','utf8'),/text:job.text,html:mailHtml\(job\)/);
});

test('public theme motion has a stronger, slower blend while admin timing stays unchanged',async()=>{
 for(const [admin,duration,blur] of [[false,780,'blur(16px)'],[true,500,'blur(8px)']]){
  const exports={},animations=[],root={classList:{add(){},remove(){}},animate:(frames,options)=>{animations.push({frames,options});return {finished:Promise.resolve(),cancel(){}};}};
  const code=ts.transpileModule(fs.readFileSync('src/app/core/theme-motion.js','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  vm.runInNewContext(code,{exports,innerWidth:1000,innerHeight:700,setTimeout:()=>1,clearTimeout(){},document:{documentElement:root,startViewTransition:callback=>{callback();return {ready:Promise.resolve(),skipTransition(){}};}}});
  await exports.revealTheme({closest:()=>admin?{}:null,getBoundingClientRect:()=>({left:900,top:20,width:40,height:40})},'blur',()=>{});
  const incoming=animations.find(a=>a.options.pseudoElement==='::view-transition-new(root)');
  assert.equal(incoming.options.duration,duration);assert.equal(incoming.frames[0].filter,blur);assert.equal(incoming.frames.at(-1).filter,'blur(0px)');
 }
});
