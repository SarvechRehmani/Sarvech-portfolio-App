const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),{jsPDF}=require('jspdf');
const exportsObject={};
const source=ts.transpileModule(fs.readFileSync('src/app/core/resume-layout.ts','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
vm.runInNewContext(source,{exports:exportsObject});
async function run(){
 const config=JSON.parse(fs.readFileSync('public/config.json','utf8'));const response=await fetch(config.supabaseUrl+'/rest/v1/rpc/portfolio_site',{method:'POST',headers:{apikey:config.supabasePublishableKey,'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw Error('Supabase is unavailable.');
 const snapshot=await response.json();if(!snapshot.profile?.name)throw Error('Content is not imported yet.');
 const doc=new jsPDF({unit:'mm',format:'a4'});exportsObject.renderResume(doc,snapshot);
 const output=process.env.RESUME_OUTPUT||'docs/Resume-preview.pdf';
 fs.mkdirSync(require('node:path').dirname(output),{recursive:true});
 fs.writeFileSync(output,Buffer.from(doc.output('arraybuffer')));
 console.log('Generated ATS resume: '+doc.getNumberOfPages()+' A4 pages.');
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});
