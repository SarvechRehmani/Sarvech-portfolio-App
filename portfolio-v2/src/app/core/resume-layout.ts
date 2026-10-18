import type {jsPDF} from 'jspdf';
import type {Snapshot} from './cms.service';

/** Selectable, single-column A4 text. Layout follows the owner's original CV. */
export function renderResume(doc:jsPDF,snapshot:Snapshot):void {
  const left=16,right=194,width=right-left,bottom=278;
  let y=19;
  const clean=(value:unknown)=>String(value??'').replace(/<\/(?:li|p|div)>|<br\s*\/?>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/[–—]/g,'-').replace(/[‘’]/g,"'").replace(/[“”]/g,'"').replace(/\s+/g,' ').trim();
  const ensure=(height:number)=>{if(y+height>bottom){doc.addPage();y=16;}};
  const font=(size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(20,20,20);};
  const paragraph=(value:unknown,{bold=false,size=9.7,indent=0,gap=2,justify=false}:{bold?:boolean;size?:number;indent?:number;gap?:number;justify?:boolean}={})=>{
    const content=clean(value);if(!content)return;
    font(size,bold);const lines=doc.splitTextToSize(content,width-indent) as string[];
    for(const [index,line] of lines.entries()){
      ensure(4.7);const words=line.split(' ');
      if(justify&&index<lines.length-1&&words.length>1){let x=left+indent;const spacing=(width-indent-doc.getTextWidth(line))/(words.length-1);for(const [wordIndex,word]of words.entries()){const token=word+(wordIndex<words.length-1?' ':'');doc.text(token,x,y);x+=doc.getTextWidth(token)+spacing;}}
      else doc.text(line,left+indent,y);
      y+=4.7;
    }y+=gap;
  };
  const labelled=(label:unknown,value:unknown,size=9.7)=>{
    const text=clean(value);if(!text)return;
    font(size,true);const prefix=clean(label).replace(/:$/,'')+': ',prefixWidth=doc.getTextWidth(prefix);
    if(prefixWidth>width*.65){paragraph(prefix,{bold:true,size,gap:0});paragraph(text,{size});return;}
    const words=text.split(' ');let first=true;
    while(words.length){font(size);const available=width-(first?prefixWidth:0);let line=words.shift()!;
      while(words.length&&doc.getTextWidth(line+' '+words[0])<=available)line+=' '+words.shift();
      const pieces=doc.splitTextToSize(line,available) as string[];
      for(const piece of pieces){ensure(4.7);if(first){font(size,true);doc.text(prefix,left,y);}font(size);doc.text(piece,left+(first?prefixWidth:0),y);y+=4.7;first=false;}
    }y+=2;
  };
  const projectTitle=(title:unknown,items:[string,string][])=>{
    font(9);const total=items.reduce((sum,[label])=>sum+doc.getTextWidth(label)+5,0);
    font(10,true);const lines=doc.splitTextToSize(clean(title),width-(total?total+3:0)) as string[];ensure(lines.length*4.9+5);
    for(const [index,line]of lines.entries()){
      ensure(5);font(10,true);doc.text(line,left,y);
      if(index===0&&items.length){let x=Math.min(left+doc.getTextWidth(line)+6,right-total);font(9);
        for(const[label,url]of items){const size=doc.getTextWidth(label);doc.textWithLink(label,x,y,{url});doc.setDrawColor(30,30,30);doc.setLineWidth(.15);doc.line(x,y+.65,x+size,y+.65);x+=size+5;}
      }y+=4.9;
    }y+=1;
  };
  const bullet=(value:unknown)=>{const text=clean(value);if(!text)return;ensure(5);font();doc.text('-',left+2,y);paragraph(text,{indent:6,gap:1});};
  const heading=(label:string)=>{ensure(25);y+=4.5;font(10.4,true);doc.text(label.toUpperCase(),left,y);y+=2.3;doc.setDrawColor(155,160,168);doc.setLineWidth(.15);doc.line(left,y,right,y);y+=5.5;};
  const dated=(title:unknown,date:unknown)=>{
    ensure(16);font(10,true);const dateText=clean(date);font(9.4);const dateWidth=dateText?doc.getTextWidth(dateText):0;
    font(10,true);const lines=doc.splitTextToSize(clean(title),width-(dateWidth?dateWidth+7:0)) as string[];
    for(let i=0;i<lines.length;i++){ensure(5);doc.text(lines[i],left,y);if(i===0&&dateText){font(9.4);doc.text(dateText,right,y,{align:'right'});font(10,true);}y+=4.9;}
  };
  const links=(items:{label:string;url:string}[])=>{
    font(9);let line:typeof items=[],lineWidth=0;
    const draw=()=>{if(!line.length)return;let x=105-lineWidth/2;for(const [index,item]of line.entries()){if(index){doc.text(' | ',x,y);x+=doc.getTextWidth(' | ');}doc.textWithLink(item.label,x,y,{url:item.url});x+=doc.getTextWidth(item.label);}y+=4.7;line=[];lineWidth=0;};
    for(const item of items){const size=doc.getTextWidth(item.label)+(line.length?doc.getTextWidth(' | '):0);if(lineWidth+size>width)draw();line.push(item);lineWidth+=doc.getTextWidth(item.label)+(line.length>1?doc.getTextWidth(' | '):0);}draw();
  };
  const profile=snapshot.profile;
  doc.setProperties({title:clean(profile['name'])+' - Resume',author:clean(profile['name']),subject:'Professional resume'});
  font(22,true);doc.text(clean(profile['name']).toUpperCase(),105,y,{align:'center'});y+=6;
  if(profile['specialization']){font(10.5);doc.text(clean(profile['specialization']),105,y,{align:'center'});y+=6;}
  const contacts:{label:string;url:string}[]=[];
  if(profile['phone'])contacts.push({label:clean(profile['phone']),url:'tel:'+String(profile['phone']).replace(/[^+\d]/g,'')});
  if(profile['email'])contacts.push({label:clean(profile['email']),url:'mailto:'+profile['email']});
  for(const social of profile['socials']||[])if(/github|linkedin/i.test(social.title)&&/^https?:\/\//.test(social.url))contacts.push({label:clean(social.title),url:social.url});
  if(/^https?:\/\//.test(profile['website']||''))contacts.push({label:'Portfolio',url:profile['website']});
  links(contacts);
  if(profile['location']){font(9.5);doc.text('Location: '+clean(profile['location']),105,y,{align:'center'});y+=5;}
  heading('Professional Summary');
  const summary=profile['resume_summary']||(profile['description']||[]).join(' ');
  paragraph(summary,{justify:true});
  if(snapshot['skill_groups']?.length){heading('Technical Skills');for(const group of snapshot['skill_groups'])labelled(clean(group.title).replace(/^Databases\s*&\s*integration$/i,'Databases'),(group.names||[]).map(clean).join(', '));}
  if(snapshot['jobs']?.length){heading('Work Experience');for(const job of snapshot['jobs']){
    dated(job.title,job.date);
    font(9.5);const city=clean(job.location),cityWidth=doc.getTextWidth(city),companyLines=doc.splitTextToSize(clean(job.company),Math.max(35,width-(cityWidth?cityWidth+7:0))) as string[];
    for(const [index,line]of companyLines.entries()){ensure(5);doc.text(line,left,y);if(index===0&&city)doc.text(city,right,y,{align:'right'});y+=4.7;}y+=1;
    if(job.vendor)bullet(job.vendor);if(job.contribution)bullet(job.contribution);
    for(const value of job.contributions||[])bullet(value);
    for(const value of job.responsibilities||[])bullet(value);y+=1;
  }}
  if(snapshot['education']?.length){heading('Education');for(const row of snapshot['education']){
    dated(row.title||row.degree,row.date);
    const institution=clean([row.institution,row.gpa?'GPA: '+row.gpa:''].filter(Boolean).join(' | ')),location=clean(row.location);font(9.5);
    const locationWidth=doc.getTextWidth(location),lines=doc.splitTextToSize(institution,Math.max(35,width-(locationWidth?locationWidth+7:0))) as string[];
    for(const [index,line]of lines.entries()){ensure(5);doc.text(line,left,y);if(index===0&&location)doc.text(location,right,y,{align:'right'});y+=4.7;}y+=2;
  }}
  const projects=(snapshot['projects']||[]).filter(row=>row.in_resume!==false);
  if(projects.length){heading('Projects');for(const row of projects){
    const projectLinks:[string,string][]=[['GitHub',row.links?.github||''],['Frontend',row.links?.github2||''],['Live',row.links?.live||'']].filter(([,url])=>/^https?:\/\//.test(url)) as [string,string][];
    const technologies=row.technologies?.length?row.technologies:row.tags;
    font(9.7);const bodyLines=(row.resume_bullets?.length?row.resume_bullets:[row.overview||row.description||row.summary]).reduce((total:number,value:unknown)=>total+(doc.splitTextToSize(clean(value),width-6) as string[]).length,0);
    const techLines=technologies?.length?(doc.splitTextToSize('Technologies: '+technologies.join(', '),width) as string[]).length:0;
    ensure(Math.min(240,12+(projectLinks.length?5:0)+(bodyLines+techLines)*4.7+8));
    projectTitle(row.title||row.name,projectLinks);
    if(row.resume_bullets?.length)for(const value of row.resume_bullets)bullet(value);
    else paragraph(row.overview||row.description||row.summary);
    if(technologies?.length)labelled('Technologies',technologies.join(', '),9.3);y+=1;
  }}
  if(snapshot['certificates']?.length){heading('Certificates');for(const row of snapshot['certificates']){dated([row.issuer,row.title].filter(Boolean).join(' | '),row.date);y+=1;}}
  if(profile['soft_skills']?.length){heading('Soft Skills');paragraph(profile['soft_skills'].join(' | '));}
  if(profile['languages']?.length){heading('Languages');paragraph(profile['languages'].join(' | '));}
  const pages=doc.getNumberOfPages();
  for(let page=1;page<=pages;page++){
    doc.setPage(page);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(110,110,110);
    doc.text(clean(profile['name']),left,288);doc.text(`${page} / ${pages}`,right,288,{align:'right'});
  }
}
