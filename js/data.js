// Data dummy: ruangan, lantai, jam tersedia, stok barang, data DBR, dan pengaturan DEMO.
// ---------- DATA ----------
const GC='Gedung C (Dewi Sartika)',GS='Gedung Dr. Sutomo';
const mk=(b,r,f,h)=>({b,r,f,h:h||[8,16]}); // b=gedung, r=ruangan, f=lantai, h=jam tersedia
let ROOMS=[...Array.from({length:22},(_,i)=>mk(GC,'Ruang '+(i+1),i<6?1:i<12?2:i<17?3:4,i===3?[12,17]:0)), // C: lt1 1-6, lt2 7-12, lt3 13-17, lt4 18-22
 ...[1,2,3,4].map(n=>mk(GS,'Ruang '+n,2)),...[5,6,7,8].map(n=>mk(GS,'Ruang '+n,3)),mk(GS,'Lab Digital Learning',4),mk(GS,'Lab IOT',4,[9,17]),
 mk('Aula','Aula',1,[8,21]),mk('Isola','Auditorium',1,[9,15])];
const BUILDINGS=[GC,GS,'Aula','Isola'];
const BKEY={[GC]:['gedung c','dewi sartika'],[GS]:['sutomo'],'Aula':['aula'],'Isola':['isola']};
const BFORM={[GC]:[1,1],[GS]:[1,1],'Aula':[0,0],'Isola':[1,0]}; // [isian nama ruangan, isian lantai]
// DEMO sementara (belum ada database): barang & ruangan di bawah ini selalu 'tidak tersedia' pada tanggal/waktu apa pun.
// Kosongkan array-nya (atau ganti dengan data database) untuk mengembalikan perilaku normal.
let DEMO={items:['mic wireless'],rooms:['Aula']};
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
function roomWin(r,i){if(!roomFree(r,i)||dow(i)===0)return null;let o=r.h[0],c=r.h[1];if(dow(i)===6)c=Math.min(c,14);return c>o?[o,c]:null}
function winFor(r,days){let o=0,c=24;for(const i of days){const w=roomWin(r,i);if(!w)return null;o=Math.max(o,w[0]);c=Math.min(c,w[1])}return c>o?[o,c]:null}
function dayReason(r,i){return !roomFree(r,i)?(DEMO.rooms.includes(r.r)?'sudah terpakai kegiatan lain':'sudah dipesan'):dow(i)===0?'libur kampus, hari Minggu':'di luar jam layanan'}
const flo=b=>[...new Set(ROOMS.filter(r=>r.b===b).map(r=>r.f))];
const rlabel=r=>r.b===r.r?r.r:r.r+' ('+r.b+')';

// ---------- SUMBER DATA ----------
// Sekarang: file data.json (API palsu). Nanti ganti ke endpoint dashboard, mis. 'https://xxx.trycloudflare.com/api/bot-data'
const DATA_URL='data.json';
async function loadData(){
 try{
  const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error('HTTP '+r.status);
  const d=await r.json();
  ROOMS=d.rooms;STOCK=d.stock;HOME=d.home;ITEMS=d.items;BOOK=d.bookings;DEMO=d.demo||{items:[],rooms:[]};
 }catch(e){console.warn('Gagal muat data, pakai data dummy bawaan:',e)}
}
