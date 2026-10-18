const fs=require('node:fs'),path=require('node:path');
const root=path.dirname(require.resolve('pdfjs-dist/package.json')),target='public/assets/pdfjs';fs.mkdirSync(target,{recursive:true});
fs.copyFileSync(path.join(root,'build/pdf.worker.min.mjs'),path.join(target,'pdf.worker.min.js'));
for(const folder of ['cmaps','standard_fonts','wasm'])if(fs.existsSync(path.join(root,folder)))fs.cpSync(path.join(root,folder),path.join(target,folder),{recursive:true});
if(fs.existsSync(path.join(root,'LICENSE')))fs.copyFileSync(path.join(root,'LICENSE'),path.join(target,'LICENSE'));
console.log('Lazy PDF viewer assets ready.');

