// Pencatat log chatbot -> localStorage (dibaca oleh dashboard pada origin yang sama).
// Dimuat SETELAH flows.js dan SEBELUM main.js. Tidak mengubah alur bot, hanya membungkus fungsi yang sudah ada.
(function(){
 const K_LOG='siumper-log',K_BOOK='siumper-bookings',K_REP='siumper-reports';
 const rd=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
 const wr=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
 let t0=performance.now(),logged=false;
 // titik awal pengukuran waktu respons: tiap klik / kirim dari pengguna
 ['click','submit'].forEach(ev=>document.addEventListener(ev,()=>{t0=performance.now();logged=false},true));
 function rec(type,ok,ket,ms){logged=true;const a=rd(K_LOG,[]);
  a.push({t:new Date().toISOString(),type,ok:!!ok,ms:ms||Math.round(performance.now()-t0)+350,ket}); // +350 = jeda animasi balasan bot
  wr(K_LOG,a.slice(-1000))}
 const wrap=(name,fn)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(){return fn(o,arguments)}};

 wrap('cekItemCore',(o,a)=>{const k=a[0],q=a[1],d=a[2];const free=freeR(k,d);
  rec('barang',true,STOCK[k].n+(free>=q?' tersedia ('+free+' unit)':' tidak tersedia'));return o.apply(null,a)});
 wrap('cekRoomCore',(o,a)=>{const r=a[0],d=a[1];const ok=!dys(d).some(i=>!roomWin(r,i));
  rec('ruangan',true,r.r+(ok?' tersedia':' tidak tersedia'));return o.apply(null,a)});
 wrap('doCekItem',(o,a)=>{logged=false;const r=o.apply(null,a);if(!logged)rec('barang',false,'Barang atau tanggal tidak terbaca');return r});
 wrap('doCekRoom',(o,a)=>{logged=false;const r=o.apply(null,a);if(!logged)rec('ruangan',false,'Ruangan atau tanggal tidak terbaca');return r});
 wrap('found',(o,a)=>{const c=String(a[0]).toUpperCase().replace(/\s/g,'');const ok=ITEMS.some(i=>i.code===c);
  rec('aset',ok,ok?'Lokasi '+c+' ditemukan':'Kode aset tidak ditemukan');return o.apply(null,a)});
 wrap('doWhere',(o,a)=>{const it=S.item;if(it){const home=it.roomNo?null:ROOMS.find(r=>it.home===rl(r)||it.home===r.r),r=findRoom(a[0]);
   const sesuai=it.roomNo?dbrMatch(it,a[0]):!!(r&&r===home);const rep=rd(K_REP,[]);
   rep.push({t:new Date().toISOString(),code:it.code,name:it.name,home:it.home,seen:it.roomNo?String(a[0]).trim():(r?rl(r):String(a[0]).trim()),sesuai});wr(K_REP,rep.slice(-300));
   rec('aset',true,'Pelaporan lokasi '+it.code+(sesuai?' sesuai':' tidak sesuai'))}
  return o.apply(null,a)});
 // reservasi: log saat diverifikasi, dan simpan booking yang disetujui supaya dashboard dan bot sama-sama melihatnya
 wrap('verify',(o,a)=>{const x=S.res,ok=x&&(S.kind==='room'?dys(x.date).every(i=>roomWin(x.room,i)):freeR(x.item,x.date)>=x.qty);
  rec('lainnya',!!ok,ok?'Reservasi '+(S.kind==='room'?'ruangan ':'barang ')+'dikirim':'Reservasi ditolak: tidak tersedia');return o.apply(null,a)});
 wrap('start',(o,a)=>{rec('lainnya',true,'Menu utama ditampilkan',350);return o.apply(null,a)});
 wrap('lacak',(o,a)=>{return o.apply(null,a)});
 // saat data dimuat, gabungkan booking yang tersimpan dari sesi sebelumnya
 wrap('loadData',(o,a)=>{return o.apply(null,a).then(()=>{const b=rd(K_BOOK,null);if(Array.isArray(b))BOOK=b;STOCK0=JSON.parse(JSON.stringify(STOCK));HOME0=JSON.parse(JSON.stringify(HOME));const db=rd('siumper-dbr',null);if(db&&db.rooms&&db.items){ROOMS=dbrToRooms(db);ITEMS=dbrToItems(db);setBuildings()}applyStock(db||null)})});

 // sinkron DBR: barang/ruangan yang ditambah di dashboard langsung dikenali chatbot (tanpa reload)
 let dbrSig='';
 let STOCK0=null,HOME0=null;
 function applyStock(db){if(!STOCK0){STOCK0=JSON.parse(JSON.stringify(STOCK));HOME0=JSON.parse(JSON.stringify(HOME))}if(!db){db=rd('siumper-dbr',null)}if(db&&db.rooms&&db.items){const m=mergeStock(STOCK0,HOME0,db);STOCK=m.stock;HOME=m.home}}
 function syncDbr(){const raw=localStorage.getItem('siumper-dbr');if(!raw||raw===dbrSig)return;try{const db=JSON.parse(raw);if(db&&db.rooms&&db.items){dbrSig=raw;ROOMS=dbrToRooms(db);ITEMS=dbrToItems(db);setBuildings();applyStock(db)}}catch(e){}}
 window.addEventListener('storage',e=>{if(e.key==='siumper-dbr')syncDbr()});
 window.addEventListener('focus',syncDbr);document.addEventListener('visibilitychange',syncDbr);
 setInterval(syncDbr,1500);
 // data dari device lain (Firestore): segarkan booking dan DBR
 window.addEventListener('siumper-cloud',()=>{const b=rd(K_BOOK,null);if(Array.isArray(b))BOOK=b;syncDbr()});
 ['lacak','found','openForm'].forEach(n=>wrap(n,(o,a)=>{syncDbr();return o.apply(null,a)}));
})();
