(async()=>{if(window.__flagsV24)return alert('Consulta em curso');window.__flagsV24=1;const $=s=>document.querySelector(s),wait=t=>new Promise(r=>setTimeout(r,t)),clean=s=>(s||'').replace(/\s+/g,' ').trim(),esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])),fetchDoc=async u=>{let r=await fetch(u,{credentials:'same-origin'});if(!r.ok)throw Error('HTTP '+r.status);return new DOMParser().parseFromString(await r.text(),'text/html')};let p=document.createElement('div');p.style='position:fixed;inset:2%;z-index:999999;background:#f4e4bf;padding:15px;overflow:auto;color:#222;font:13px Arial;border:2px solid #99743a';p.innerHTML='<button id="f5close" style="float:right">Fechar</button><h2>Bandeiras das aldeias — V24</h2><p id="f5status">A procurar aldeias...</p><select id="f5group" style="padding:7px;min-width:260px"><option value="">Todas as aldeias</option></select><table style="width:100%;border-collapse:collapse;margin-top:10px" border="1" cellpadding="4"><thead><tr><th>Aldeia</th><th>Pontuação</th><th>Poço de Argila</th><th>População</th><th>Bandeira</th><th>Bónus</th><th>Estado</th></tr></thead><tbody id="f5body"></tbody></table>';document.body.append(p);p.querySelector('#f5close').onclick=()=>p.remove();let status=p.querySelector('#f5status'),tb=p.querySelector('#f5body');let sortCol=-1,sortAsc=true;const sortRows=()=>{if(sortCol<0)return;const value=r=>{let t=(r.cells[sortCol]?.textContent||'').trim();if([1,2,3,5].includes(sortCol)){if(sortCol===3)t=t.split('/')[0];let m=t.replace(/\./g,'').replace(',','.').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):-1}return t};[...tb.rows].sort((a,b)=>{let x=value(a),y=value(b),c=typeof x==='number'?x-y:String(x).localeCompare(String(y),'pt',{numeric:true,sensitivity:'base'});return sortAsc?c:-c}).forEach(r=>tb.appendChild(r))};p.querySelectorAll('thead th').forEach((th,i)=>{th.style.cursor='pointer';th.title='Clique para ordenar';th.addEventListener('click',()=>{sortAsc=sortCol===i?!sortAsc:true;sortCol=i;sortRows();p.querySelectorAll('thead th').forEach((h,j)=>{h.textContent=h.textContent.replace(/ [▲▼]$/,'')+(j===i?(sortAsc?' ▲':' ▼'):'')})})});let activeGroup=null;const filterGroup=()=>[...tb.rows].forEach(r=>r.style.display=activeGroup===null||activeGroup.has(r.dataset.village)?'':'none');p.querySelector('#f5group').onchange=async e=>{let val=e.target.value;if(!val){activeGroup=null;filterGroup();return}status.textContent='A carregar grupo...';try{let gu=new URL('/game.php',location.origin);gu.searchParams.set('screen','overview_villages');gu.searchParams.set('mode','combined');gu.searchParams.set('group',val);gu.searchParams.set('page','-1');let gd=await fetchDoc(gu);let ids=new Set([...gd.querySelectorAll('tr a[href*="village="]')].filter(a=>/\(\d{3}\|\d{3}\)/.test(a.textContent)).map(a=>new URL(a.href,location.href).searchParams.get('village')));if(!ids.size)throw Error('Grupo vazio ou não disponível');activeGroup=ids;filterGroup();status.textContent='Grupo selecionado: '+ids.size+' aldeias. A consulta continua.'}catch(err){activeGroup=null;filterGroup();status.textContent='Não foi possível carregar o grupo: '+err.message}};try{let here=new URL(location.href),ov=new URL('/game.php',location.origin);ov.searchParams.set('village',here.searchParams.get('village')||'');ov.searchParams.set('screen','overview_villages');ov.searchParams.set('mode','combined');ov.searchParams.set('page','-1');let d=await fetchDoc(ov),map=new Map();const groupSelect=p.querySelector('#f5group');let groupOptions=new Map();for(let doc of [document,d]){for(let opt of doc.querySelectorAll('select option')){let value=opt.value||'',label=clean(opt.textContent);if(/^\d+$/.test(value)&&label&&!/^(todos|all|grupo|selecionar|select)/i.test(label)&&/group|grupo/i.test(opt.closest('select')?.outerHTML.slice(0,350)||''))groupOptions.set(value,label)}for(let a of doc.querySelectorAll('a[href*="group="]')){let id=new URL(a.href,location.href).searchParams.get('group'),label=clean(a.textContent);if(id&&/^\d+$/.test(id)&&label)groupOptions.set(id,label)}}for(let [id,label] of groupOptions){let opt=document.createElement('option');opt.value=id;opt.textContent=label;groupSelect.appendChild(opt)}if(!groupOptions.size){let opt=document.createElement('option');opt.textContent='Grupos não encontrados';opt.disabled=true;groupSelect.appendChild(opt)}for(let tr of d.querySelectorAll('tr')){let a=[...tr.querySelectorAll('a[href*="village="]')].find(a=>/\(\d{3}\|\d{3}\)/.test(a.textContent));if(!a)continue;let id=new URL(a.href,location.href).searchParams.get('village');if(id&&!map.has(id))map.set(id,{id,name:clean(a.textContent),coord:(a.textContent.match(/\(\d{3}\|\d{3}\)/)||[])[0]})}if(!map.size)throw Error('Não encontrei aldeias na vista Combinado.');const readPop=(doc)=>{for(let tr of doc.querySelectorAll('tr')){let a=[...tr.querySelectorAll('a[href*="village="]')].find(a=>/\(\d{3}\|\d{3}\)/.test(a.textContent));if(!a)continue;let id=new URL(a.href,location.href).searchParams.get('village'),v=map.get(id);if(!v)continue;let cells=[...tr.cells],ai=cells.findIndex(c=>c.contains(a));let matches=[];for(let c of cells.slice(ai+1)){let t=clean(c.textContent),m=t.match(/^(\d{1,3}(?:[. ]\d{3})*|\d+)\s*\/\s*(\d{1,3}(?:[. ]\d{3})*|\d+)$/);if(m){let used=Number(m[1].replace(/[. ]/g,'')),max=Number(m[2].replace(/[. ]/g,''));if(max>=used&&max>=100)matches.push({used,max})}}if(matches.length===1)v.pop=matches[0].used+'/'+matches[0].max;else if(matches.length>1){let probable=matches.find(x=>x.max>=1000&&x.max<=50000);if(probable)v.pop=probable.used+'/'+probable.max}}};readPop(d);let prod=new URL(ov.href);prod.searchParams.set('mode','prod');try{let pd=await fetchDoc(prod);for(let tr of pd.querySelectorAll('tr')){let a=[...tr.querySelectorAll('a[href*="village="]')].find(a=>/\(\d{3}\|\d{3}\)/.test(a.textContent));if(!a)continue;let id=new URL(a.href,location.href).searchParams.get('village');let v=map.get(id);if(!v)continue;let cells=[...tr.cells];let idx=cells.findIndex(c=>c.contains(a));let pts=cells.slice(idx+1).map(c=>clean(c.textContent)).find(t=>/^\d{1,3}(?:[. ]\d{3})*$/.test(t));if(pts)v.points=pts;readPop(pd)}}catch(e){console.warn('Pontos indisponíveis:',e)}let buildings=new URL(ov.href);buildings.searchParams.set('mode','buildings');try{let bd=await fetchDoc(buildings);let rows=[...bd.querySelectorAll('tr')];let hdr=rows.find(tr=>[...tr.querySelectorAll('th,td')].some(c=>/stone|argila|clay/i.test([c.innerHTML,c.title,...[...c.querySelectorAll('img')].map(i=>i.src+' '+i.title+' '+i.alt)].join(' ')))&&tr.querySelectorAll('th,td').length>8);let ci=-1;if(hdr){ci=[...hdr.children].findIndex(c=>/stone|argila|clay/i.test([c.innerHTML,c.title,...[...c.querySelectorAll('img')].map(i=>i.src+' '+i.title+' '+i.alt)].join(' ')))}for(let tr of rows){let a=[...tr.querySelectorAll('a[href*="village="]')].find(a=>/\(\d{3}\|\d{3}\)/.test(a.textContent));if(!a)continue;let id=new URL(a.href,location.href).searchParams.get('village'),v=map.get(id);if(!v)continue;let cells=[...tr.cells],ai=cells.findIndex(c=>c.contains(a));let candidates=[];if(ci>=0)candidates.push(ci);let buildingCells=cells.slice(ai+1);if(buildingCells.length>=14)candidates.push(ai+1+11);for(let i of [...new Set(candidates)]){let c=cells[i];if(!c)continue;let val=clean(c.textContent),m=val.match(/^(\d{1,2})$/);if(m){v.clay=m[1];break}}}}catch(e){console.warn('Edifícios indisponíveis:',e)}let list=[...map.values()],done=0;status.textContent='Encontradas '+list.length+' aldeias.';for(let v of list){let row=tb.insertRow();row.dataset.village=v.id;filterGroup();for(let x of [v.name,v.points||'Indisponível','A consultar',(v.pop||'Por identificar').replace(/\s*\/\s*/g,' / '),'A consultar','—','A consultar'])row.insertCell().textContent=x;let link=document.createElement('a');let dest=new URL('/game.php',location.origin);dest.searchParams.set('village',v.id);dest.searchParams.set('screen','flags');link.href=dest.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=v.name;link.style='color:#0645ad;text-decoration:underline;font-weight:bold';link.addEventListener('click',()=>{link.style.color='green'});row.cells[0].replaceChildren(link);row.cells[2].textContent=v.clay||'Por identificar';try{let url=new URL('/game.php',location.origin);url.searchParams.set('village',v.id);url.searchParams.set('screen','flags');let fd=await fetchDoc(url);let els=[...fd.querySelectorAll('td,th,div,span,strong,b,h3,h4')];let heading=els.filter(e=>clean(e.textContent)==='Bandeira atual').sort((a,b)=>a.querySelectorAll('*').length-b.querySelectorAll('*').length)[0];if(!heading)throw Error('Secção Bandeira atual não encontrada');let section=heading.closest('table')||heading.parentElement;let candidates=[section,section?.parentElement,heading.parentElement?.nextElementSibling].filter(Boolean);let picked='';for(let c of candidates){let t=clean(c.textContent);if(t.length<500&&t.includes('Bandeira atual')&&(/\d+[,.]?\d*\s*%/.test(t)||/Remover bandeira/.test(t))){picked=t;break}}if(!picked){let node=heading;for(let i=0;i<9&&node;i++,node=node.nextElementSibling){let t=clean(node.textContent);if(i>0&&/^(Bandeiras disponíveis|Combinar bandeiras|Inventário)/i.test(t))break;if(t.length<400)picked+=' '+t;if(/Remover bandeira/.test(picked))break}}picked=clean(picked).replace(/^.*?Bandeira atual\s*/,'').split(/Remover bandeira/i)[0].trim();let kind=picked.match(/Produção de recursos|Velocidade de recrutamento|Força de ataque|Força (?:de )?Defesa|Sorte|Capacidade da população|Menores custos de moeda|Capacidade de carga/i);let bonus=picked.match(/\d+(?:[,.]\d+)?\s*%[^\n]{0,100}/);if(bonus)bonus[0]=bonus[0].replace(/\s*(?:Remover bandeira).*$/i,'').trim();let hasRemove=clean(section?.parentElement?.textContent).includes('Remover bandeira');row.cells[4].textContent=kind?kind[0]:hasRemove?'Por identificar':'Sem bandeira / por confirmar';row.cells[5].textContent=bonus?bonus[0]:'—';row.cells[6].textContent=kind?'Identificada':hasRemove?'Rever':'Por confirmar';if(!kind&&hasRemove)row.cells[4].title=picked.slice(0,250)}catch(e){row.cells[4].textContent='Não determinado';row.cells[6].textContent='Erro: '+e.message}done++;status.textContent='Consultadas '+done+' de '+list.length+' aldeias';if(done<list.length)await wait(250+50+Math.floor(Math.random()*101))}status.textContent='Concluído: '+done+' de '+list.length+'. Entradas por confirmar não são classificadas como sem bandeira.'}catch(e){status.textContent='Erro: '+e.message}finally{window.__flagsV24=0}})();
;(()=>{
const tabela=document.querySelector('#f5body');
if(!tabela)return;

const cabecalho=tabela.closest('table').querySelector('thead tr');
cabecalho.lastElementChild.textContent='Remoção da bandeira';

const esperar=ms=>new Promise(r=>setTimeout(r,ms));
const texto=e=>(e?.textContent||'').replace(/\s+/g,' ').trim();

async function consultar(linha){
 const id=linha.dataset.village;
 if(!id)return;

 const celula=linha.cells[linha.cells.length-1];
 celula.textContent='A consultar...';

 try{
  const url=new URL('/game.php',location.origin);
  url.searchParams.set('village',id);
  url.searchParams.set('screen','flags');

  const resposta=await fetch(url,{credentials:'same-origin'});
  if(!resposta.ok)throw Error('HTTP '+resposta.status);

  const html=await resposta.text();
  const doc=new DOMParser().parseFromString(html,'text/html');

  const botoes=[...doc.querySelectorAll('a,button,input')];

  const remover=botoes.find(e=>
   /remover bandeira|retirar bandeira/i.test(
    texto(e)+' '+(e.value||'')+' '+(e.title||'')
   )
  );

  const conteudo=texto(doc.body);

  const tempo=conteudo.match(
   /(?:remover|retirar|alterar)[\s\S]{0,150}?(\d+\s*(?:dias?|horas?|h|minutos?|min|segundos?|s)(?:\s*\d+\s*(?:horas?|h|minutos?|min|segundos?|s))*)/i
  );

  if(tempo){
   celula.textContent='Aguardar: '+tempo[1];
  }else if(remover&&!remover.disabled&&
   !remover.classList.contains('disabled')&&
   remover.getAttribute('aria-disabled')!=='true'){
   celula.textContent='Pode remover';
  }else if(!/bandeira atual/i.test(conteudo)){
   celula.textContent='Sem bandeira';
  }else{
   celula.textContent='Verificar bloqueio';
  }

 }catch(e){
  celula.textContent='Erro na consulta';
 }
}

const processadas=new WeakSet();

const observador=new MutationObserver(()=>{
 for(const linha of tabela.rows){
  if(!linha.dataset.village||processadas.has(linha))continue;
  processadas.add(linha);
  consultar(linha);
 }
});

observador.observe(tabela,{childList:true,subtree:true});

for(const linha of tabela.rows){
 if(linha.dataset.village&&!processadas.has(linha)){
  processadas.add(linha);
  consultar(linha);
 }
}
})();
