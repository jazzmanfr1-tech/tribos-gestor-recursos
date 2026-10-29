(async()=>{
if(window.__flagsV28)return alert('Consulta em curso');
window.__flagsV28=true;

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const txt=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();
const num=s=>Number(String(s||'').replace(/\./g,'').replace(',','.'))||0;

const doc=async u=>{
 const r=await fetch(u,{credentials:'same-origin'});
 if(!r.ok)throw Error('HTTP '+r.status);
 return new DOMParser().parseFromString(await r.text(),'text/html');
};

const url=(screen,mode='',village='')=>{
 const u=new URL('/game.php',location.origin);
 u.searchParams.set('screen',screen);
 if(mode)u.searchParams.set('mode',mode);
 if(village)u.searchParams.set('village',village);
 return u;
};

document.querySelector('#flagsV28')?.remove();

const panel=document.createElement('div');
panel.id='flagsV28';
panel.style='position:fixed;inset:2%;z-index:999999;background:#f4e4bf;color:#222;padding:12px;overflow:auto;font:13px Arial;border:2px solid #99743a';

panel.innerHTML=`
<button id="closeFlags" style="float:right">Fechar</button>
<h2>Bandeiras das aldeias — V28</h2>
<p id="statusFlags">A carregar aldeias...</p>
<select id="groupFlags" style="padding:7px;min-width:260px">
<option value="">Todas as aldeias</option>
</select>
<table border="1" cellpadding="4"
style="width:100%;border-collapse:collapse;margin-top:10px">
<thead><tr>
<th>Aldeia</th>
<th>Pontuação</th>
<th>Poço de Argila</th>
<th>População</th>
<th>Bandeira</th>
<th>Bónus</th>
<th>Estado</th>
</tr></thead>
<tbody id="bodyFlags"></tbody>
</table>`;

document.body.appendChild(panel);

const body=panel.querySelector('#bodyFlags');
const status=panel.querySelector('#statusFlags');
const groups=panel.querySelector('#groupFlags');

panel.querySelector('#closeFlags').onclick=()=>{
 panel.remove();
 window.__flagsV28=false;
};

let sortColumn=-1,ascending=true;

panel.querySelectorAll('th').forEach((th,i)=>{
 th.style.cursor='pointer';
 th.title='Clique para ordenar';
 th.onclick=()=>{
  ascending=sortColumn===i?!ascending:true;
  sortColumn=i;

  const rows=[...body.rows];

  rows.sort((a,b)=>{
   let x=txt(a.cells[i]),y=txt(b.cells[i]);

   if([1,2,3,5].includes(i)){
    if(i===3){
     x=x.split('/')[0];
     y=y.split('/')[0];
    }

    x=num((x.match(/[\d.,]+/)||['0'])[0]);
    y=num((y.match(/[\d.,]+/)||['0'])[0]);

    return ascending?x-y:y-x;
   }

   return ascending
    ?x.localeCompare(y,'pt',{numeric:true})
    :y.localeCompare(x,'pt',{numeric:true});
  });

  rows.forEach(r=>body.appendChild(r));
 };
});

const villages=new Map();

function findVillage(tr){
 const a=[...tr.querySelectorAll('a[href*="village="]')]
 .find(a=>/\(\d{3}\|\d{3}\)/.test(a.textContent));

 if(!a)return null;

 const id=new URL(a.href,location.href)
 .searchParams.get('village');

 return id?{id,name:txt(a)}:null;
}

function findPopulation(tr){
 const matches=[...tr.cells]
 .map(c=>txt(c).match(/^([\d.]+)\s*\/\s*([\d.]+)$/))
 .filter(Boolean);

 const m=matches.find(m=>{
  const a=num(m[1]);
  const b=num(m[2]);
  return b>=1000&&b>=a;
 });

 return m?num(m[1])+' / '+num(m[2]):'—';
}

function clayColumn(d){
 for(const tr of d.querySelectorAll('tr')){
  const cells=[...tr.cells];
  if(cells.length<4)continue;

  const index=cells.findIndex(c=>{
   const html=c.outerHTML.toLowerCase();
   const text=txt(c).toLowerCase();

   return /data-building=["']stone["']/.test(html)||
    /building_stone/.test(html)||
    /buildings\/stone/.test(html)||
    /poço de argila|poco de argila/.test(text)||
    /clay pit/.test(text)||
    /stone\.png/.test(html);
  });

  if(index>=0)return index;
 }
 return -1;
}

function clayLevel(cell){
 if(!cell)return null;

 const t=txt(cell);
 const m=t.match(/^(?:nível\s*)?(\d{1,2})$/i);

 if(m){
  const n=Number(m[1]);
  if(n>=0&&n<=30)return String(n);
 }

 const title=cell.getAttribute('title')||
  cell.querySelector('[title]')?.getAttribute('title')||'';

 const mt=title.match(/(?:nível|level)\s*(\d{1,2})/i);
 return mt?mt[1]:null;
}

function readRows(d,mode){
 const ci=mode==='buildings'?clayColumn(d):-1;

 for(const tr of d.querySelectorAll('tr')){
  const v=findVillage(tr);
  if(!v)continue;

  if(!villages.has(v.id)){
   villages.set(v.id,{
    ...v,
    points:'—',
    clay:'—',
    pop:'—'
   });
  }

  const item=villages.get(v.id);
  const cells=[...tr.cells];

  const index=cells.findIndex(c=>
   c.querySelector('a[href*="village="]')
  );

  if(index<0)continue;

  const after=cells.slice(index+1);
  const pop=findPopulation(tr);

  if(pop!=='—')item.pop=pop;

  if(mode==='prod'||mode==='combined'){
   const points=after.map(c=>txt(c))
   .find(t=>/^\d{1,3}(?:\.\d{3})+$/.test(t));

   if(points)item.points=points;
  }

  if(mode==='buildings'&&ci>=0){
   const level=clayLevel(cells[ci]);
   if(level!==null)item.clay=level;
  }
 }
}

async function readClayVillage(id){
 const d=await doc(url('main','',id));

 const selectors=[
  '#main_buildrow_stone',
  '#buildrow_stone',
  'tr[data-building="stone"]',
  'tr[id*="stone"]'
 ];

 for(const selector of selectors){
  const row=d.querySelector(selector);
  if(!row)continue;

  const levelCell=row.querySelector(
   '.build_level, .level, td:nth-child(2)'
  );

  const text=txt(levelCell||row);

  let m=text.match(/(?:nível|level)\s*(\d{1,2})/i);
  if(!m)m=text.match(/^\s*(\d{1,2})\s*$/);

  if(m)return m[1];
 }

 return null;
}

function addGroups(d){
 const found=new Map();

 for(const source of [document,d]){
  for(const select of source.querySelectorAll('select')){
   if(!/group|grupo/i.test(select.outerHTML.slice(0,350)))
    continue;

   for(const opt of select.options){
    if(/^\d+$/.test(opt.value))
     found.set(opt.value,txt(opt));
   }
  }

  for(const a of source.querySelectorAll('a[href*="group="]')){
   const id=new URL(a.href,location.href)
    .searchParams.get('group');

   if(id&&/^\d+$/.test(id))
    found.set(id,txt(a));
  }
 }

 for(const [id,name] of found){
  const opt=document.createElement('option');
  opt.value=id;
  opt.textContent=name;
  groups.appendChild(opt);
 }
}

let selected=null;

function filter(){
 for(const row of body.rows){
  row.style.display=
   !selected||selected.has(row.dataset.village)?'':'none';
 }
}

groups.onchange=async()=>{
 if(!groups.value){
  selected=null;
  filter();
  return;
 }

 try{
  const u=url('overview_villages','combined');
  u.searchParams.set('group',groups.value);
  u.searchParams.set('page','-1');

  const d=await doc(u);
  selected=new Set();

  for(const tr of d.querySelectorAll('tr')){
   const v=findVillage(tr);
   if(v)selected.add(v.id);
  }

  filter();
  status.textContent=
   'Grupo selecionado: '+selected.size+' aldeias';

 }catch(e){
  status.textContent='Erro ao consultar grupo: '+e.message;
 }
};

function getTimer(d){
 const label=[...d.querySelectorAll('body *')]
 .find(e=>
  e.children.length===0&&
  /Tempo até que a bandeira pode ser alterada/i.test(txt(e))
 );

 if(!label)return null;

 const candidates=[
  label.parentElement,
  label.parentElement?.parentElement,
  label.nextElementSibling
 ].filter(Boolean);

 for(const e of candidates){
  const s=txt(e);
  const match=s.match(
   /Tempo até que a bandeira pode ser alterada\s*:?\s*(\d{1,3}:\d{2}:\d{2})/i
  );
  if(match)return match[1];
 }

 const match=d.documentElement.outerHTML.match(
  /Tempo até que a bandeira pode ser alterada[\s\S]{0,500}?(\d{1,3}:\d{2}:\d{2})/i
 );

 return match?match[1]:null;
}

function flagData(d){
 const text=txt(d.body);

 const heading=[...d.querySelectorAll('*')]
 .find(e=>
  e.children.length===0&&
  txt(e)==='Bandeira atual'
 );

 if(!heading)
  return {name:'Sem bandeira',bonus:'—'};

 let section=heading.closest('table')||heading.parentElement;
 let content=txt(section);

 if(content.length>500)
  content=txt(heading.parentElement);

 const kinds=[
  'Produção de recursos',
  'Velocidade de recrutamento',
  'Força de ataque',
  'Força de Defesa',
  'Capacidade da população',
  'Capacidade de carga',
  'Sorte',
  'Menores custos de moeda'
 ];

 let name=kinds.find(k=>
  content.toLowerCase().includes(k.toLowerCase())
 );

 if(!name){
  const nearby=text.match(/Bandeira atual\s+(.{0,180})/i);

  if(nearby){
   name=kinds.find(k=>
    nearby[1].toLowerCase().includes(k.toLowerCase())
   );
   content=nearby[1];
  }
 }

 const bonus=content.match(
  /\d+(?:[,.]\d+)?\s*%[^%]{0,65}/
 );

 return {
  name:name||'Sem bandeira',
  bonus:bonus
   ?bonus[0].split(/Remover bandeira/i)[0].trim()
   :'—'
 };
}

function removalStatus(d,flag){
 const timer=getTimer(d);

 if(timer){
  const seconds=timer.split(':')
   .reduce((a,b)=>a*60+Number(b),0);

  return seconds>0
   ?'Aguardar '+timer
   :'Pode remover';
 }

 const text=txt(d.body);

 if(!/Bandeira atual/i.test(text))
  return 'Sem bandeira';

 if(/Bandeira atual\s*(?:Nenhuma|Sem bandeira)/i.test(text))
  return 'Sem bandeira';

 const disabled=[...d.querySelectorAll('button,input,a')]
 .filter(e=>
  /remover bandeira/i.test(txt(e)+' '+(e.value||''))
 )
 .some(e=>
  e.disabled||e.classList.contains('disabled')
 );

 if(disabled)return 'Bloqueada';

 return 'Pode remover';
}

try{
 const base=url('overview_villages','combined');
 base.searchParams.set('page','-1');

 const overview=await doc(base);

 readRows(overview,'combined');
 addGroups(overview);

 for(const mode of ['prod','buildings']){
  try{
   const u=url('overview_villages',mode);
   u.searchParams.set('page','-1');
   readRows(await doc(u),mode);
  }catch(e){
   console.warn(mode,e);
  }
 }

 const list=[...villages.values()];

 status.textContent=
  'Encontradas '+list.length+' aldeias';

 for(const v of list){
  const row=body.insertRow();
  row.dataset.village=v.id;

  const link=document.createElement('a');
  link.href=url('flags','',v.id).href;
  link.target='_blank';
  link.rel='noopener noreferrer';
  link.textContent=v.name;

  link.style=
   'color:blue;text-decoration:underline;font-weight:bold';

  link.onclick=()=>link.style.color='green';

  row.insertCell().appendChild(link);
  row.insertCell().textContent=v.points;
  row.insertCell().textContent=v.clay;
  row.insertCell().textContent=v.pop;
  row.insertCell().textContent='A consultar';
  row.insertCell().textContent='—';
  row.insertCell().textContent='A consultar';

  filter();
 }

 let count=0;

 for(const v of list){
  const row=[...body.rows]
   .find(r=>r.dataset.village===v.id);

  if(!row)continue;

  try{
   const d=await doc(url('flags','',v.id));
   const flag=flagData(d);

   row.cells[4].textContent=flag.name;
   row.cells[5].textContent=flag.bonus;
   row.cells[6].textContent=removalStatus(d,flag);

  }catch(e){
   row.cells[6].textContent='Erro de consulta';
  }

  if(v.clay==='—'){
   try{
    const level=await readClayVillage(v.id);

    if(level!==null){
     v.clay=level;
     row.cells[2].textContent=level;
    }
   }catch(e){
    console.warn('Argila '+v.id,e);
   }
  }

  count++;

  status.textContent=
   'Consultadas '+count+' de '+list.length+' aldeias';

  if(count<list.length)
   await wait(250);
 }

 status.textContent=
  'Concluído: '+count+' de '+list.length+' aldeias';

}catch(e){
 status.textContent='Erro: '+e.message;

}finally{
 window.__flagsV28=false;
}
})();
