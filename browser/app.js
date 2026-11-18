const maxBytes=5*1024*1024,maxCues=5000;
const stamp='(?:\\d{2,}:)?[0-5]\\d:[0-5]\\d[.,]\\d{3}';
const timing=new RegExp(`^(${stamp})[ \\t]+-->[ \\t]+(${stamp})(?:[ \\t].*)?$`);
const status=document.querySelector('#status'),details=document.querySelector('#details');
const pt=document.documentElement.lang.toLowerCase()==='pt-br';
const text=(en,br)=>pt?br:en;
let generation=0;
function time(s){const parts=s.replace(',','.').split(':'),sec=parts.pop().split('.');const hours=parts.length===2?Number(parts[0]):0,minutes=Number(parts.at(-1));return ((hours*60+minutes)*60+Number(sec[0]))*1000+Number(sec[1]);}
function parse(bytes,format){
 if(!bytes.byteLength||bytes.byteLength>maxBytes)throw Error(text('Each file must be non-empty and at most 5 MiB.','Cada arquivo deve ter conteúdo e no máximo 5 MiB.'));
 let s;try{s=new TextDecoder('utf-8',{fatal:true}).decode(bytes).replace(/\r\n?/g,'\n').replace(/^\uFEFF/,'')}catch{throw Error(text('Files must use valid UTF-8 encoding.','Os arquivos precisam usar uma codificação UTF-8 válida.'))}
 if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(s))throw Error(text('The file contains unsupported control characters.','O arquivo contém caracteres de controle não aceitos.'));
 const blocks=s.trim().split(/\n{2,}/),out=[];
 if(format==='vtt'){if(!/^WEBVTT(?:[ \t][^\n]*)?(?:\n[^\n]*)*$/.test(blocks.shift()||''))throw Error(text('The WebVTT header is missing or invalid.','O cabeçalho WebVTT está ausente ou é inválido.'))}
 for(const block of blocks){
  if(format==='vtt'&&/^(?:NOTE(?:[ \t\n]|$)|STYLE(?:\n|$)|REGION(?:\n|$))/.test(block))continue;
  const lines=block.split('\n'),idx=lines[0]?.includes('-->')?0:1;
  if(format==='srt'&&(idx!==1||!/^\d+$/.test(lines[0])))throw Error(text('An SRT cue number is missing or invalid.','Um número de bloco SRT está ausente ou é inválido.'));
  const m=timing.exec(lines[idx]||'');if(!m)throw Error(text('A cue has an invalid timestamp.','Um bloco contém um tempo inválido.'));
  if(format==='srt'&&(!/^\d{2,}:/.test(m[1])||!m[1].includes(',')||!/^\d{2,}:/.test(m[2])||!m[2].includes(',')))throw Error(text('SRT times must use hours and comma milliseconds.','Os tempos SRT precisam incluir horas e vírgula antes dos milissegundos.'));
  if(format==='vtt'&&(m[1].includes(',')||m[2].includes(',')))throw Error(text('WebVTT times must use decimal points.','Os tempos WebVTT devem usar ponto decimal.'));
  const start=time(m[1]),end=time(m[2]);if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||end<=start)throw Error(text('A cue has an invalid time range.','Um bloco contém um intervalo de tempo inválido.'));
  out.push([start,end]);if(out.length>maxCues)throw Error(text('The limit is 5,000 cues per file.','O limite é de 5.000 blocos por arquivo.'));
 }
 if(!out.length)throw Error(text('No subtitle cues found.','Nenhum bloco de legenda encontrado.'));return out;
}
function show(a,b){details.replaceChildren();if(a.length!==b.length){status.textContent=text(`Different cue counts: ${a.length} original, ${b.length} translated. Review alignment before comparing by position.`,`Quantidades diferentes: ${a.length} blocos no original e ${b.length} na tradução. Revise o alinhamento antes de comparar por posição.`);return}
 let count=0;for(let i=0;i<a.length;i++)if(a[i][0]!==b[i][0]||a[i][1]!==b[i][1]){count++;if(count<=50){const li=document.createElement('li');li.textContent=text(`Cue ${i+1}: original ${a[i][0]}–${a[i][1]} ms; translated ${b[i][0]}–${b[i][1]} ms`,`Bloco ${i+1}: original ${a[i][0]}–${a[i][1]} ms; tradução ${b[i][0]}–${b[i][1]} ms`);details.append(li)}}
 status.textContent=count?text(`${count} of ${a.length} cue positions have different times.${count>50?' Showing the first 50.':''}`,`${count} de ${a.length} posições têm tempos diferentes.${count>50?' Mostrando as 50 primeiras.':''}`):text(`All ${a.length} cue positions have matching times. This does not prove synchronization or translation accuracy.`,`As ${a.length} posições têm tempos iguais. Isso não comprova sincronização ou precisão da tradução.`);
}
async function read(file){if(!file)throw Error(text('Choose both subtitle files.','Escolha os dois arquivos de legenda.'));const m=/\.(srt|vtt)$/i.exec(file.name);if(!m)throw Error(text('Choose an .srt or .vtt file.','Escolha um arquivo .srt ou .vtt.'));if(!file.size||file.size>maxBytes)throw Error(text('Each file must be non-empty and at most 5 MiB.','Cada arquivo deve ter conteúdo e no máximo 5 MiB.'));return parse(new Uint8Array(await file.arrayBuffer()),m[1].toLowerCase())}
document.querySelector('#compare').addEventListener('click',async()=>{const run=++generation;details.replaceChildren();status.textContent=text('Reading files locally…','Lendo os arquivos neste navegador…');try{const a=document.querySelector('#original').files[0],b=document.querySelector('#translated').files[0];const pair=await Promise.all([read(a),read(b)]);if(run===generation)show(...pair)}catch(e){if(run===generation)status.textContent=e.message||text('Could not read these files.','Não foi possível ler os arquivos.')}});
document.querySelector('#sample').addEventListener('click',()=>{generation++;document.querySelector('#original').value='';document.querySelector('#translated').value='';const a=new TextEncoder().encode('1\n00:00:01,000 --> 00:00:02,000\nHello\n\n2\n00:00:03,000 --> 00:00:04,000\nGoodbye\n'),b=new TextEncoder().encode('WEBVTT\n\n00:01.000 --> 00:02.000\nHola\n\n00:03.000 --> 00:04.001\nAdiós\n');show(parse(a,'srt'),parse(b,'vtt'))});
document.querySelector('#clear').addEventListener('click',()=>{generation++;document.querySelector('#original').value='';document.querySelector('#translated').value='';details.replaceChildren();status.textContent=text('Choose two files or try the example.','Escolha dois arquivos ou experimente o exemplo.')});
for(const id of ['original','translated'])document.querySelector('#'+id).addEventListener('change',()=>{generation++;details.replaceChildren();status.textContent=text('Files changed. Select Compare files to check timing.','Arquivos alterados. Selecione Comparar arquivos para conferir os tempos.')});


