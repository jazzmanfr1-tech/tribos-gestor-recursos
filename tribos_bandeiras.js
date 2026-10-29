javascript:(async()=>{
if(window.__flagsV30)return alert('Consulta em curso');window.__flagsV30=true;
const wait=ms=>new Promise(r=>setTimeout(r,ms)),txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const url=(screen,mode='',id='')=>{let u=new URL('/game.php',location.origin);u.searchParams.set('screen',screen);if(mode)u.searchParams.set('mode',mode);if(id)u.searchParams.set('village',id);u.searchParams.set('page','-1');return u};
const doc=async u=>{let r=await fetch(u,{credentials:'same-origin'});if(!r.ok)throw Error('HTTP '+r.status);return new DOMParser().parseFromString(await r.text(),'text/html')};
const find=tr=>{let a=[...tr.querySelectorAll('a[href*="village="]')].find(a=>/\(\d{3}\|\d{3}\)/.test(txt(a)));if(!a)return null;let id=new URL(a.href,location.href).searchParams.get('village');return id?{id,name:txt(a)}:null};
const num=s=>{let m=String(s).match(/\d[\d. ]*/);return m?Number(m[0].replace(/[. ]/g,'')):null};
const pop=tr=>{for(let c of tr.cells){let m=txt(c).match(/^([\d. ]+)\s*\/\s*([\d. ]+)$/);if(m&&num(m[2])>=1000&&num(m[1])<=num(m[2]))return num(m[1])+' / '+num(m[2])}return null};
const villages=new Map();function parse(d,mode){let headers=[...d.querySelectorAll('tr')].find(tr=>[...tr.cells].some(c=>/stone|argila|clay/i.test(c.outerHTML))&&tr.cells.length>6);let ci=headers?[...headers.cells].findIndex(c=>/stone|argila|clay/i.test(c.outerHTML)):-1;
for(let tr of d.querySelectorAll('tr')){let f=find(tr);if(!f)continue;if(!villages.has(f.id))villages.set(f.id,{...f,points:null,clay:null,pop:null});let v=villages.get(f.id);let p=pop(tr);if(p)v.pop=p;
let cells=[...tr.cells],ai=cells.findIndex(c=>[...c.querySelectorAll('a[href*="village="]')].some(a=>/\(\d{3}\|\d{3}\)/.test(txt(a))));
if(mode==='prod'||mode==='combined'){let candidates=cells.slice(ai+1).map(c=>txt(c)).filter(s=>/^\d{1,3}(?:[. ]\d{3})+$/.test(s));if(candidates.length){let n=num(candidates[0]);if(n>0)v.points=n}}
if(mode==='buildings'&&ci>=0){let s=txt(cells[ci]);if(/^\d{1,2}$/.test(s)&&+s<=30)v.clay=+s}
}}
async function clay(id){let d=await doc(url('main','',id));for(let sel of ['#main_buildrow_stone','#buildrow_stone','tr[data-building="stone"]']){let tr=d.querySelector(sel);if(!tr)continue;let s=txt(tr.querySelector('.build_level,.level')||tr);let m=s.match(/(?:Nível|Level)\s*(\d{1,2})/i)||s.match(/\b(\d{1,2})\b/);if(m&&+m[1]<=30)return +m[1]}return null}
function flag(d){let h=[...d.querySelectorAll('td,th,div,span,strong,b,h3,h4')].filter(e=>txt(e)==='Bandeira atual').sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];if(!h)return {name:'Sem bandeira',bonus:'—'};let s='';for(let el of [h.closest('table'),h.parentElement,h.parentElement?.parentElement]){let t=txt(el);if(t.length<650&&t.length>s.length)s=t}let kinds=['Produção de recursos','Velocidade de recrutamento','Força de ataque','Força de Defesa','Capacidade da população','Capacidade de carga','Sorte','Menores custos de moeda'];let name=kinds.find(k=>s.toLowerCase().includes(k.toLowerCase()));let m=s.match(/\d+(?:[,.]\d+)?\s*%[^%]{0,75}/);return {name:name||'Sem bandeira',bonus:m?m[0].split(/Remover bandeira|Bandeiras disponíveis/i)[0].trim():'—'}}
function state(d,f){
 let s=txt(d.body),html=d.documentElement.outerHTML;
 let m=s.match(/Tempo até que a bandeira pode ser alterada\s*:?\s*(\d{1,3}:\d{2}:\d{2})/i);
 if(!m)m=html.match(/Tempo até que a bandeira pode ser alterada[\s\S]{0,700}?(\d{1,3}:\d{2}:\d{2})/i);
 if(m)return m[1].split(':').reduce((a,b)=>a*60+Number(b),0)>0?'Aguardar '+m[1]:'Pode remover';
 if(/Bandeira atual\s*(?:Nenhuma|Sem bandeira)/i.test(s))return 'Sem bandeira';
 const buttons=[...d.querySelectorAll('button,input,a')].filter(e=>/remover bandeira/i.test(txt(e)+' '+(e.value||'')));
 if(buttons.some(e=>e.disabled||e.classList.contains('disabled')))return 'Bloqueada';
 if(buttons.length)return 'Pode remover';
 return f.name==='Sem bandeira'?'Sem bandeira':'Estado indisponível';
}
document.querySelector('#flagsV30')?.remove();let panel=document.createElement('div');panel.id='flagsV30';panel.style='position:fixed;inset:2%;z-index:999999;background:#f4e4bf;color:#222;padding:12px;overflow:auto;font:14px Arial;border:2px solid #99743a';panel.innerHTML='<button id="fclose" style="float:right">Fechar</button><h2>Bandeiras das aldeias — V30</h2><p id="fstatus">A carregar...</p><select id="fgroups" style="padding:7px;min-width:260px"><option value="">Todas as aldeias</option></select><table border="1" cellpadding="4" style="width:100%;border-collapse:collapse;margin-top:10px"><thead><tr><th>Aldeia</th><th>Pontuação</th><th>Poço de Argila</th><th>População</th><th>Bandeira</th><th>Bónus</th><th>Estado</th></tr></thead><tbody id="fbody"></tbody></table>';document.body.append(panel);let body=panel.querySelector('#fbody'),status=panel.querySelector('#fstatus'),groups=panel.querySelector('#fgroups');panel.querySelector('#fclose').onclick=()=>panel.remove();
let sortCol=1,asc=true;function sort(){[...body.rows].sort((a,b)=>{let x=txt(a.cells[sortCol]),y=txt(b.cells[sortCol]);if([1,2,3,5].includes(sortCol)){let nx=num(x),ny=num(y);return (nx===null?1:ny===null?-1:(nx-ny)*(asc?1:-1))}return (asc?1:-1)*x.localeCompare(y,'pt',{numeric:true})}).forEach(r=>body.append(r))}panel.querySelectorAll('th').forEach((h,i)=>{h.style.cursor='pointer';h.onclick=()=>{asc=sortCol===i?!asc:true;sortCol=i;sort()}});
let selected=null;function filter(){for(let row of body.rows)row.style.display=!selected||selected.has(row.dataset.id)?'':'none'}
try{let base=url('overview_villages','combined'),overview=await doc(base);parse(overview,'combined');for(let mode of ['prod','buildings']){try{parse(await doc(url('overview_villages',mode)),mode)}catch(e){console.warn(mode,e)}}
let found=new Map();for(let d of [document,overview]){for(let s of d.querySelectorAll('select'))if(/group|grupo/i.test(s.outerHTML.slice(0,400)))for(let o of s.options)if(/^\d+$/.test(o.value))found.set(o.value,txt(o));for(let a of d.querySelectorAll('a[href*="group="]')){let id=new URL(a.href,location.href).searchParams.get('group');if(/^\d+$/.test(id))found.set(id,txt(a))}}for(let [id,name] of found){let o=document.createElement('option');o.value=id;o.textContent=name;groups.append(o)}
groups.onchange=async()=>{if(!groups.value){selected=null;filter();return}try{let u=url('overview_villages','combined');u.searchParams.set('group',groups.value);let d=await doc(u);selected=new Set([...d.querySelectorAll('tr')].map(find).filter(Boolean).map(v=>v.id));filter()}catch(e){status.textContent='Erro no grupo: '+e.message}};
let list=[...villages.values()];if(!list.length)throw Error('Não foram encontradas aldeias');for(let v of list){let row=body.insertRow();row.dataset.id=v.id;let a=document.createElement('a');a.href=url('flags','',v.id).href;a.target='_blank';a.rel='noopener';a.textContent=v.name;a.style='color:blue;font-weight:bold;text-decoration:underline';a.onclick=()=>a.style.color='green';row.insertCell().append(a);for(let val of [v.points===null?'—':v.points.toLocaleString('pt-PT'),v.clay??'—',v.pop??'—','A consultar','—','A consultar'])row.insertCell().textContent=val}sort();
async function missing(v){
 for(let screen of ['overview','main']){
  if(v.points!==null&&v.pop!==null)break;
  try{
   let d=await doc(url(screen,'',v.id));
   if(v.pop===null){
    let current=d.querySelector('#pop_current_label,#pop_current,.pop_current');
    let maximum=d.querySelector('#pop_max_label,#pop_max,.pop_max');
    let a=current?num(txt(current)):null,b=maximum?num(txt(maximum)):null;
    if(a!==null&&b!==null&&b>=a&&b>=1000)v.pop=a+' / '+b;
    if(v.pop===null){for(let tr of d.querySelectorAll('tr')){let label=txt(tr.cells?.[0]);if(!/popula|farm|fazenda/i.test(label))continue;let p=pop(tr);if(p){v.pop=p;break}}}
   }
   if(v.points===null){
    for(let tr of d.querySelectorAll('tr')){
     if(!/^(?:pontua[cç][aã]o|pontos|points)\s*:?$/i.test(txt(tr.cells?.[0])))continue;
     let n=num(txt(tr.cells?.[1]));if(n!==null&&n>=0){v.points=n;break}
    }
    if(v.points===null){let e=d.querySelector('[data-field="points"],#village_points,.village_points');let n=e?num(txt(e)):null;if(n!==null)v.points=n}
   }
  }catch(e){console.warn('Consulta complementar',v.id,screen,e)}
 }
}
let count=0;for(let v of list){let row=[...body.rows].find(r=>r.dataset.id===v.id);try{let d=await doc(url('flags','',v.id));let f=flag(d);row.cells[4].textContent=f.name;row.cells[5].textContent=f.bonus;row.cells[6].textContent=state(d,f)}catch(e){row.cells[6].textContent='Erro: '+e.message}
if(v.clay===null){try{let n=await clay(v.id);if(n!==null)row.cells[2].textContent=n}catch(e){console.warn(e)}}if(v.points===null||v.pop===null){await missing(v);row.cells[1].textContent=v.points===null?'—':v.points.toLocaleString('pt-PT');row.cells[3].textContent=v.pop??'—'}count++;status.textContent='Consultadas '+count+' de '+list.length+' aldeias';if(count<list.length)await wait(250)}status.textContent='Concluído: '+count+' de '+list.length+' aldeias';sort()
}catch(e){status.textContent='Erro: '+e.message}finally{window.__flagsV30=false}
})();
