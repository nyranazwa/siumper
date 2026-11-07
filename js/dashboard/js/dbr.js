// Modul DBR (Daftar Barang Ruangan): Gedung -> (Rincian Gedung) Kelola Rincian Barang DBR.
// Disimpan di localStorage 'siumper-dbr' (awal dari data.json -> dbr). Chatbot /lacak membaca data yang sama.
const K_DBR='siumper-dbr';
const DBR=()=>rd(K_DBR,null)||D.dbr;
const cloneDB=()=>JSON.parse(JSON.stringify(DBR()));
const saveDBR=db=>{try{localStorage.setItem(K_DBR,JSON.stringify(db))}catch(e){alert('Gagal menyimpan ke browser.')}render()};
// ruangan chatbot = ruangan DBR (satu sumber)
function RM(){return DBR().rooms.map(r=>({b:r.gedung,r:r.nama,f:r.f||1,h:r.h||[8,16]}))}
const KETS=['Baik','Rusak Ringan','Rusak Berat'],ketCls=k=>/berat/i.test(k)?'bad':/ringan/i.test(k)?'warn':/baik/i.test(k)?'ok':'gr';
const ketBadge=k=>k?'<span class="bd '+ketCls(k)+'">'+esc(k)+'</span>':'<span class="bd gr">Belum diisi</span>';

// ---------- Stok barang = stok dasar + barang DBR (satu sumber) ----------
// Barang DBR yang namanya belum ada di stok dasar otomatis jadi jenis barang baru (total = jumlah semua baris DBR bernama sama).
function mergeStock(base,home,db){const st=Object.assign({},base),hm=Object.assign({},home),g={},rm={};db.rooms.forEach(r=>rm[r.id]=r);
 const bn=new Set(Object.keys(base).concat(Object.values(base).map(s=>s.n.toLowerCase())));
 db.items.forEach(i=>{const r=rm[i.roomId];if(!r)return;const k=String(i.nama).trim().toLowerCase();if(!k||bn.has(k))return;
  const e=g[k]||(g[k]={n:String(i.nama).trim(),total:0,c:{},home:r.gedung===r.nama?r.nama:r.gedung+' - '+r.nama});e.total+=(+i.jumlah||1);const t=i.ket||'Belum diisi';e.c[t]=(e.c[t]||0)+(+i.jumlah||1)});
 Object.entries(g).forEach(([k,e])=>{const ks=Object.keys(e.c);st[k]={n:e.n,total:e.total,cond:ks.length===1?ks[0]:ks.map(t=>t+' ('+e.c[t]+')').join(', ')};hm[k]=e.home});
 return{stock:st,home:hm}}
function applyStock(){if(!D)return;if(!D._s0||D.stock!==D._m){D._s0=D.stock;D._h0=D.home}const m=mergeStock(D._s0,D._h0,DBR());D.stock=m.stock;D._m=m.stock;D.home=m.home}
const _render0=render;render=function(){applyStock();return _render0.apply(this,arguments)};
const roomLabel=r=>r.gedung+' - '+r.nama;
const nextSticker=db=>'DBR-2026-'+String(Math.max(1000,...db.items.map(i=>+String(i.sticker).slice(-4)||0))+1).padStart(4,'0');
let DQ='',DEDIT=null;
const gLantai=(db,g)=>(db.gedung&&db.gedung[g]&&db.gedung[g].lantai)||Math.max(1,...db.rooms.filter(r=>r.gedung===g).map(r=>r.f||1));

// turunan aset (dipakai halaman Lokasi Aset di Tim IT dan Beranda)
function assets(){const db=DBR(),rep={},rm={};rd(K_REP,[]).forEach(r=>rep[r.code]=r);db.rooms.forEach(r=>rm[r.id]=r);
 return db.items.filter(i=>rm[i.roomId]).map(i=>{const r=rm[i.roomId],home=roomLabel(r),rp=rep[i.sticker],seen=rp?rp.seen:(i.seen||home);
  const st=rp?(rp.sesuai?'sesuai':'tidak'):(seen===home?'sesuai':'tidak');
  return{code:i.sticker,kode:i.kode,name:i.nama,home,seen,st,item:i,room:r,lengkap:!!(i.merk&&i.tahun&&i.ket)}})}
function integ(){return[['Inventaris barang',Object.keys(D.stock).length,'jenis barang'],['Jadwal ruangan',RM().length,'ruangan'],['Lokasi aset (DBR)',DBR().items.length,'barang pada '+DBR().rooms.length+' ruangan']]}

// ---------- Tim IT: Lokasi Aset ----------
function asetPage(){const all=assets(),A=all.filter(a=>!AF||a.st===AF),lab={sesuai:['ok','Sesuai'],tidak:['bad','Tidak sesuai']},ns=all.filter(a=>a.st==='sesuai').length,nt=all.length-ns;
 return '<h2 class="ph">Lokasi Aset (DBR)</h2><p class="sub">Lokasi resmi menurut DBR dibandingkan laporan terakhir dari chatbot /lacak. Data barang dikelola Staf UMPER di menu DBR.</p>'+
 '<div class="kpis">'+kpi('📦','r','Total barang DBR',all.length,'')+kpi('✅','g','Sesuai lokasi',ns,'')+kpi('📍','r','Perlu diperiksa',nt,'')+kpi('💬','b','Laporan dari chatbot',rd(K_REP,[]).length,'')+'</div>'+
 '<div class="tools"><select data-af><option value="">Semua status</option>'+Object.entries(lab).map(([k,v])=>'<option value="'+k+'"'+(AF===k?' selected':'')+'>'+v[1]+'</option>').join('')+'</select><button class="btn sec2" data-act="csvaset">Unduh CSV</button></div><div class="tw"><table><thead><tr><th>Kode Stiker</th><th>Kode Barang</th><th>Nama barang</th><th>Lokasi resmi (DBR)</th><th>Terakhir terlihat</th><th>Status</th></tr></thead><tbody>'+A.map(a=>'<tr><td>'+a.code+'</td><td>'+a.kode+'</td><td>'+esc(a.name)+'</td><td>'+esc(a.home)+'</td><td>'+esc(a.seen)+'</td><td><span class="bd '+lab[a.st][0]+'">'+lab[a.st][1]+'</span></td></tr>').join('')+'</tbody></table></div>'}

// ---------- Staf: daftar gedung ----------
const gedMap=db=>{const m=new Map();db.rooms.forEach(r=>{if(!m.has(r.gedung))m.set(r.gedung,[]);m.get(r.gedung).push(r)});return m};
const gKey=g=>encodeURIComponent(g);
function dbrList(){const db=DBR(),q=DQ.toLowerCase(),gm=gedMap(db),cnt={};db.items.forEach(i=>cnt[i.roomId]=(cnt[i.roomId]||0)+1);
 const gs=[...gm.entries()].filter(([g])=>!q||g.toLowerCase().includes(q));
 return '<h2 class="ph">🏢 Daftar Barang Ruangan (DBR)</h2><p class="sub">Pilih gedung, buka Rincian Gedung untuk melihat ruangannya, lalu buka Rincian Barang untuk mengelola barang di ruangan itu. Setiap barang punya kode stiker untuk pelacakan lewat chatbot /lacak.</p>'+
 '<div class="card"><div class="ch"><h3>Daftar Gedung</h3><button class="btn" data-dbr="ged-add">+ Tambah Gedung</button></div><div class="tools"><input data-dq placeholder="Cari nama gedung…" value="'+esc(DQ)+'" style="min-width:260px"></div>'+
 '<div class="tw"><table><thead><tr><th>No</th><th>Nama Gedung</th><th>Jumlah Ruangan</th><th>Jumlah Barang</th><th>Aksi</th></tr></thead><tbody>'+(gs.length?gs.map(([g,rs],i)=>'<tr><td>'+(i+1)+'</td><td><b>'+esc(g)+'</b></td><td>'+rs.length+'</td><td>'+rs.reduce((a,r)=>a+(cnt[r.id]||0),0)+'</td><td class="act"><a class="btn sm blue" href="#/dbr/'+gKey(g)+'">☰ Rincian Gedung</a> <button class="btn sm ylw" title="Ubah gedung" data-dbr="ged-edit" data-g="'+gKey(g)+'">✎</button> <button class="btn sm" title="Hapus gedung" data-dbr="ged-del" data-g="'+gKey(g)+'">🗑</button></td></tr>').join(''):'<tr><td colspan="5" class="empty">Tidak ada gedung.</td></tr>')+'</tbody></table></div></div>'}

// ---------- Staf: Rincian Gedung = daftar ruangan ----------
const rcount=db=>{const c={};db.items.forEach(i=>c[i.roomId]=(c[i.roomId]||0)+1);return c};
function dbrRooms(g){const db=DBR(),rooms=db.rooms.filter(r=>r.gedung===g),c=rcount(db);
 if(!rooms.length)return '<div class="card empty">Gedung tidak ditemukan. <a href="#/dbr">Kembali</a></div>';
 return '<h2 class="ph">🏢 Rincian Gedung</h2><div class="card dh"><div><b class="rb">Gedung: '+esc(g)+'</b><br>'+gLantai(db,g)+' lantai · '+rooms.length+' ruangan · '+rooms.reduce((a,r)=>a+(c[r.id]||0),0)+' jenis barang</div><div class="noprint"><button class="btn sm sec2" data-dbr="csvg" data-g="'+gKey(g)+'">⬇ CSV</button> <a class="btn sm grey" href="#/dbr">← Kembali</a></div></div>'+
 '<div class="card"><div class="ch"><h3>Daftar Ruangan</h3><button class="btn" data-dbr="room-add" data-g="'+gKey(g)+'">+ Tambah Ruangan</button></div><div class="tools"><input data-dq placeholder="Cari no. ruang atau nama ruang…" value="'+esc(DQ)+'" style="min-width:260px"></div>'+
 '<div class="tw"><table><thead><tr><th>No</th><th>No. Ruang</th><th>Nama Ruang</th><th>Lokasi Lantai</th><th>Nama Gedung</th><th>Barang</th><th>Aksi</th></tr></thead><tbody>'+
 (()=>{const q=DQ.toLowerCase(),rs=rooms.filter(r=>!q||(r.noRuang+' '+r.nama).toLowerCase().includes(q));return rs.length?rs.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.noRuang)+'</td><td>'+esc(r.nama)+'</td><td>Lantai '+(r.f||1)+'</td><td>'+esc(r.gedung)+'</td><td>'+(c[r.id]||0)+'</td><td class="act"><a class="btn sm blue" href="#/dbr/'+gKey(g)+'/'+r.id+'">☰ Rincian Barang</a> <button class="btn sm ylw" title="Ubah" data-dbr="room-edit" data-id="'+r.id+'">✎</button> <button class="btn sm" title="Hapus" data-dbr="room-del" data-id="'+r.id+'">🗑</button></td></tr>').join(''):'<tr><td colspan="7" class="empty">Tidak ada ruangan.</td></tr>'})()+'</tbody></table></div></div>'}

// ---------- Staf: Kelola Rincian Barang DBR (per ruangan) ----------
function dbrItems(g,rid){const db=DBR(),room=db.rooms.find(r=>String(r.id)===String(rid)&&r.gedung===g);
 if(!room)return '<div class="card empty">Ruangan tidak ditemukan. <a href="#/dbr/'+gKey(g)+'">Kembali</a></div>';
 const items=db.items.filter(i=>i.roomId===room.id),e=items.find(i=>i.id===DEDIT)||{};
 const f=(l,n,ph,v,t)=>'<label>'+l+'<input name="'+n+'" type="'+(t||'text')+'" placeholder="'+ph+'" value="'+esc(v==null?'':v)+'"'+(n==='nama'||n==='kode'||n==='jumlah'?' required':'')+(t==='number'?' min="1"':'')+'></label>';
 return '<h2 class="ph">☰ Kelola Rincian Barang DBR</h2>'+
 '<div class="card dh"><div><b class="rb">Ruang: '+esc(room.noRuang)+' - '+esc(room.nama)+'</b><br>Gedung: <b>'+esc(room.gedung)+'</b></div><div class="noprint"><button class="btn sm" data-dbr="print">🖨 Cetak DBR</button> <button class="btn sm sec2" data-dbr="csvr" data-id="'+room.id+'">⬇ CSV</button> <a class="btn sm grey" href="#/dbr/'+gKey(g)+'">← Kembali</a></div></div>'+
 '<div class="dg"><div class="card noprint"><h3>'+(DEDIT?'Ubah Barang':'Tambah Barang Baru')+'</h3><form class="dform" data-dbr-form="'+room.id+'">'+
 f('Nama Barang','nama','Contoh: Meja Kerja Kayu',e.nama)+f('Kode Barang','kode','Contoh: 3.05.01.04.001',e.kode)+f('Merk / Type','merk','Contoh: Olympic / Asus',e.merk)+f('Tahun','tahun','Contoh: 2024',e.tahun,'number')+f('Jumlah','jumlah','Contoh: 1 Unit',e.jumlah,'number')+'<label>Keterangan<select name="ket" required><option value="">Pilih kondisi barang…</option>'+KETS.map(k=>'<option'+(e.ket===k?' selected':'')+'>'+k+'</option>').join('')+'</select></label>'+
 '<button class="btn gr">💾 '+(DEDIT?'Simpan Perubahan':'Simpan Barang')+'</button>'+(DEDIT?' <button type="button" class="btn sec2" data-dbr="cancel">Batal</button>':'')+'</form></div>'+
 '<div class="card"><h3>Daftar Barang di Ruangan Ini</h3><div class="tw" style="margin-top:8px"><table><thead><tr><th>No</th><th>Nama Barang</th><th>Kode Barang</th><th>Kode Stiker</th><th>Merk</th><th>Tahun</th><th>Jumlah</th><th>Ket.</th><th class="noprint">Aksi</th></tr></thead><tbody>'+
 (items.length?items.map((i,n)=>'<tr><td>'+(n+1)+'</td><td><b>'+esc(i.nama)+'</b></td><td>'+esc(i.kode)+'</td><td><code>'+i.sticker+'</code></td><td>'+esc(i.merk||'-')+'</td><td>'+(i.tahun||'-')+'</td><td>'+i.jumlah+'</td><td>'+ketBadge(i.ket)+'</td><td class="act noprint"><button class="btn sm ylw" data-dbr="item-edit" data-id="'+i.id+'">✎</button> <button class="btn sm" data-dbr="item-del" data-id="'+i.id+'">🗑</button></td></tr>').join(''):'<tr><td colspan="9" class="empty">Belum ada barang. Tambahkan lewat form.</td></tr>')+'</tbody></table></div></div></div>'}

const dbrRoute=()=>{const p=location.hash.split('/'),g=p[2]?decodeURIComponent(p[2]):'';return !g?dbrList():p[3]?dbrItems(g,p[3]):dbrRooms(g)};
PAGES.staff.dbr=dbrRoute;

// ---------- modal ruangan / gedung ----------
function roomModal(id,gedung,newGed){const db=DBR(),r=db.rooms.find(x=>x.id===+id)||{},gs=[...new Set(db.rooms.map(x=>x.gedung))],gv=r.gedung||gedung||'';
 const m=document.createElement('div');m.className='ovl';
 m.innerHTML='<form class="mdl"><h3>'+(id?'Ubah Ruangan':newGed?'Tambah Gedung':'Tambah Ruangan')+'</h3>'+(newGed?'<p class="sub">Gedung baru dibuat bersama ruangan pertamanya.</p>':'')+'<label>Nama Gedung<input name="ged" required list="gl" placeholder="Nama gedung" value="'+esc(gv)+'"'+(!id&&!newGed?' readonly':'')+'><datalist id="gl">'+gs.map(g=>'<option>'+esc(g)+'</option>').join('')+'</datalist></label><label>No. Ruang<input name="no" required placeholder="22.4J.01.005" value="'+esc(r.noRuang||'')+'"></label><label>Nama Ruang<input name="nama" required placeholder="Ruang Asistensi" value="'+esc(r.nama||'')+'"></label><label>Lokasi Lantai (lantai tempat ruangan berada)<select name="lt" required>'+Array.from({length:Math.max(gLantai(db,gv),r.f||1)},(_,i)=>i+1).map(n=>'<option value="'+n+'"'+((r.f||1)===n?' selected':'')+'>Lantai '+n+'</option>').join('')+'</select></label><div style="display:flex;gap:8px"><label style="flex:1">Jam buka<input name="jb" type="number" min="0" max="23" required value="'+((r.h||[8,16])[0])+'"></label><label style="flex:1">Jam tutup<input name="jt" type="number" min="1" max="24" required value="'+((r.h||[8,16])[1])+'"></label></div><div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn sec2" data-x>Batal</button><button class="btn">Simpan</button></div></form>';
 document.body.appendChild(m);m.querySelector(newGed?'[name=ged]':'[name=no]').focus();
 m.onclick=e=>{if(e.target===m||e.target.matches('[data-x]'))m.remove()};
 m.querySelector('form').onsubmit=e=>{e.preventDefault();const f=e.target,v={noRuang:f.no.value.trim(),nama:f.nama.value.trim(),gedung:f.ged.value.trim(),f:+f.lt.value||1,h:[+f.jb.value,+f.jt.value]},d=cloneDB();
  if(v.h[1]<=v.h[0]){f.jt.setCustomValidity('Jam tutup harus setelah jam buka');f.reportValidity();f.jt.oninput=()=>f.jt.setCustomValidity('');return}
  if(d.rooms.some(x=>x.noRuang.toLowerCase()===v.noRuang.toLowerCase()&&x.id!==+id)){f.no.setCustomValidity('No. ruang sudah ada');f.reportValidity();f.no.oninput=()=>f.no.setCustomValidity('');return}
  if(id)Object.assign(d.rooms.find(z=>z.id===+id),v);else d.rooms.push({id:Math.max(0,...d.rooms.map(x=>x.id))+1,...v});
  m.remove();saveDBR(d)}}

// ---------- modal gedung (tambah / ubah) ----------
function gedModal(g){const db=DBR(),edit=!!g,rs=g?db.rooms.filter(r=>r.gedung===g):[],lt=g?gLantai(db,g):3;
 const m=document.createElement('div');m.className='ovl';
 m.innerHTML='<form class="mdl"><h3>'+(edit?'Ubah Gedung':'Tambah Gedung')+'</h3>'+(edit?'':'<p class="sub">Ruangan dibuat otomatis sesuai jumlah yang diisi dan dibagi rata ke tiap lantai. Nomor dan nama ruangan bisa diubah di Rincian Gedung.</p>')+
  '<label>Nama Gedung<input name="ged" required placeholder="Contoh: Gedung Pascasarjana" value="'+esc(g||'')+'"></label>'+
  '<div style="display:flex;gap:8px"><label style="flex:1">Jumlah Lantai<input name="jl" type="number" min="1" max="20" required value="'+lt+'"></label>'+(edit?'':'<label style="flex:1">Jumlah Ruangan<input name="jr" type="number" min="1" max="200" required value="6"></label>')+'</div>'+
  '<div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end"><button type="button" class="btn sec2" data-x>Batal</button><button class="btn">Simpan</button></div></form>';
 document.body.appendChild(m);m.querySelector('[name=ged]').focus();
 m.onclick=e=>{if(e.target===m||e.target.matches('[data-x]'))m.remove()};
 m.querySelector('form').onsubmit=e=>{e.preventDefault();const f=e.target,n=f.ged.value.trim(),L=+f.jl.value,d=cloneDB();d.gedung=d.gedung||{};
  if(d.rooms.some(r=>r.gedung.toLowerCase()===n.toLowerCase()&&r.gedung!==g)){f.ged.setCustomValidity('Nama gedung sudah ada');f.ged.reportValidity();f.ged.oninput=()=>f.ged.setCustomValidity('');return}
  if(edit){const mx=Math.max(1,...rs.map(r=>r.f||1));if(L<mx){f.jl.setCustomValidity('Ada ruangan di lantai '+mx+'. Pindahkan ruangannya dulu.');f.jl.reportValidity();f.jl.oninput=()=>f.jl.setCustomValidity('');return}
   d.rooms.forEach(r=>{if(r.gedung===g)r.gedung=n});d.items.forEach(i=>{if(i.seen&&i.seen.startsWith(g+' - '))i.seen=n+i.seen.slice(g.length)});if(n!==g)delete d.gedung[g];d.gedung[n]={lantai:L}}
  else{const N=+f.jr.value,ini=(n.replace(/^gedung\s+/i,'').match(/[A-Za-z]/)||['X'])[0].toUpperCase();let id=Math.max(0,...d.rooms.map(x=>x.id));d.gedung[n]={lantai:L};
   for(let i=0;i<N;i++){const fl=Math.floor(i*L/N)+1,no='22.4'+ini+'.'+String(fl).padStart(2,'0')+'.'+String(i+1).padStart(3,'0');d.rooms.push({id:++id,noRuang:no,nama:'Ruang '+(i+1),gedung:n,f:fl,h:[8,16]})}}
  m.remove();saveDBR(d);if(!edit)location.hash='#/dbr/'+gKey(n)}}

// ---------- aksi ----------
document.addEventListener('click',e=>{const t=e.target.closest('[data-dbr],[data-act="clrd"]');if(!t)return;
 if(t.dataset.act==='clrd'){localStorage.removeItem(K_DBR);render();return}
 const a=t.dataset.dbr,id=+t.dataset.id,g=t.dataset.g?decodeURIComponent(t.dataset.g):'';
 if(a==='ged-add')gedModal();
 else if(a==='room-add')roomModal(null,g);
 else if(a==='room-edit')roomModal(id);
 else if(a==='ged-edit')gedModal(g);
 else if(a==='ged-del'){const d=cloneDB(),rs=d.rooms.filter(r=>r.gedung===g),ids=new Set(rs.map(r=>r.id)),n=d.items.filter(i=>ids.has(i.roomId)).length;
  if(confirm('Hapus gedung "'+g+'" beserta '+rs.length+' ruangan dan '+n+' barang di dalamnya?')){d.rooms=d.rooms.filter(r=>r.gedung!==g);d.items=d.items.filter(i=>!ids.has(i.roomId));saveDBR(d)}}
 else if(a==='room-del'){const d=cloneDB(),r=d.rooms.find(x=>x.id===id),n=d.items.filter(i=>i.roomId===id).length;
  if(confirm('Hapus ruangan "'+r.nama+'"'+(n?' beserta '+n+' barang di dalamnya':'')+'?')){d.rooms=d.rooms.filter(x=>x.id!==id);d.items=d.items.filter(i=>i.roomId!==id);saveDBR(d)}}
 else if(a==='item-edit'){DEDIT=id;render();window.scrollTo(0,0)}
 else if(a==='cancel'){DEDIT=null;render()}
 else if(a==='item-del'){if(confirm('Hapus barang ini dari DBR?')){const d=cloneDB();d.items=d.items.filter(i=>i.id!==id);saveDBR(d)}}
 else if(a==='print')window.print();
 else if(a==='csvr'||a==='csvg'){const d=DBR(),rm={};d.rooms.filter(r=>a==='csvg'?r.gedung===g:r.id===id).forEach(r=>rm[r.id]=r);
  csv('DBR-'+(a==='csvg'?g:Object.values(rm)[0].noRuang).replace(/[^\w]+/g,'_')+'.csv',[['Gedung','No. Ruang','Nama Ruang','Kode Stiker','Nama Barang','Kode Barang','Merk','Tahun','Jumlah','Keterangan']].concat(d.items.filter(i=>rm[i.roomId]).map(i=>[rm[i.roomId].gedung,rm[i.roomId].noRuang,rm[i.roomId].nama,i.sticker,i.nama,i.kode,i.merk,i.tahun,i.jumlah,i.ket])))}});
document.addEventListener('submit',e=>{const f=e.target;if(!f.matches('[data-dbr-form]'))return;e.preventDefault();
 const d=cloneDB(),v={roomId:+f.dataset.dbrForm,nama:f.nama.value.trim(),kode:f.kode.value.trim(),merk:f.merk.value.trim(),tahun:f.tahun.value?+f.tahun.value:'',jumlah:+f.jumlah.value||1,ket:f.ket.value.trim()};
 if(DEDIT){const it=d.items.find(i=>i.id===DEDIT),moved=it.roomId!==v.roomId;Object.assign(it,v);if(moved)it.seen=roomLabel(d.rooms.find(r=>r.id===v.roomId));DEDIT=null}
 else d.items.push({id:Math.max(0,...d.items.map(i=>i.id))+1,sticker:nextSticker(d),seen:roomLabel(d.rooms.find(r=>r.id===v.roomId)),...v});
 saveDBR(d)});
document.addEventListener('input',e=>{const t=e.target;if(t.matches('[data-dq]')){DQ=t.value;const p=t.selectionStart;render();const n=document.querySelector('[data-dq]');n.focus();n.setSelectionRange(p,p)}});
window.addEventListener('hashchange',()=>{DEDIT=null;DQ=''});
