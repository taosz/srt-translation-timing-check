const maxBytes=5*1024*1024,maxCues=5000;
const stamp='(?:\\d{2,}:)?[0-5]\\d:[0-5]\\d[.,]\\d{3}';
const timing=new RegExp(`^(${stamp})[ \\t]+-->[ \\t]+(${stamp})(?:[ \\t].*)?$`);
const status=document.querySelector('#status'),details=document.querySelector('#details');
let generation=0;
function time(s){const parts=s.replace(',','.').split(':'),sec=parts.pop().split('.');const hours=parts.length===2?Number(parts[0]):0,minutes=Number(parts.at(-1));return ((hours*60+minutes)*60+Number(sec[0]))*1000+Number(sec[1]);}
function parse(bytes,format){
 if(!bytes.byteLength||bytes.byteLength>maxBytes)throw Error('Each file must be non-empty and at most 5 MiB.');
 let s;try{s=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/\r\n?/g,'\n').replace(/^\uFEFF/,'')}catch{throw Error('Files must use valid UTF-8 encoding.')}
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s))throw Error('The file contains unsupported control characters.');
 const blocks=s.trim().split(/\n{2,}/),out=[];
 if(format==='vtt'){if(!/^WEBVTT(?:[ \t][^\n]*)?(?:\n[^\n]*)*$/.test(blocks.shift()||''))throw Error('The WebVTT header is missing or invalid.')}
 for(const block of blocks){
  if(format==='vtt'&&/^(?:NOTE(?:[ \t\n]|$)|STYLE(?:\n|$)|REGION(?:\n|$))/.test(block))continue;
  const lines=block.split('\n'),idx=lines[0]?.includes('-->')?0:1;
  if(format==='srt'&&(idx!==1||!/^\d+$/.test(lines[0])))throw Error('An SRT cue number is missing or invalid.');
  const m=timing.exec(lines[idx]||'');if(!m)throw Error('A cue has an invalid timestamp.');
  if(format==='srt'&&(!/^\d{2,}:/.test(m[1])||!m[1].includes(',')||!/^\d{2,}:/.test(m[2])||!m[2].includes(',')))throw Error('SRT times must use hours and comma milliseconds.');
  if(format==='vtt'&&(m[1].includes(',')||m[2].includes(',')))throw Error('WebVTT times must use decimal points.');
  const start=time(m[1]),end=time(m[2]);if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<=start)throw Error('A cue has an invalid time range.');
  out.push([start,end]);if(out.length>maxCues)throw Error('The limit is 5,000 cues per file.');
 }
 if(!out.length)throw Error('No subtitle cues found.');return out;
}
function show(a,b){details.replaceChildren();if(a.length!==b.length){status.textContent=`Different cue counts: ${a.length} original, ${b.length} translated. Review alignment before comparing by position.`;return}
 let count=0;for(let i=0;i<a.length;i++)if(a[i][0]!==b[i][0]||a[i][1]!==b[i][1]){count++;if(count<=50){const li=document.createElement('li');li.textContent=`Cue ${i+1}: original ${a[i][0]}–${a[i][1]} ms; translated ${b[i][0]}–${b[i][1]} ms`;details.append(li)}}
 status.textContent=count?`${count} of ${a.length} cue positions have different times.${count>50?' Showing the first 50.':''}`:`All ${a.length} cue positions have matching times. This does not prove synchronization or translation accuracy.`;
}
async function read(file){if(!file)throw Error('Choose both subtitle files.');const m=/\.(srt|vtt)$/i.exec(file.name);if(!m)throw Error('Choose an .srt or .vtt file.');if(!file.size||file.size>maxBytes)throw Error('Each file must be non-empty and at most 5 MiB.');return parse(new Uint8Array(await file.arrayBuffer()),m[1].toLowerCase())}
document.querySelector('#compare').addEventListener('click',async()=>{const run=++generation;details.replaceChildren();status.textContent='Reading files locally…';try{const a=document.querySelector('#original').files[0],b=document.querySelector('#translated').files[0];const pair=await Promise.all([read(a),read(b)]);if(run===generation)show(...pair)}catch(e){if(run===generation)status.textContent=e.message||'Could not read these files.'}});
document.querySelector('#sample').addEventListener('click',()=>{generation++;document.querySelector('#original').value='';document.querySelector('#translated').value='';const a=new TextEncoder().encode('1\n00:00:01,000 --> 00:00:02,000\nHello\n\n2\n00:00:03,000 --> 00:00:04,000\nGoodbye\n'),b=new TextEncoder().encode('WEBVTT\n\n00:01.000 --> 00:02.000\nHola\n\n00:03.000 --> 00:04.001\nAdiós\n');show(parse(a,'srt'),parse(b,'vtt'))});
document.querySelector('#clear').addEventListener('click',()=>{generation++;document.querySelector('#original').value='';document.querySelector('#translated').value='';details.replaceChildren();status.textContent='Choose two files or try the example.'});
for(const id of ['original','translated'])document.querySelector('#'+id).addEventListener('change',()=>{generation++;details.replaceChildren();status.textContent='Files changed. Select Compare files to check timing.'});

