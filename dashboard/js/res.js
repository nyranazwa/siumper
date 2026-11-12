// Menu Reservasi (Manajemen Peminjaman Ruangan / Barang). Data dibagi dengan chatbot lewat localStorage 'siumper-res'.
const K_RES='siumper-res';
const RES=()=>rd(K_RES,null)||D.reservations||[];
const saveRES=l=>{try{localStorage.setItem(K_RES,JSON.stringify(l))}catch(e){alert('Gagal menyimpan ke browser.')}};
const bookBase=()=>rd(K_BOOK,null)||JSON.parse(JSON.stringify(D.bookings));
const roomKey=r=>(r.gedung===r.ruang?r.ruang:r.gedung+' - '+r.ruang).toLowerCase();
function setStatus(id,st){const l=RES(),r=l.find(z=>z.id===id);if(!r)return;r.status=st;saveRES(l);
 const b=bookBase().filter(z=>z.res!==id);
 if(st==='Disetujui')r.dates.forEach(d=>b.push(r.kind==='room'?{kind:'room',key:roomKey(r),date:d,res:id}:{kind:'item',key:r.item,qty:r.qty,date:d,res:id}));
 try{localStorage.setItem(K_BOOK,JSON.stringify(b))}catch(e){}render()}
let RTAB='room',RST='',RQ='',RMSG='';
const fIso=i=>{const d=new Date(i+'T00:00:00');return d.getDate()+' '+MS[d.getMonth()]+' '+d.getFullYear()};
const stCls={Diproses:'warn',Disetujui:'ok',Ditolak:'bad'};
const jadwal=r=>(r.dates.length>1?fIso(r.dates[0])+' s/d '+fIso(r.dates[r.dates.length-1]):fIso(r.dates[0]))+'<br><small>'+esc(r.time.replace(/\./g,':').replace('-',' – '))+' WIB</small>';
const rname=r=>r.kind==='room'?(r.gedung===r.ruang?r.ruang:r.ruang+'<br><small>'+esc(r.gedung)+'</small>'):esc(r.itemNama)+' <small>× '+r.qty+'</small>';

function resPage(){const all=RES(),rows=all.filter(r=>r.kind===RTAB),q=RQ.toLowerCase();
 const list=rows.filter(r=>(!RST||r.status===RST)&&(!q||[r.id,r.name,r.nim,r.org,r.need,r.ruang,r.gedung,r.itemNama].join(' ').toLowerCase().includes(q))).sort((a,b)=>b.created.localeCompare(a.created));
 const cnt=s=>rows.filter(r=>r.status===s).length,room=RTAB==='room',today=isoL(new Date());
 const field=(l,n,ph,t,req)=>'<label>'+l+'<input name="'+n+'" type="'+(t||'text')+'" placeholder="'+ph+'"'+(req===false?'':' required')+'></label>';
 const target=room?'<label>Nama Ruangan<select name="tgt">'+RM().map(r=>'<option value="'+esc(rl(r))+'">'+esc(rl(r))+'</option>').join('')+'</select></label>':'<label>Barang<select name="tgt">'+Object.entries(D.stock).map(([k,s])=>'<option value="'+k+'">'+esc(s.n)+' (maks '+s.total+')</option>').join('')+'</select></label>'+field('Jumlah','qty','1','number');
 return '<h2 class="ph">📝 Manajemen Peminjaman '+(room?'Ruangan':'Barang')+'</h2><p class="sub">Pengajuan dari chatbot dan input manual. Peminjaman yang <b>Disetujui</b> otomatis mengurangi ketersediaan di chatbot dan menu Ketersediaan.</p>'+
 '<div class="tabs noprint"><button data-rt="room" class="'+(room?'on':'')+'">🗓️ Ruangan ('+all.filter(r=>r.kind==='room').length+')</button><button data-rt="item" class="'+(!room?'on':'')+'">📦 Barang ('+all.filter(r=>r.kind==='item').length+')</button></div>'+
 '<div class="rg"><div class="card noprint"><h3>Form Pinjam '+(room?'Ruangan':'Barang')+'</h3><form class="dform" data-res-form>'+target+field('Nama Penanggung Jawab','nm','Nama lengkap penanggung jawab')+field('NIM / NIP / NIK','nim','Cth: 2022530001 / NIP…')+field('No HP','hp','08…','tel')+field('Lembaga / Organisasi / Prodi','org','Cth: Himpunan Mahasiswa / BEM')+
 '<label>Tanggal Pinjam<input name="dt" type="date" min="'+today+'" required></label><div style="display:flex;gap:8px"><label style="flex:1">Jam Mulai<input name="ws" type="time" value="08:00" required></label><label style="flex:1">Jam Selesai<input name="we" type="time" value="12:00" required></label></div>'+field('Keperluan Acara','need','Deskripsi singkat acara…')+
 '<div class="warn" '+(RMSG?'':'hidden')+'>⚠️ '+esc(RMSG)+'</div><button class="btn gr">✓ Simpan Peminjaman</button></form></div>'+
 '<div class="card"><div class="ch"><h3>Daftar Peminjaman '+(room?'Ruangan':'Barang')+'</h3><span class="noprint"><button class="btn sm" data-res="csv">⬇ Ekspor CSV</button> <button class="btn sm blue" data-res="print">🖨 Cetak Rekap</button></span></div>'+
 '<div class="tools noprint"><input data-rq placeholder="Cari berdasarkan nama, NIM/NIP, '+(room?'ruangan':'barang')+', atau lembaga…" value="'+esc(RQ)+'" style="flex:1;min-width:220px"><select data-rs><option value="">Semua status ('+rows.length+')</option>'+['Diproses','Disetujui','Ditolak'].map(s=>'<option value="'+s+'"'+(RST===s?' selected':'')+'>'+s+' ('+cnt(s)+')</option>').join('')+'</select></div>'+
 '<div class="tw"><table><thead><tr><th>No</th><th>No. Transaksi</th><th>'+(room?'Ruangan':'Barang')+'</th><th>Penanggung Jawab (NIM/NIP)</th><th>Lembaga / Prodi</th><th>Jadwal</th><th>Keperluan</th><th>Berkas</th><th>Status</th><th class="noprint">Verifikasi UMPER</th></tr></thead><tbody>'+
 (list.length?list.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><code>'+r.id+'</code>'+(r.source==='chatbot'?'<br><small title="Diajukan lewat chatbot">🤖 chatbot</small>':'')+'</td><td>'+rname(r)+'</td><td><b>'+esc(r.name)+'</b><br><small>'+esc(r.nim)+'</small></td><td>'+esc(r.org)+'</td><td>'+jadwal(r)+'</td><td>'+esc(r.need||'-')+'</td><td>'+(r.spj||r.sik?'<small>📄 SPJ: '+esc(r.spj||'-')+'<br>📄 SIK: '+esc(r.sik||'-')+'</small>':'-')+'</td><td><span class="bd '+stCls[r.status]+'">'+r.status+'</span></td><td class="act noprint">'+
  (r.status==='Diproses'?'<button class="btn sm gr0" data-res="ok" data-id="'+r.id+'">✓ Verifikasi (Setujui)</button> <button class="btn sm ylw" data-res="no" data-id="'+r.id+'">✕ Tolak</button> ':r.status==='Disetujui'?'<button class="btn sm ylw" data-res="back" data-id="'+r.id+'" title="Kembalikan ke Diproses">↺</button> ':'<button class="btn sm ylw" data-res="back" data-id="'+r.id+'" title="Kembalikan ke Diproses">↺</button> ')+
  '<button class="btn sm" data-res="del" data-id="'+r.id+'">🗑</button></td></tr>').join(''):'<tr><td colspan="10" class="empty">Belum ada data peminjaman.</td></tr>')+'</tbody></table></div></div></div>'}
PAGES.staff.reservasi=resPage;

// ---------- aksi ----------
document.addEventListener('click',e=>{const t=e.target.closest('[data-rt],[data-res]');if(!t)return;
 if(t.dataset.rt){RTAB=t.dataset.rt;RST='';RQ='';RMSG='';render();return}
 const a=t.dataset.res,id=t.dataset.id;
 if(a==='ok')setStatus(id,'Disetujui');
 else if(a==='no'){if(confirm('Tolak pengajuan '+id+'?'))setStatus(id,'Ditolak')}
 else if(a==='back')setStatus(id,'Diproses');
 else if(a==='del'){if(confirm('Hapus data '+id+'?')){const b=bookBase().filter(z=>z.res!==id);try{localStorage.setItem(K_BOOK,JSON.stringify(b))}catch(x){}saveRES(RES().filter(r=>r.id!==id));render()}}
 else if(a==='print')window.print();
 else if(a==='csv'){const rows=RES().filter(r=>r.kind===RTAB);csv('peminjaman-'+(RTAB==='room'?'ruangan':'barang')+'.csv',[['No. Transaksi',RTAB==='room'?'Ruangan':'Barang','Penanggung Jawab','NIM/NIP','No HP','Lembaga','Tanggal','Jam','Keperluan','Status','Sumber']].concat(rows.map(r=>[r.id,RTAB==='room'?r.gedung+' - '+r.ruang:r.itemNama+' x'+r.qty,r.name,r.nim,r.hp,r.org,r.dates.join(' s/d '),r.time,r.need,r.status,r.source])))}});
document.addEventListener('change',e=>{if(e.target.matches('[data-rs]')){RST=e.target.value;render()}});
document.addEventListener('input',e=>{const t=e.target;if(t.matches('[data-rq]')){RQ=t.value;const p=t.selectionStart;render();const n=document.querySelector('[data-rq]');n.focus();n.setSelectionRange(p,p)}});
document.addEventListener('submit',e=>{const f=e.target;if(!f.matches('[data-res-form]'))return;e.preventDefault();
 const g=n=>f.elements[n].value.trim(),dt=g('dt'),ws=g('ws'),we=g('we'),room=RTAB==='room';let msg='';
 if(we<=ws)msg='Jam selesai harus setelah jam mulai.';
 else if(room){const r=RM().find(x=>rl(x)===g('tgt')),w=roomWin(r,dt);
  if(!w)msg=r.r+' tidak tersedia pada '+fIso(dt)+' ('+(!roomFree(r,dt)?(isBlk('room',rl(r).toLowerCase(),dt)?'dinonaktifkan admin UMPER':'sudah dipesan'):dow(dt)===0?'libur kampus, hari Minggu':'di luar jam layanan')+').';
  else if(+ws.slice(0,2)*60+ +ws.slice(3)<w[0]*60||+we.slice(0,2)*60+ +we.slice(3)>w[1]*60)msg=r.r+' hanya tersedia pukul '+hh(w[0])+' - '+hh(w[1])+' WIB pada tanggal itu.'}
 else{const k=g('tgt'),q=+g('qty')||1,fr=itemFree(k,dt);if(fr<q)msg=D.stock[k].n+' tidak tersedia pada '+fIso(dt)+' (sisa '+fr+' unit, diminta '+q+').'}
 RMSG=msg;if(msg){render();return}
 const l=RES(),ymd=dt.replace(/-/g,''),pre='TRX-'+(room?'RG':'BR')+'-'+ymd+'-';let n;do{n=String(100+Math.floor(Math.random()*900))}while(l.some(x=>x.id===pre+n));
 const rec={id:pre+n,kind:RTAB,created:new Date().toISOString(),name:g('nm'),nim:g('nim'),hp:g('hp'),org:g('org'),need:g('need'),dates:[dt],time:ws.replace(':','.')+'-'+we.replace(':','.'),status:'Diproses',source:'dashboard'};
 if(room){const r=RM().find(x=>rl(x)===g('tgt'));rec.gedung=r.b;rec.ruang=r.r}else{rec.item=g('tgt');rec.itemNama=D.stock[rec.item].n;rec.qty=+g('qty')||1}
 saveRES([rec].concat(l));RMSG='';render()});
