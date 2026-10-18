const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),ts=require('typescript');
const exportsObject={};vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/app/core/link-analytics.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:exportsObject,URL});
const track=exportsObject.trackedLink,origin='https://portfolio.example';
test('internal navigation is not counted as a social click',()=>{for(const href of ['#about','https://portfolio.example/#contact','/blog/post','mailto:owner@example.com','javascript:alert(1)'])assert.equal(track(href,origin),null);});
test('canonical and load-more legacy project links both count as project clicks',()=>{assert.equal(track('/projects/my-app',origin).type,'project');assert.equal(track('project.html?id=my_app',origin).type,'project');});
test('external account and code links count as social clicks',()=>{assert.equal(track('https://github.com/owner/app',origin).type,'social');assert.equal(track('https://www.linkedin.com/in/owner',origin).type,'social');});
