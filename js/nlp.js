// Lapisan NLP: pesan bebas mahasiswa -> data terstruktur lewat Gemini (melalui proxy, key tidak ada di browser).
// Gemini hanya MEMAHAMI pesan. Tersedia/tidak, bentrok, dan jam layanan tetap dihitung dari data oleh flows.js.
// Jika proxy tidak diatur, lambat, atau gagal, pesan diserahkan ke parser regex lama (fallback).
const NLP_STATES=['idle','cekRoom','cekItem','resText']; // state yang boleh memakai NLP
const nlpOn=()=>!!window.SIUMPER_NLP_URL;
const HARI=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const ISO_RE=/^\d{4}-\d{2}-\d{2}$/,HM_RE=/^([01]\d|2[0-3]):[0-5]\d$/;
const NLP_MAP={ruangan:'room',barang:'item',jumlah:'qty',tanggal_mulai:'d1',tanggal_selesai:'d2',jam_mulai:'ws',jam_selesai:'we',nama:'name',nim_nip:'id',organisasi:'org',keperluan:'need'};

// penanda di header chat: NLP tersambung atau memakai parser biasa (membantu saat demo)
const nlpBadge=ok=>{const s=document.querySelector('header small');if(s)s.textContent='bot • prototype • '+(ok?'NLP aktif':'NLP tidak tersambung (parser biasa)')};
async function nlpCall(text){
 const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),9000),d=S.draft;
 try{
  const r=await fetch(window.SIUMPER_NLP_URL,{method:'POST',headers:{'Content-Type':'application/json'},signal:ctl.signal,
   body:JSON.stringify({text,today:isoNow(),dayName:HARI[new Date().getDay()],rooms:ROOMS.map(rl),items:Object.values(STOCK).map(s=>s.n),
    context:d?{sedang_mengisi:d.intent,data_terkumpul:d.data}:undefined})});
  const j=await r.json();if(j&&j.ok&&j.data){nlpBadge(true);return j.data}
  console.warn('[nlp] proxy menjawab galat:',j&&j.error);nlpBadge(false);return null
 }catch(e){console.warn('[nlp] gagal, memakai parser biasa:',e&&e.message||e);nlpBadge(false);return null}
 finally{clearTimeout(to)}}

// label dari Gemini -> objek ruangan / kunci barang (divalidasi terhadap data sebenarnya)
const nlpRoom=l=>l?ROOMS.find(r=>rl(r)===l)||findRoom(String(l)):null;
const nlpItem=l=>l?Object.keys(STOCK).find(k=>STOCK[k].n===l)||findItem(String(l)):null;

async function nlpHandle(t,fallback){
 const wait=add('bot','⏳ Memahami pesan…'),res=await nlpCall(t);wait.remove();
 if(!res)return fallback(); // proxy mati / belum diatur -> parser biasa
 const m=res.maksud;
 if(m==='status'){S.draft=null;return statusCmd()}
 if(m==='batal'){if(S.draft||['resText','confirm','spj'].includes(S.st)){S.draft=null;return cancelRes()}return bot('Tidak ada pengajuan yang sedang diisi. Gunakan /reservasi untuk mengajukan peminjaman.')}
 if(m==='sapaan'){S.draft=null;return MENU()}
 if(m==='lainnya'&&!S.draft){window.siumperRec&&siumperRec('lainnya',false,'Pesan tidak dipahami');
  return bot('Maaf, saya belum paham maksud pesan itu. Contoh yang bisa saya bantu:\n• "Proyektor 2 buah tersedia tanggal 12 Desember 2026?"\n• "Mau pinjam Aula Sabtu depan jam 8 sampai 12, atas nama Budi NIM 2200123 dari HIMA"\n• "Status pinjaman saya"\n\nAtau gunakan /start untuk melihat menu.')}
 const d=S.draft||{intent:null,data:{}};
 if(/^(cek|reservasi)_/.test(m))d.intent=m;
 if(!d.intent)return fallback();
 if(res.tanggal_mulai&&res.tanggal_selesai==null)delete d.data.d2; // tanggal baru menggantikan rentang lama
 for(const k in NLP_MAP)if(res[k]!=null&&res[k]!=='')d.data[NLP_MAP[k]]=res[k];
 S.draft=d;nlpRun(d)}

function nlpRun(d){
 const D=d.data,room=/ruangan/.test(d.intent),reserve=/^reservasi/.test(d.intent),notes=[];
 const rm=room?nlpRoom(D.room):null,it=!room?nlpItem(D.item):null;
 if(D.room&&room&&!rm){notes.push('Ruangan "'+D.room+'" tidak ada di daftar.');delete D.room}
 if(D.item&&!room&&!it){notes.push('Barang "'+D.item+'" tidak ada di daftar.');delete D.item}
 let date=null;
 if(D.d1){
  if(!ISO_RE.test(D.d1)||isNaN(new Date(D.d1+'T00:00:00Z'))){notes.push('Tanggal belum terbaca.')}
  else if(D.d1<isoNow()){notes.push('Tidak bisa memakai tanggal '+fmt(D.d1)+' karena sudah lewat. Pilih hari ini atau tanggal setelahnya.')}
  else{const b=D.d2&&ISO_RE.test(D.d2)&&D.d2>D.d1?D.d2:'',dt=mkDate(D.d1,b);if(dt.days.length>14)notes.push('Peminjaman maksimal 14 hari.');else date=dt}
  if(!date){delete D.d1;delete D.d2}}
 if(!reserve){ // cek ketersediaan
  const miss=[];if(room&&!rm)miss.push('Ruangan (mis. Ruang 4 Gedung C, atau Aula)');if(!room&&!it)miss.push('Nama barang (tersedia: '+Object.values(STOCK).map(s=>s.n).join(', ')+')');if(!date)miss.push('Tanggal');
  if(miss.length)return bot((notes.length?'⚠️ '+notes.join(' ')+'\n\n':'')+'Untuk mengecek '+(room?'ruangan':'barang')+', mohon lengkapi:\n• '+miss.join('\n• ')+'\n\nCukup balas data yang kurang saja.');
  S.draft=null;return room?cekRoomCore(rm,date):cekItemCore(it,Math.max(1,+D.qty||1),date)}
 // reservasi
 let time=null;
 if(D.ws&&D.we){if(HM_RE.test(D.ws)&&HM_RE.test(D.we)&&D.we>D.ws)time=D.ws.replace(':','.')+'-'+D.we.replace(':','.');else{notes.push('Jam belum valid (jam selesai harus setelah jam mulai).');delete D.ws;delete D.we}}
 S.kind=room?'room':'item';S.pre=null;S.preR=null;setState('resText','Lengkapi data pengajuan, atau ketik batal');
 if(notes.length)bot('⚠️ '+notes.join(' '));
 const x={date,time,name:D.name,id:D.id,org:D.org,need:D.need,nlp:'tanpa_koreksi'};
 if(room)x.room=rm;else{x.item=it;x.qty=Math.max(1,+D.qty||1)}
 checkRes(x)}
