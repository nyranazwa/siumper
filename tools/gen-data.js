// Membuat data.json (data dummy). Jalankan dari folder proyek: node tools/gen-data.js
const fs=require('fs');
const src=fs.readFileSync(__dirname+'/../js/data.js','utf8');
const D=new Function(src+';return {ROOMS,STOCK,HOME,BOOK,DEMO,rl,dbrToItems,dbrToRooms}')();
let a=123456;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const pick=x=>x[Math.floor(rnd()*x.length)];const p2=n=>String(n).padStart(2,'0'),p3=n=>String(n).padStart(3,'0');
const today=new Date();
const iso=d=>{const t=new Date(today);t.setUTCDate(t.getUTCDate()+d);return t.toISOString().slice(0,10)};
// ---- RUANGAN (satu sumber): ruangan chatbot + gedung tambahan
const KH='KH MOH HASYIM ASHARI';
const base=D.ROOMS.map(r=>({b:r.b,r:r.r,f:r.f,h:r.h}));
const extra=[[KH,'Ruang Asistensi',1,[8,16],'22.4J.01.004'],[KH,'Ruang Proyek Desain',1,[8,16],'22.4J.01.003'],[KH,'Lab. Workshop Kayu',1,[8,16],'22.4J.01.002'],[KH,'Lab. Gambar (DPI)',1,[8,16],'22.4J.01.001'],
 ['Masjid','Masjid',1,[8,20]],['PKM dan Lapang Basket','PKM dan Lapang Basket',1,[8,18]],['Ruang Sidang','Ruang Sidang 1',1,[8,16]],['Ruang Sidang','Ruang Sidang 2',1,[8,16]]].map(x=>({b:x[0],r:x[1],f:x[2],h:x[3],code:x[4]}));
const L={'Gedung C (Dewi Sartika)':'C','Gedung Dr. Sutomo':'I','Aula':'A','Isola':'S',[KH]:'J','Masjid':'M','PKM dan Lapang Basket':'P','Ruang Sidang':'R'};
const seq={};
const dbr={rooms:[],items:[]};
[...base,...extra].forEach((r,i)=>{const k=r.b+'|'+r.f;seq[k]=(seq[k]||0)+1;
 dbr.rooms.push({id:300+i,noRuang:r.code||('22.4'+L[r.b]+'.'+p2(r.f)+'.'+p3(seq[k])),nama:r.r,gedung:r.b,f:r.f,h:r.h})});
// ---- BARANG DBR
const CAT={kursi:['Kursi Besi/Metal','3050201003','Chitose'],kipas:['Kipas Angin Tempel','3050204006','Minyako'],mejaK:['Meja Kerja Kayu','3050201002','Kayu'],dorong:['Kursi Dorong','3070101127','Dankha'],papan:['Papan Tulis','3050201010','Sakura'],ac:['AC Split','3050204001','Panasonic'],proy:['Proyektor','3050205001','Epson'],pc:['Komputer PC','3050102001','Asus'],lemari:['Lemari Arsip','3050201005','Brother'],mejaKl:['Meja Kuliah','3050201004','Kayu'],sampah:['Tempat Sampah','3050301001','Olymplast'],speaker:['Speaker Aktif','3050205010','Polytron'],layar:['Layar Proyektor','3050205003','Screenpro'],karpet:['Karpet','3050201020',''],mejaS:['Meja Sidang','3050201030','Kayu']};
const pool=r=>/Aula|Auditorium/.test(r.nama)?['kursi','speaker','proy','ac','layar']:/Masjid/.test(r.nama)?['karpet','speaker','kipas','lemari']:/PKM/.test(r.nama)?['speaker','kursi','mejaK','sampah']:/Sidang/.test(r.nama)?['mejaS','kursi','proy','ac','papan']:/Lab/.test(r.nama)?['pc','kursi','mejaK','ac','proy','lemari','kipas']:/Asistensi|Workshop|Gambar/.test(r.nama)?['kursi','mejaK','kipas','lemari','papan','dorong']:['mejaKl','kursi','proy','papan','ac','kipas'];
let sn=1001,iid=1;
dbr.rooms.forEach(room=>{let list;
 if(room.nama==='Ruang Proyek Desain')list=[['kursi',45,2020,'Baik'],['kipas',2,2015,'Baik'],['mejaK',1,2015,'Baik'],['dorong',1,2010,'Baik']];
 else{const pl=pool(room),k=Math.min(pl.length,3+Math.floor(rnd()*3));list=[...pl].sort(()=>rnd()-.5).slice(0,k).map(c=>[c,c==='kursi'||c==='mejaKl'?10+Math.floor(rnd()*35):1+Math.floor(rnd()*4),2008+Math.floor(rnd()*16),pick(['Baik','Baik','Baik','Rusak Ringan','Rusak Berat'])])}
 list.forEach(([c,j,th,ket])=>{const x=CAT[c];let merk=x[2],t=th,kt=ket;if(room.nama!=='Ruang Proyek Desain'&&rnd()<.18){const w=Math.floor(rnd()*3);if(w===0)merk='';else if(w===1)t='';else kt=''}
  dbr.items.push({id:iid++,roomId:room.id,nama:x[0],kode:x[1],merk,tahun:t,jumlah:j,ket:kt,sticker:'DBR-2026-'+String(sn++).padStart(4,'0')})})});
const lab=r=>r.b===r.r?r.r:r.gedung+' - '+r.nama;const lab2=r=>r.gedung+' - '+r.nama;const rmap={};dbr.rooms.forEach(r=>rmap[r.id]=r);
dbr.items.forEach(x=>x.seen=lab2(rmap[x.roomId]));
for(let i=0;i<9;i++){const x=dbr.items[3+i*7];x.seen=lab2(pick(dbr.rooms.filter(r=>r.id!==x.roomId)))}
const stickers=dbr.items.map(x=>x.sticker);
// ---- RESERVASI (data masuk) + booking turunan
const NM=['Dava Shahidil Ulla','Vivi Nur Hakisa','Syahla Shabrah Nuzjanah','Chalisa Adya Zahra','Dini Siti Mulyani','Shaddam Jaris Fauzi','Dafa Adawiyah','Rizky Maulana','Nadia Putri Lestari','Fikri Ramadhan','Anisa Rahmawati','Bagas Prasetyo','Salsabila Nur Aini','Muhammad Iqbal','Tiara Dewanti','Farhan Alamsyah','Intan Permatasari','Galih Nugraha'];
const OR=['Putra Putri UPI Tasikmalaya','HIMA PGSD','BEM REMA','UKM Racana','HMJ Pendidikan Teknik','DPM REMA','UKM Seni Tari','HIMA Informatika','KSR PMI Unit UPI','Tutorial PAI'];
const ND=['Kaderisasi Day 2 Regenerasi','Tutorial','Akademi Legislatif','Beauty Class Eksternal 2026','Festival Pramuka','Leadership Camp 2026','Rapat Evaluasi','Pelatihan Public Speaking','Workshop Desain Grafis','Seminar Nasional Pendidikan','Latihan Rutin','Rapat Koordinasi'];
const bookings=[...D.BOOK],resv=[];let rn=0;
const mkRes=(kind,off,status,item)=>{const dt=iso(off),created=new Date(Date.UTC(+iso(off-3).slice(0,4),+iso(off-3).slice(5,7)-1,+iso(off-3).slice(8,10),2+Math.floor(rnd()*9),Math.floor(rnd()*60))).toISOString(),ymd=created.slice(0,10).replace(/-/g,'');
 const nm=pick(NM),r={id:'TRX-'+(kind==='room'?'RG':'BR')+'-'+ymd+'-'+p3(100+Math.floor(rnd()*890)),kind,created,name:nm,nim:String(2200000+Math.floor(rnd()*99999)),hp:'08'+String(1200000000+Math.floor(rnd()*99999999)),org:pick(OR),need:pick(ND),dates:[dt],status,source:rn++%4===0?'chatbot':'dashboard'};
 const s=pick([8,9,10,13]);r.time=p2(s)+'.00-'+p2(s+pick([2,3,4]))+'.00';
 if(kind==='room'){const rm=pick(dbr.rooms.filter(x=>x.nama!=='Aula'||rnd()<.5));r.gedung=rm.gedung;r.ruang=rm.nama}else{const k=item;r.item=k;r.itemNama=D.STOCK[k].n;r.qty=1+Math.floor(rnd()*2)}
 if(r.source==='chatbot'){r.spj='SPJ_'+r.org.split(' ')[0]+'.pdf';r.sik='SIK_'+r.org.split(' ')[0]+'.pdf'}
 resv.push(r);
 if(status==='Disetujui'){const key=kind==='room'?(r.gedung===r.ruang?r.ruang:r.gedung+' - '+r.ruang).toLowerCase():r.item;
  if(kind==='room'&&bookings.some(b=>b.kind==='room'&&b.key===key&&b.date===dt)){resv.pop();return}
  bookings.push(kind==='room'?{kind:'room',key,date:dt,res:r.id}:{kind:'item',key,qty:r.qty,date:dt,res:r.id})}};
[[-6,'Disetujui'],[-5,'Disetujui'],[-4,'Disetujui'],[-3,'Ditolak'],[-2,'Disetujui'],[-1,'Disetujui'],[0,'Diproses'],[1,'Diproses'],[1,'Disetujui'],[2,'Diproses'],[3,'Disetujui'],[4,'Diproses'],[5,'Diproses'],[6,'Disetujui'],[7,'Diproses'],[9,'Ditolak'],[10,'Diproses'],[12,'Disetujui']].forEach(([o,s])=>mkRes('room',o,s));
[[-4,'Disetujui','proyektor'],[-1,'Disetujui','laptop'],[0,'Diproses','speaker'],[2,'Diproses','mic kabel'],[3,'Disetujui','pointer'],[5,'Diproses','kabel roll'],[8,'Ditolak','layar']].forEach(([o,s,k])=>mkRes('item',o,s,k));
resv.sort((x,y)=>y.created.localeCompare(x.created));
// ---- seed log 28 hari
const T={barang:.45,ruangan:.30,aset:.15},failRate={barang:.03,ruangan:.03,aset:.09,lainnya:.05};
const rs=dbr.rooms.map(r=>r.nama),stN=Object.values(D.STOCK).map(s=>s.n);
const ket=(t,ok)=>{
 if(t==='barang')return ok?pick(['Informasi stok '+pick(stN).toLowerCase(),'Informasi '+pick(stN).toLowerCase()+' tersedia','Stok '+pick(stN).toLowerCase()+' ditemukan']):'Barang atau tanggal tidak terbaca';
 if(t==='ruangan')return ok?pick(rs)+(rnd()<.8?' tersedia':' tidak tersedia'):'Ruangan atau tanggal tidak terbaca';
 if(t==='aset')return ok?'Lokasi '+pick(stickers)+' ditemukan':'Kode aset tidak ditemukan';
 return ok?pick(['Reservasi disetujui','Menu utama ditampilkan','Reservasi dikirim']):'Perintah tidak dikenali'};
const seed=[];
for(let d=27;d>=0;d--){const dw=new Date(today.getTime()-d*864e5).getUTCDay();
 const bs=(dw===0?25:dw===6?45:66)+Math.round((27-d)*.35)+Math.round(rnd()*10);
 const avgMs=3100-(27-d)*22+Math.round((rnd()-.5)*250);
 for(let i=0;i<bs;i++){const r=rnd();const t=r<T.barang?'barang':r<T.barang+T.ruangan?'ruangan':r<.95?'aset':'lainnya';
  const ok=rnd()>=failRate[t];seed.push({d,m:480+Math.floor(rnd()*600),type:t,ok,ms:Math.max(600,Math.round(avgMs+(rnd()-.5)*1400)),ket:ket(t,ok)})}}
const out={rooms:D.dbrToRooms(dbr),stock:D.STOCK,home:D.HOME,items:D.dbrToItems(dbr),dbr,bookings,reservations:resv,demo:D.DEMO,
 dashboard:{deltas:{aset:5,barang:8,ruangan:2,dbr:-1},kelengkapan:[52,58,64,69,74,78],
  notifications:[{ic:'i',text:'Sinkronisasi data inventaris selesai.',time:'07:20'},{ic:'ok',text:'Sistem berjalan normal.',time:'06:15'}],
  targetMs:3000,seedLogs:seed}};
fs.writeFileSync(__dirname+'/../data.json',JSON.stringify(out));
const gs=[...new Set(dbr.rooms.map(r=>r.gedung))];
console.log('gedung',gs.length,'rooms',dbr.rooms.length,'items',dbr.items.length,'res',resv.length,'bookings',bookings.length);
