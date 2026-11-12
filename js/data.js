// Data dummy: ruangan, lantai, jam tersedia, stok barang, data DBR, dan pengaturan DEMO.
// ---------- DATA ----------
const GC='Gedung C (Dewi Sartika)',GS='Gedung Dr. Sutomo';
const mk=(b,r,f,h)=>({b,r,f,h:h||[8,16]}); // b=gedung, r=ruangan, f=lantai, h=jam tersedia
let ROOMS=[...Array.from({length:22},(_,i)=>mk(GC,'Ruang '+(i+1),i<6?1:i<12?2:i<17?3:4,i===3?[12,17]:0)), // C: lt1 1-6, lt2 7-12, lt3 13-17, lt4 18-22
 ...[1,2,3,4].map(n=>mk(GS,'Ruang '+n,2)),...[5,6,7,8].map(n=>mk(GS,'Ruang '+n,3)),mk(GS,'Lab Digital Learning',4),mk(GS,'Lab IOT',4,[9,17]),
 mk('Aula','Aula',1,[8,21]),mk('Isola','Auditorium',1,[9,15])];
let BUILDINGS=[GC,GS,'Aula','Isola'];
let BKEY={[GC]:['gedung c','dewi sartika'],[GS]:['sutomo'],'Aula':['aula'],'Isola':['isola']};
let BFORM={[GC]:[1,1],[GS]:[1,1],'Aula':[0,0],'Isola':[1,0]}; // [isian nama ruangan, isian lantai]
// DEMO (tidak dipakai lagi): ketersediaan kini dihitung dari data reservasi (BOOK) + blokir manual admin UMPER (siumper-block).
let DEMO={items:[],rooms:[]};
let STOCK={'mic wireless':{n:'Mic Wireless',total:3,cond:'Baik'},'mic kabel':{n:'Mic Kabel',total:4,cond:'Baik'},'proyektor':{n:'Proyektor',total:2,cond:'Baik'},'layar':{n:'Layar Screen',total:2,cond:'Baik'},'speaker':{n:'Speaker',total:4,cond:'Cukup'},'kabel hdmi':{n:'Kabel HDMI',total:6,cond:'Baik'},'kabel roll':{n:'Kabel Roll',total:5,cond:'Baik'},'laptop':{n:'Laptop',total:3,cond:'Baik'},'pointer':{n:'Pointer',total:4,cond:'Baik'},'meja lipat':{n:'Meja Lipat',total:10,cond:'Cukup'}};
let HOME={'mic wireless':'Gedung C (Dewi Sartika) - Ruang 5','proyektor':'Gedung C (Dewi Sartika) - Ruang 4','speaker':'Aula','kabel hdmi':'Gedung Dr. Sutomo - Ruang 3','mic kabel':'Gedung C (Dewi Sartika) - Ruang 5','layar':'Gedung C (Dewi Sartika) - Ruang 4','kabel roll':'Gedung Dr. Sutomo - Ruang 3','laptop':'Gedung Dr. Sutomo - Ruang 6','pointer':'Gedung C (Dewi Sartika) - Ruang 5','meja lipat':'Isola - Auditorium'};
let ITEMS=[ // data DBR
 {code:'DBR-2026-0101',name:'Mic Wireless',home:'Gedung C (Dewi Sartika) - Ruang 5'},
 {code:'DBR-2026-0102',name:'Mic Wireless',home:'Gedung C (Dewi Sartika) - Ruang 5'},
 {code:'DBR-2026-0210',name:'Proyektor Epson',home:'Gedung C (Dewi Sartika) - Ruang 4'},
 {code:'DBR-2026-0311',name:'Speaker Aktif',home:'Aula'},
 {code:'DBR-2026-0412',name:'Kabel HDMI 10m',home:'Gedung Dr. Sutomo - Ruang 3'},
 {code:'DBR-2026-0513',name:'Meja Lipat',home:'Isola - Auditorium'}];
let BOOK=[{kind:'room',key:'gedung dr. sutomo - ruang 3',date:'2026-09-12'},{kind:'item',key:'proyektor',qty:2,date:'2026-09-12'}];
const MON=['januari','februari','maret','april','mei','juni','juli','agustus','september','oktober','november','desember'];
const rl=r=>r.b===r.r?r.r:r.b+' - '+r.r;
const rOpt=r=>r.b==='Aula'||r.b==='Isola'?r.r:r.r+' (Lantai '+r.f+')';
const DAYN=['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const dow=i=>new Date(i+'T00:00:00Z').getUTCDay();
const dn=i=>DAYN[dow(i)]+', '+fmt(i);
const wt=x=>hh(x[0])+' - '+hh(x[1])+' WIB';
function roomWin(r,i){if(!roomFree(r,i))return null;const o=r.h[0],c=r.h[1];return c>o?[o,c]:null} // akhir pekan boleh dipesan; persetujuan tetap oleh Staf UMPER
function winFor(r,days){let o=0,c=24;for(const i of days){const w=roomWin(r,i);if(!w)return null;o=Math.max(o,w[0]);c=Math.min(c,w[1])}return c>o?[o,c]:null}
function dayReason(r,i){return !roomFree(r,i)?(isBlk('room',rl(r).toLowerCase(),i)?'dinonaktifkan sementara oleh admin UMPER':'sudah dipesan'):'di luar jam layanan'}
const flo=b=>[...new Set(ROOMS.filter(r=>r.b===b).map(r=>r.f))];
const rlabel=r=>r.b===r.r?r.r:r.r+' ('+r.b+')';

// ---------- SUMBER DATA ----------
// Sekarang: file data.json (API palsu). Nanti ganti ke endpoint dashboard, mis. 'https://xxx.trycloudflare.com/api/bot-data'
const DATA_URL='data.json';
async function loadData(){
 try{
  const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
  const d=await r.json();
  ROOMS=d.rooms;STOCK=d.stock;HOME=d.home;ITEMS=d.items;BOOK=d.bookings;DEMO=d.demo||{items:[],rooms:[]};RES0=d.reservations||[];setBuildings();
 }catch(e){console.warn('Gagal muat data, pakai data dummy bawaan:',e)}
}

// ---------- DBR (Daftar Barang Ruangan) ----------
// db = {rooms:[{id,noRuang,nama,gedung}], items:[{id,roomId,nama,kode,merk,tahun,jumlah,ket,sticker}]}
// ITEMS untuk /lacak diturunkan dari DBR; code = kode stiker unik per baris barang.
function dbrToItems(db){const rm={};db.rooms.forEach(r=>rm[r.id]=r);return db.items.filter(i=>rm[i.roomId]).map(i=>{const r=rm[i.roomId];return{code:i.sticker,name:i.nama,home:r.gedung+' - '+r.nama,roomNo:r.noRuang,roomName:r.nama,kode:i.kode,ket:i.ket||''}})}
function dbrMatch(it,t){const n=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');const q=n(t);return q.includes(n(it.roomNo))||q.includes(n(it.roomName))}

// ---------- Ruangan: satu sumber (DBR) ----------
// Ruangan chatbot = ruangan DBR. Gedung/kunci/form dihitung otomatis dari daftar ruangan.
function dbrToRooms(db){return db.rooms.map(r=>({b:r.gedung,r:r.nama,f:r.f||1,h:r.h||[8,16]}))}
function setBuildings(){const gm={};ROOMS.forEach(r=>(gm[r.b]=gm[r.b]||[]).push(r));BUILDINGS=Object.keys(gm);BKEY={};BFORM={};
 BUILDINGS.forEach(b=>{const rs=gm[b],base=b.replace(/\s*\(.*\)\s*/,'').toLowerCase(),inner=(b.match(/\((.*)\)/)||[])[1],last=base.split(/\s+/).pop(),strip=base.replace(/^gedung\s+/,'');
  BKEY[b]=[...new Set([base,inner&&inner.toLowerCase(),last.length>3?last:null,strip.length>3?strip:null].filter(Boolean))];
  const fl=new Set(rs.map(r=>r.f));BFORM[b]=[rs.length>1?1:0,rs.length>1&&fl.size>1?1:0]})}
// ---------- Reservasi (dibagi dengan dashboard lewat localStorage 'siumper-res') ----------
let RES0=[];
const _ls=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}};
const resRead=()=>_ls('siumper-res')||RES0;
const resWrite=l=>{try{localStorage.setItem('siumper-res',JSON.stringify(l))}catch(e){}};
// Blokir manual oleh admin UMPER (dibuat di dashboard): {kind:'room'|'item',key,from,to,note}. to kosong = tanpa batas akhir.
const blockRead=()=>_ls('siumper-block')||[];
const isBlk=(kind,key,iso)=>blockRead().some(b=>b.kind===kind&&b.key===key&&(!b.from||iso>=b.from)&&(!b.to||iso<=b.to));
const bookRead=()=>_ls('siumper-bookings')||JSON.parse(JSON.stringify(BOOK));
const bookWrite=b=>{try{localStorage.setItem('siumper-bookings',JSON.stringify(b))}catch(e){}};
function resRecord(x,kind,spj,sik){const d=new Date(),ymd=d.toISOString().slice(0,10).replace(/-/g,''),l=resRead();let n;do{n=String(100+Math.floor(Math.random()*900))}while(l.some(r=>r.id.endsWith('-'+n)));
 const rec={id:'TRX-'+(kind==='room'?'RG':'BR')+'-'+ymd+'-'+n,kind,created:d.toISOString(),name:x.name,nim:x.id,hp:x.phone||'',org:x.org,need:x.need||'',dates:x.date.days||[x.date.iso],time:x.time,status:'Diproses',spj,sik,source:'chatbot'};
 if(kind==='room'){rec.gedung=x.room.b;rec.ruang=x.room.r}else{rec.item=x.item;rec.itemNama=STOCK[x.item].n;rec.qty=x.qty}return rec}
function resApprove(id,status){const l=resRead(),r=l.find(z=>z.id===id);if(!r)return;r.status=status;if(status==='Diproses')delete r.verified;else r.verified=new Date().toISOString();resWrite(l);
 const b=bookRead().filter(z=>z.res!==id);
 if(status==='Disetujui')r.dates.forEach(d=>b.push(r.kind==='room'?{kind:'room',key:(r.gedung===r.ruang?r.ruang:r.gedung+' - '+r.ruang).toLowerCase(),date:d,res:id}:{kind:'item',key:r.item,qty:r.qty,date:d,res:id}));
 bookWrite(b)}

// ---------- Stok barang = stok dasar + barang DBR (satu sumber) ----------
// Barang DBR yang namanya belum ada di stok dasar otomatis jadi jenis barang baru (total = jumlah semua baris DBR bernama sama).
function mergeStock(base,home,db){const st=Object.assign({},base),hm=Object.assign({},home),g={},rm={};db.rooms.forEach(r=>rm[r.id]=r);
 const bn=new Set(Object.keys(base).concat(Object.values(base).map(s=>s.n.toLowerCase())));
 db.items.forEach(i=>{const r=rm[i.roomId];if(!r)return;const k=String(i.nama).trim().toLowerCase();if(!k||bn.has(k))return;
  const e=g[k]||(g[k]={n:String(i.nama).trim(),total:0,c:{},home:r.gedung===r.nama?r.nama:r.gedung+' - '+r.nama});e.total+=(+i.jumlah||1);const t=i.ket||'Belum diisi';e.c[t]=(e.c[t]||0)+(+i.jumlah||1)});
 Object.entries(g).forEach(([k,e])=>{const ks=Object.keys(e.c);st[k]={n:e.n,total:e.total,cond:ks.length===1?ks[0]:ks.map(t=>t+' ('+e.c[t]+')').join(', ')};hm[k]=e.home});
 return{stock:st,home:hm}}
