// Helper umum (render chat, parsing tanggal, cek ketersediaan) dan form isian (openForm).
// ---------- HELPERS ----------
const log=document.getElementById('log'),inp=document.getElementById('in');
let S={st:'idle'};
const esc=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function scroll(){log.scrollTop=log.scrollHeight}
function add(cls,html){const d=document.createElement('div');d.className='m '+cls;d.innerHTML=html;log.appendChild(d);scroll();return d}
function me(t){add('me',esc(t))}
function bot(html,btns,delay=350){return new Promise(res=>{setTimeout(()=>{add('bot',html);
 if(btns){const k=document.createElement('div');k.className='kb';btns.forEach(([l,fn])=>{const b=document.createElement('button');b.textContent=l;b.onclick=()=>{k.querySelectorAll('button').forEach(x=>x.disabled=true);me(l.replace(/^[^\w/]+\s*/,''));fn()};k.appendChild(b)});log.appendChild(k);scroll()}
 res()},delay)})}
const B=t=>'<b>'+t+'</b>';
function parseDate(t){const m=t.toLowerCase().match(new RegExp('(\\d{1,2})\\s+('+MON.join('|')+')\\s+(\\d{4})'));if(!m)return null;
 const mm=MON.indexOf(m[2])+1;return{iso:m[3]+'-'+String(mm).padStart(2,'0')+'-'+m[1].padStart(2,'0'),txt:(+m[1])+' '+m[2][0].toUpperCase()+m[2].slice(1)+' '+m[3]}}
function findItem(t){t=t.toLowerCase();return Object.keys(STOCK).find(k=>t.includes(k))}
function findRoom(t){t=t.toLowerCase();const c=ROOMS.filter(r=>new RegExp('(^|[^a-z0-9])'+r.r.toLowerCase().replace(/\s+/g,'\\s*')+'(?![a-z0-9])').test(t));
 if(!c.length)return ROOMS.find(r=>(r.b==='Isola'||r.b==='Aula')&&BKEY[r.b].some(k=>t.includes(k)));
 return c.length<2?c[0]:c.find(r=>BKEY[r.b].some(k=>t.includes(k)))||c[0]}
function itemFree(k,iso){if(DEMO.items.includes(k))return 0;if(k==='proyektor'&&new Date(iso+'T00:00:00Z').getUTCDay()===6)return 0;const used=BOOK.filter(b=>b.kind==='item'&&b.key===k&&b.date===iso).reduce((a,b)=>a+b.qty,0);return STOCK[k].total-used}
function roomFree(r,iso){return !DEMO.rooms.includes(r.r)&&!BOOK.some(b=>b.kind==='room'&&b.key===rl(r).toLowerCase()&&b.date===iso)}
function setState(st,hint){S={...S,st};document.getElementById('hint').textContent=hint||''}
const hh=n=>String(n).padStart(2,'0')+'.00';
const winTxt=r=>hh(r.h[0])+' - '+hh(r.h[1])+' WIB';
const tmin=t=>{const a=t.split(':');return +a[0]*60+ +a[1]};
const todayIso=new Date().toISOString().slice(0,10);
const fmt=i=>{const[y,m,d]=i.split('-');return (+d)+' '+MON[m-1][0].toUpperCase()+MON[m-1].slice(1)+' '+y};
const dys=x=>x.days||[x.iso];
const freeR=(k,d)=>Math.min(...dys(d).map(i=>itemFree(k,i)));
function mkDate(a,b){if(!b||b===a)return{iso:a,txt:fmt(a),days:[a]};const days=[];for(let t=new Date(a+'T00:00:00Z');t<=new Date(b+'T00:00:00Z');t.setUTCDate(t.getUTCDate()+1))days.push(t.toISOString().slice(0,10));return{iso:a,txt:fmt(a)+' s/d '+fmt(b)+' ('+days.length+' hari)',days}}
function openForm(mode,v){v=v||{};const room=mode==='res'&&S.kind==='room',pre=mode==='res'?(room?S.preR:(S.pre&&S.pre.item?S.pre:null)):null;const bsel=v.room?v.room.b:BUILDINGS[0],hf0=BFORM[bsel][1],fsel=v.room?v.room.f:flo(bsel)[0];const roomSel='<label>Gedung<select name="bld">'+BUILDINGS.map(b=>'<option'+(b===bsel?' selected':'')+'>'+b+'</option>').join('')+'</select></label><label class="lt"'+(hf0?'':' style="display:none"')+'>Lantai<select name="fl">'+flo(bsel).map(n=>'<option value="'+n+'"'+(n===fsel?' selected':'')+'>Lantai '+n+'</option>').join('')+'</select></label><label>Ruangan<select name="rm">'+ROOMS.filter(r=>r.b===bsel&&(!hf0||r.f===fsel)).map(r=>'<option'+(v.room&&v.room.r===r.r?' selected':'')+'>'+r.r+'</option>').join('')+'</select></label>';
 const ea=s=>esc(String(s==null?'':s)).replace(/"/g,'&quot;');
 const rmDef=room?(pre?pre.room:(v.room||ROOMS.find(r=>r.b===bsel))):null;const rw=rmDef?((pre?winFor(rmDef,dys(pre.date)):null)||rmDef.h):null;const tm=(v.time||(rw?hh(rw[0])+'-'+hh(rw[1]):'08.00-12.00')).split('-').map(x=>x.replace('.',':'));
 const ds=v.date?dys(v.date):[],multi=!pre&&ds.length>1,d1=ds[0]||'',d2=ds.slice(-1)[0]||'';
 const opts=Object.entries(STOCK).map(([k,s])=>'<option value="'+k+'"'+(v.item===k?' selected':'')+'>'+s.n+' (maks '+s.total+')</option>').join('');
 const head=mode==='cek'?'📦 <b>Cek ketersediaan barang</b><br>Pilih barang, jumlah, dan tanggal penggunaan. Kami akan memberi informasi ketersediaannya.':'📋 <b>Reservasi SIUMPER</b><br>'+(pre?'Data dari pengecekan sudah terisi. Lengkapi sisa detail di bawah.':'Isi detail peminjaman pada form di bawah.');
 const fld=(l,n,t,val,ex)=>'<label>'+l+'<input name="'+n+'" type="'+t+'" value="'+ea(val)+'" required'+(ex||'')+'></label>';
 let h='<form class="fm" autocomplete="off"><div class="sh-body"><div class="sh-info">'+head+'</div>';
 if(pre)h+='<div class="lock">'+(room?'Gedung: <b>'+pre.room.b+'</b><br>Ruangan: <b>'+pre.room.r+'</b>':'Barang: <b>'+STOCK[pre.item].n+'</b><br>Jumlah: <b>'+pre.qty+'</b>')+'<br>Tanggal: <b>'+pre.date.txt+'</b></div>';
 else h+=(room?roomSel:'<label>Barang<select name="brg">'+opts+'</select></label>'+fld('Jumlah','qty','number',v.qty||1,' min="1"'))+'<div class="seg"><button type="button" data-m="1">Sehari</button><button type="button" data-m="2">Lebih dari sehari</button></div><div class="row"><label><span class="l1">Tanggal</span><input name="d1" type="date" min="'+todayIso+'" value="'+d1+'" required></label><label class="d2"><span>Tanggal selesai</span><input name="d2" type="date" min="'+todayIso+'" value="'+(multi?d2:'')+'"></label></div>';
 if(mode==='res')h+='<div class="row">'+fld('Jam mulai','ws','time',tm[0])+fld('Jam selesai','we','time',tm[1])+'</div>'+(room?'<div class="winfo"></div><div class="warn" hidden></div>':(pre?'':'<div class="warn iw" hidden></div>'))+fld('Nama','nm','text',v.name)+'<div class="row">'+fld('NIM/NIP','nim','text',v.id)+fld('No HP','hp','tel',v.phone)+'</div>'+fld('Organisasi','org','text',v.org)+fld('Keperluan','need','text',v.need);
 h+='</div><div class="sh-foot"><button class="go">'+(mode==='cek'?'Cek ketersediaan':'Lanjut')+'</button></div></form>';
 setTimeout(()=>{const app=document.getElementById('app');let sh,f,bub=null;if(mode==='cek'){sh=add('bot form',h);f=sh.querySelector('form')}else{sh=document.createElement('div');sh.className='sheet';sh.innerHTML='<div class="sh-head"><b>'+(mode==='cek'?'Cek ketersediaan barang':'Reservasi '+(room?'ruangan':'barang'))+'</b><button type="button" class="x" aria-label="Tutup">✕</button></div>'+h;app.appendChild(sh);f=sh.querySelector('form');sh.querySelector('.x').onclick=()=>sh.remove();bub=add('bot',head+'<br><br><button type="button" class="reopen">📝 Buka form</button>');bub.querySelector('.reopen').onclick=()=>{if(!sh.isConnected)app.appendChild(sh)}}let m=multi?'2':'1';
  const upd=()=>{f.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x.dataset.m===m));const e=f.querySelector('.d2');if(e){e.style.display=m==='2'?'':'none';f.elements.d2.required=m==='2';f.querySelector('.l1').textContent=m==='2'?'Tanggal mulai':'Tanggal'}};
  f.querySelectorAll('.seg button').forEach(x=>x.onclick=()=>{m=x.dataset.m;upd()});upd();
  if(!pre){if(room){const fillR=()=>{const b=f.elements.bld.value,hf=BFORM[b][1],fv=+f.elements.fl.value;f.elements.rm.innerHTML=ROOMS.filter(r=>r.b===b&&(!hf||r.f===fv)).map(r=>'<option>'+r.r+'</option>').join('')};
   const fillF=()=>{const b=f.elements.bld.value;f.querySelector('.lt').style.display=BFORM[b][1]?'':'none';f.elements.fl.innerHTML=flo(b).map(n=>'<option value="'+n+'">Lantai '+n+'</option>').join('');fillR()};
   f.elements.bld.onchange=fillF;f.elements.fl.onchange=fillR}else{const si=f.elements.brg,q=f.elements.qty,mx=()=>{q.max=STOCK[si.value].total};si.onchange=mx;mx()}f.elements.d1.onchange=()=>{f.elements.d2.min=f.elements.d1.value||todayIso}}
  f.addEventListener('input',e=>e.target.setCustomValidity&&e.target.setCustomValidity(''));f.addEventListener('focusin',e=>{const t=e.target;setTimeout(()=>t.scrollIntoView&&t.scrollIntoView({block:'center',behavior:'smooth'}),300)});
  if(room){const wi=f.querySelector('.winfo'),wa=f.querySelector('.warn');
   const cur=()=>pre?pre.room:ROOMS.find(r=>r.b===f.elements.bld.value&&r.r===f.elements.rm.value);
   const chk=()=>{const r=cur();if(!r)return true;let msg='';
    const ws=f.elements.ws.value,we=f.elements.we.value;let days=pre?dys(pre.date):null;
    if(!pre){const a=f.elements.d1.value,b=m==='2'?f.elements.d2.value:'';if(a&&(!b||b>=a))days=mkDate(a,b).days}
    const bad=days?days.filter(i=>!roomWin(r,i)):[],multi=days&&days.length>1;
    const w=days?(bad.length?null:winFor(r,days)):r.h,o=w?w[0]:r.h[0],c=w?w[1]:r.h[1];
    wi.textContent='ℹ️ '+(bad.length||!w?r.r+' tidak tersedia pada tanggal yang dipilih':r.r+' tersedia pukul '+hh(o)+' - '+hh(c)+' WIB'+(multi?' (berlaku di seluruh tanggal yang dipilih)':''));
    if(bad.length)msg='Ruangan tidak tersedia pada '+bad.map(i=>fmt(i)+' ('+dayReason(r,i)+')').join(', ')+(ws&&we?', pukul '+ws.replace(':','.')+' - '+we.replace(':','.')+' WIB':'')+'.';
    else if(!w)msg='Tidak ada jam yang sama di seluruh tanggal yang dipilih.';
    else if(ws&&we&&(tmin(ws)<o*60||tmin(we)>c*60))msg='Waktu yang dipilih tidak tersedia. '+r.r+' hanya tersedia pukul '+hh(o)+' - '+hh(c)+' WIB'+(multi?' di seluruh tanggal yang dipilih':'')+'.';
    wa.hidden=!msg;wa.textContent=msg?'⚠️ '+msg:'';
    ['ws','we'].forEach(n=>f.elements[n].classList.toggle('bad',!!msg&&!bad.length));return !msg};
   f.chk=chk;f.querySelectorAll('.seg button').forEach(x=>x.addEventListener('click',chk));f.addEventListener('input',chk);f.addEventListener('change',chk);
   if(!pre){const setDef=()=>{const r=cur();if(r){f.elements.ws.value=hh(r.h[0]).replace('.',':');f.elements.we.value=hh(r.h[1]).replace('.',':')}chk()};f.elements.bld.addEventListener('change',setDef);f.elements.rm.addEventListener('change',setDef);f.elements.fl.addEventListener('change',setDef)}
   chk()}
  if(mode==='res'&&!room&&!pre){const iw=f.querySelector('.iw');
   const chkI=()=>{const k=f.elements.brg.value,q=+f.elements.qty.value||1,a=f.elements.d1.value,b=m==='2'?f.elements.d2.value:'';let msg='';
    if(a&&(!b||b>=a)){const d=mkDate(a,b),fr=freeR(k,d);if(fr<q)msg=STOCK[k].n+' tidak tersedia pada '+d.txt+' (sisa '+fr+' unit, diminta '+q+').'}
    iw.hidden=!msg;iw.textContent=msg?'⚠️ '+msg:'';return !msg};
   f.chkI=chkI;f.querySelectorAll('.seg button').forEach(x=>x.addEventListener('click',chkI));f.addEventListener('input',chkI);f.addEventListener('change',chkI)}
  f.onsubmit=e=>{e.preventDefault();if(f.chkI&&!f.chkI()){f.querySelector('.iw').scrollIntoView({block:'center',behavior:'smooth'});return}if(room&&f.chk&&!f.chk()){f.querySelector('.warn').scrollIntoView({block:'center',behavior:'smooth'});return}const g=n=>f.elements[n].value.trim();let item,qty,date,rmo;
   if(pre){item=pre.item;qty=pre.qty;date=pre.date;rmo=pre.room}else{if(room)rmo=ROOMS.find(r=>r.b===g('bld')&&r.r===g('rm'));else{item=g('brg');qty=+g('qty')}const a=g('d1'),b=m==='2'?g('d2'):'';
    if(b&&b<a){f.elements.d2.setCustomValidity('Tanggal selesai tidak boleh sebelum tanggal mulai');f.reportValidity();return}
    date=mkDate(a,b);if(date.days.length>14){f.elements.d2.setCustomValidity('Maksimal peminjaman 14 hari');f.reportValidity();return}}
   let time;if(mode==='res'){const ws=g('ws'),we=g('we');if(dys(date).length===1&&we<=ws){f.elements.we.setCustomValidity('Jam selesai harus setelah jam mulai');f.reportValidity();return}time=ws.replace(':','.')+'-'+we.replace(':','.')}
   const vals=mode==='res'?{nm:g('nm'),nim:g('nim'),hp:g('hp'),org:g('org'),need:g('need')}:{};
   if(bub){sh.remove();bub.querySelector('.reopen').disabled=true}[...f.elements].forEach(x=>x.disabled=true);
   if(mode==='cek'){me(STOCK[item].n+', '+qty+', '+date.txt);return cekItemCore(item,qty,date)}
   me('Pinjam '+(room?rl(rmo):STOCK[item].n+', '+qty)+', '+date.txt+', jam '+time+'. '+vals.nm+', '+vals.nim);
   confirmRes({item,qty,room:rmo,date,time,name:vals.nm,id:vals.nim,phone:vals.hp,org:vals.org,need:vals.need})}},350)}
