// Alur percakapan bot: /start, /cek, /reservasi, /kode, /lacak.
// ---------- FLOWS ----------
const MENU=()=>bot('Selamat datang di layanan SiUMPER!\nGunakan:\n\n'+B('/Cek')+' untuk melihat ketersediaan ruangan dan barang,\n'+B('/Reservasi')+' untuk peminjaman ruangan dan barang\n'+B('/Lacak')+' untuk melacak lokasi barang lewat foto stiker DBR');
function start(){S={st:'idle'};setState('idle');MENU()}
function cek(){S.pre=null;S.preR=null;setState('idle');bot(B('Informasi ruangan dan barang')+'\n\n'+B('/Ruangan')+' - Untuk cek kesediaan ruangan\n'+B('/Barang')+' - Untuk cek kesediaan barang',[['/Ruangan',ruangan],['/Barang',barang]])}
function ruangan(){S.pre=null;S.preR=null;S.flow='cek';bot('Silahkan pilih gedung yang kamu mau cek.',BUILDINGS.map(b=>[b,()=>{S.bld=b;askRoom()}]))}
function askRoom(){setState('cekRoom','Isi form, atau ketik: Ruang 4 tanggal 12 Oktober 2026');roomCekForm(S.bld)}
function roomCekForm(bld){const rs=ROOMS.filter(r=>r.b===bld),cf=BFORM[bld]||[1,1],fls=flo(bld);
 const rOpts=fl=>rs.filter(r=>!cf[1]||r.f===fl).map(r=>'<option>'+r.r+'</option>').join('');
 const floorF=cf[1]?'<label>Lantai<select name="fl">'+fls.map(n=>'<option value="'+n+'">Lantai '+n+'</option>').join('')+'</select></label>':'';
 const roomF=cf[0]?'<label>Nama ruangan<select name="rm">'+rOpts(fls[0])+'</select></label>':'';
 const note=!cf[0]?'Isi tanggal penggunaan. Peminjaman berlaku untuk seluruh '+esc(bld)+'.':cf[1]?'Pilih lantai, nama ruangan, dan tanggal penggunaan.':'Isi nama ruangan dan tanggal penggunaan.';
 setTimeout(()=>{const b=add('bot form','<div class="sh-info">🏢 <b>'+esc(bld)+'</b><br>'+note+' Kami akan memberi informasi ketersediaannya.</div><form class="fm" autocomplete="off">'+floorF+roomF+'<div class="seg"><button type="button" data-m="1">Sehari</button><button type="button" data-m="2">Lebih dari sehari</button></div><div class="row"><label><span class="l1">Tanggal</span><input name="d1" type="date" min="'+todayIso+'" required></label><label class="d2"><span>Tanggal selesai</span><input name="d2" type="date" min="'+todayIso+'"></label></div><div class="sh-foot"><button class="go">Cek ketersediaan</button></div></form>'),f=b.querySelector('form');let m='1';const upd=()=>{f.querySelectorAll('.seg button').forEach(x=>x.classList.toggle('on',x.dataset.m===m));f.querySelector('.d2').style.display=m==='2'?'':'none';f.elements.d2.required=m==='2';f.querySelector('.l1').textContent=m==='2'?'Tanggal mulai':'Tanggal'};f.querySelectorAll('.seg button').forEach(x=>x.onclick=()=>{m=x.dataset.m;upd()});upd();f.elements.d1.onchange=()=>{f.elements.d2.min=f.elements.d1.value||todayIso};f.addEventListener('input',e=>e.target.setCustomValidity&&e.target.setCustomValidity(''));
  const curR=()=>cf[0]?rs.find(r=>r.r===f.elements.rm.value&&(!cf[1]||r.f===+f.elements.fl.value)):rs[0];
  if(cf[1])f.elements.fl.onchange=()=>{f.elements.rm.innerHTML=rOpts(+f.elements.fl.value)};
  f.onsubmit=e=>{e.preventDefault();const r=curR(),a=f.elements.d1.value,b2=m==='2'?f.elements.d2.value:'';
   if(b2&&b2<a){f.elements.d2.setCustomValidity('Tanggal selesai tidak boleh sebelum tanggal mulai');f.reportValidity();return}
   const d=mkDate(a,b2);if(d.days.length>14){f.elements.d2.setCustomValidity('Maksimal 14 hari');f.reportValidity();return}
   [...f.elements].forEach(x=>x.disabled=true);
   me((cf[0]?(cf[1]?'Lantai '+r.f+', ':'')+r.r+', ':'')+d.txt);cekRoomCore(r,d)}},350)}
function barang(){S.pre=null;S.preR=null;setState('cekItem','Isi form, atau ketik: Mic wireless, 2, Sabtu 12 september 2026');openForm('cek')}
function doCekRoom(t){const r=findRoom(t),d=parseDate(t);
 if(!r||!d)return bot('⚠️ Ruangan atau tanggal belum terbaca. Contoh: "Ruang 4 tanggal 12 September 2026". Pilih gedung dulu lewat /ruangan agar form muncul.');
 cekRoomCore(r,d)}
function cekRoomCore(r,d){setState('idle');S.pre=null;const days=dys(d),multi=days.length>1;
 const per=days.map(i=>({i,w:roomWin(r,i)})),bad=per.filter(x=>!x.w),w=bad.length?null:winFor(r,days);
 S.preR=w?{room:r,date:d}:null;
 const ask='\n\nApakah kamu ingin melakukan peminjaman ruangan ini?\nSilakan gunakan /reservasi untuk melanjutkan proses peminjaman.';
 const head='✅ '+B('Informasi ruangan ditemukan')+'\n\n';
 if(w&&!multi)return bot(head+rlabel(r)+' tersedia pada:\n📅 '+d.txt+'\n⏰ Pukul '+wt(w)+(dow(days[0])===6?'\n(Hari Sabtu jam layanan lebih singkat.)':'')+'\n(Waktu peminjaman harus berada dalam jam tersebut.)'+ask,[['/Reservasi',reservasi]]);
 if(w){const same=per.every(x=>x.w[0]===per[0].w[0]&&x.w[1]===per[0].w[1]);
  return bot(head+rlabel(r)+' tersedia di '+B('seluruh tanggal')+' yang dipilih:\n📅 '+d.txt+'\n\n'+(same?'⏰ Setiap hari pukul '+wt(per[0].w):'Jam tersedia per hari:\n'+per.map(x=>'• '+dn(x.i)+': '+wt(x.w)).join('\n'))+'\n\n✔️ Jam yang bisa dipakai di semua hari: '+B(wt(w))+'\n(Peminjaman lebih dari sehari memakai jam mulai dan selesai yang sama setiap harinya, dan harus berada dalam jam tersebut.)'+ask,[['/Reservasi',reservasi]])}
 const ok=per.filter(x=>x.w);
 bot(head+rlabel(r)+' '+B('tidak tersedia')+(multi?' untuk seluruh tanggal yang dipilih':'')+'!\n'+(multi?'📅 '+d.txt+'\n\nKendala:\n':'(')+bad.map(x=>(multi?'• '+dn(x.i)+': ':'')+dayReason(r,x.i)).join('\n')+(multi?'':')')+(multi&&ok.length?'\n\nTanggal yang masih tersedia:\n'+ok.map(x=>'• '+dn(x.i)+': '+wt(x.w)).join('\n')+'\n(Coba pilih rentang tanggal lain, atau cek per tanggal.)':'')+'\n\nApakah kamu ingin melakukan pengecekan ruangan yang lain?\nSilakan gunakan /ruangan untuk memulai proses pengecekan ulang.',[['/Ruangan',ruangan]])}
function doCekItem(t){const k=findItem(t),d=parseDate(t);
 if(!k||!d)return bot('⚠️ Barang atau tanggal belum terbaca. Gunakan form, atau ketik mis. "Mic wireless, 2, Sabtu 12 september 2026". Barang tersedia: '+Object.values(STOCK).map(x=>x.n).join(', ')+'.');
 const q=+(t.replace(/\d{1,2}\s+\w+\s+\d{4}/,'').match(/,\s*(\d+)/)||[0,1])[1];cekItemCore(k,q,d)}
function cekItemCore(k,q,d){const free=freeR(k,d);S.preR=null;S.pre=free>=q?{item:k,qty:q,date:d}:null;setState('idle');
 if(free>=q)bot('✅ '+B('Informasi barang ditemukan')+'\n\nBarang yang kamu cari tersedia!\nNama Barang: '+STOCK[k].n+'\nJumlah Tersedia: '+free+' unit\nTanggal: '+d.txt+'\nKondisi: '+STOCK[k].cond+'\n\nApakah kamu ingin melakukan peminjaman barang ini?\nSilakan gunakan /reservasi untuk melanjutkan proses peminjaman.',[['/Reservasi',reservasi]]);
 else bot('✅ '+B('Informasi barang ditemukan')+'\n\nBarang yang kamu cari '+B('tidak tersedia')+'! (sisa '+free+' unit, diminta '+q+')\nTanggal: '+d.txt+'\n\nApakah kamu ingin melakukan peminjaman barang lain?\nSilakan gunakan /barang untuk cek kesediaan barang.',[['/Barang',barang]])}
function reservasi(){S.pre?resFormPre():S.preR?resFormPreR():resMenu()}
function resMenu(){setState('idle');S.inMenu=true;bot(B('Informasi ruangan dan barang')+'\n\n'+B('/Ruangan')+' - Untuk reservasi ruangan\n'+B('/Barang')+' - Untuk reservasi barang',[['/Ruangan',()=>resForm('room')],['/Barang',()=>resForm('item')]])}
function resFormPre(){S.inMenu=false;S.kind='item';setState('resText','Isi form, atau ketik sisa detail dalam satu pesan');openForm('res')}
function resFormPreR(){S.inMenu=false;S.kind='room';setState('resText','Isi form, atau ketik sisa detail dalam satu pesan');openForm('res')}
function resForm(kind){S.inMenu=false;S.kind=kind;setState('resText','Isi form, atau ketik semua detail dalam satu pesan');openForm('res')}
function parseRes(t){const d=parseDate(t),w=t.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/),n=t.match(/Nama\s+([A-Za-z ]+?)(?:,|\.|\s+NIM|\s+NIP|$)/i),id=t.match(/(NIM|NIP)\s*(\d+)/i),o=t.match(/\b(HIMA|BEM|UKM|DPM|HMJ)\s*\w*/i),k=t.match(/untuk\s+([^.\n]+?)(?:\s+(?:HIMA|BEM|UKM|DPM)|\.|\n|$)/i);
 const x={date:d,time:w?w[1].padStart(2,'0')+'.'+w[2]+'-'+w[3].padStart(2,'0')+'.'+w[4]:null,name:n&&n[1].trim(),id:id&&id[2],org:o&&o[0].trim(),need:k&&k[1].trim()};
 if(S.kind==='room'){x.room=findRoom(t)}else{x.item=findItem(t);x.qty=+((t.match(new RegExp(x.item?x.item+'\\s*,?\\s*(\\d+)':'$^','i'))||[0,1])[1])}
 return x}
function doRes(t){const x=parseRes(t),miss=[];if(S.pre&&S.kind==='item'){x.item=S.pre.item;x.qty=S.pre.qty;x.date=S.pre.date}if(S.preR&&S.kind==='room'){x.room=S.preR.room;x.date=S.preR.date}
 if(S.kind==='room'&&!x.room)miss.push('Gedung & Ruangan');if(S.kind==='item'&&!x.item)miss.push('Nama Barang (tersedia: '+Object.values(STOCK).map(s=>s.n).join(', ')+')');
 if(!x.date)miss.push('Tanggal (mis. 10 Oktober 2026)');if(!x.time)miss.push('Waktu (mis. 08.00-12.00)');if(!x.name)miss.push('Nama');if(!x.id)miss.push('NIM/NIP');if(!x.org)miss.push('Organisasi');
 if(miss.length)return bot('⚠️ Data belum lengkap. Mohon lengkapi:\n• '+miss.join('\n• ')+'\n\nKirim ulang detail peminjaman dalam satu pesan.');
 if(S.kind==='room'&&x.room&&x.time){const tt=x.time.split('-').map(z=>z.replace('.',':')),ww=winFor(x.room,dys(x.date))||x.room.h,o=ww[0],c=ww[1];if(tmin(tt[0])<o*60||tmin(tt[1])>c*60)return bot('⚠️ '+B('Waktu yang dipilih tidak tersedia')+'\n\n'+x.room.r+' hanya tersedia pukul '+winTxt(x.room)+'.\nSilakan kirim ulang dengan waktu yang sesuai.')}confirmRes(x)}
function confirmRes(x){S.res=x;setState('confirm','Tekan Kirim atau Edit');
 const lines=S.kind==='room'?'Gedung: '+x.room.b.replace('Gedung ','')+'\nRuangan: '+x.room.r:'Barang: '+STOCK[x.item].n+'\nJumlah: '+x.qty;
 bot('🔍 '+B('Data Reservasi')+'\n\n'+lines+'\nTanggal: '+x.date.txt+'\nWaktu: '+x.time+'\nNama: '+x.name+'\nOrganisasi: '+x.org+'\n\nData sudah benar?',[['✅ Kirim',verify],['✏️ Edit',()=>openForm('res',x)]])}
async function verify(){const x=S.res;S.pre=null;S.preR=null;
 const ok=S.kind==='room'?dys(x.date).every(i=>roomWin(x.room,i)):freeR(x.item,x.date)>=x.qty;
 if(!ok){setState('idle');return bot('🔍 '+B('Memverifikasi data...')+'\n\n✅ Data pemohon lengkap\n❌ '+(S.kind==='room'?'Ruangan':'Barang')+' tidak tersedia pada tanggal tersebut\n\nSilakan cek ketersediaan lain dengan /cek.',[['/Cek',cek]])}
 setState('spj','Unggah SPJ dan SIK pada kartu unggah, atau lewat tombol 📎');
 bot('🔍 '+B('Memverifikasi data...')+'\n\n✅ Data pemohon lengkap\n✅ '+(S.kind==='room'?'Ruangan':'Barang')+' tersedia\n\nSilakan unggah berkas berikut untuk proses verifikasi:\n📄 SPJ\n📄 SIK').then(uploadCard)}
function uploadCard(){
 const mk=(k,l)=>'<div class="up" data-k="'+k+'"><div class="ul">📄 '+l+'<span class="req">wajib</span></div><label class="pick"><input type="file" accept=".pdf,.doc,.docx,image/*" hidden><span class="pn">Pilih file…</span></label></div>';
 const el=add('bot form','<div class="sh-info">📎 <b>Unggah berkas</b><br>Unggah SPJ dan SIK untuk proses verifikasi.</div>'+mk('spj','SPJ')+mk('sik','SIK')+'<div class="sh-foot"><button class="go" disabled>Kirim berkas</button></div>');
 const ins={},go=el.querySelector('.go');
 el.querySelectorAll('.up').forEach(u=>{const i=u.querySelector('input'),pn=u.querySelector('.pn');ins[u.dataset.k]=i;i.onchange=()=>{const f=i.files[0];pn.textContent=f?f.name:'Pilih file…';u.classList.toggle('ok',!!f);go.disabled=!(ins.spj.files[0]&&ins.sik.files[0])}});
 go.onclick=()=>{const a=ins.spj.files[0],b=ins.sik.files[0];if(!a||!b)return;
  if(S.st!=='spj'){el.querySelectorAll('input,button').forEach(x=>x.disabled=true);return bot('Sesi reservasi sudah berakhir. Silakan mulai lagi dengan /reservasi.')}
  el.querySelectorAll('input,button').forEach(x=>x.disabled=true);me('📄 SPJ: '+a.name+'\n📄 SIK: '+b.name);S.upCard=null;doSPJ(a.name,b.name)};
 S.upCard={add(f){const k=!ins.spj.files[0]?'spj':!ins.sik.files[0]?'sik':null;if(!k)return null;const dt=new DataTransfer();dt.items.add(f);ins[k].files=dt.files;ins[k].dispatchEvent(new Event('change'));return k}}}
async function doSPJ(spjName,sikName){setState('wait','');
 await bot('📄 '+B('Verifikasi berkas')+'\n\nBerkas diterima:\n📄 SPJ: '+esc(spjName)+'\n📄 SIK: '+esc(sikName)+'\n\nMemeriksa:\n✅ Identitas pemohon\n✅ Kesesuaian kegiatan\n✅ Kelengkapan dokumen SPJ dan SIK\n\nSedang diproses.. menunggu persetujuan Admin');
 setTimeout(()=>{add('day','Hari berikutnya');const x=S.res;
  if(S.kind==='room')dys(x.date).forEach(i=>BOOK.push({kind:'room',key:rl(x.room).toLowerCase(),date:i}));else dys(x.date).forEach(i=>BOOK.push({kind:'item',key:x.item,qty:x.qty,date:i}));
  const where=S.kind==='room'?rl(x.room):STOCK[x.item].n+' x'+x.qty+'\nAmbil di: '+HOME[x.item];
  bot('✅ '+B('SPJ dan SIK valid')+'\n\nReservasi disetujui.\nPeminjaman:\n'+where+'\nTanggal:\n'+x.date.txt+'\n\nStatus: '+B('DISETUJUI'),null,0);setState('idle')},2500)}
// Lacak
function lacak(){setState('foto','Unggah foto stiker DBR lewat tombol 📎');bot('🔎 '+B('Pelacakan Barang')+'\n\nKirim foto stiker DBR pada barang (pastikan kode terlihat jelas). Kami akan menunjukkan lokasi yang seharusnya.\n\nTip: tekan tombol di bawah untuk mencoba dengan foto contoh.',[['📷 Pakai foto contoh',()=>{const it=ITEMS[Math.floor(Math.random()*ITEMS.length)];readCode(null,it.code)}]])}
function sticker(code){const c=document.createElement('canvas');c.width=300;c.height=130;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,300,130);g.strokeStyle='#222';g.lineWidth=4;g.strokeRect(6,6,288,118);g.fillStyle='#111';g.font='bold 22px sans-serif';g.fillText('DBR – Daftar Barang Ruangan',18,40);g.font='bold 26px monospace';g.fillText(code,18,85);g.font='13px sans-serif';g.fillText('Barang Kampus',18,112);return c.toDataURL()}
function readCode(img,code){me('📷 '+(img?'foto stiker':'foto contoh'));add('me','<img src="'+(img||sticker(code))+'" alt="foto stiker">');
 setState('foto','');
 if(!code){S.pending=true;setState('code','Ketik kode pada stiker, mis. DBR-2026-0101');return bot('📸 Foto diterima. Pembacaan otomatis (OCR) belum tersambung di prototype ini — ketik kode yang tertera pada stiker, atau pilih:',ITEMS.slice(0,4).map(i=>[i.code,()=>found(i.code)]))}
 bot('🔍 Membaca stiker...\nKode terbaca: '+B(code),null,500).then(()=>found(code))}
function found(code){code=code.toUpperCase().replace(/\s/g,'');const it=ITEMS.find(i=>i.code===code);
 if(!it){setState('code','Ketik kode pada stiker');return bot('❌ Kode '+B(code)+' tidak ada di data. Periksa kembali atau ketik ulang kodenya.')}
 S.item=it;setState('where','Ketik lokasi tempat barang ditemukan, mis. Ruang 4 Gedung C');bot('📦 '+B('Barang ditemukan')+'\n\nKode: '+it.code+'\nNama: '+it.name+'\n📍 Lokasi seharusnya: '+B(it.home)+'\n\nDi mana kamu menemukan barang ini sekarang?\nSilakan ketik lokasinya, mis. "Ruang 4 Gedung C".')}
function doWhere(t){const it=S.item;if(!it)return start();
 const home=ROOMS.find(r=>it.home===rl(r)||it.home===r.r),r=findRoom(t),q=t.toLowerCase();
 if(!r){const hb=home.b.toLowerCase().replace('gedung ','').split(/[()]/).map(x=>x.trim()).filter(Boolean);
  if(hb.some(k=>q.includes(k)))return bot('📍 Gedungnya terbaca ('+home.b+'), tapi nama ruangannya belum disebut. Mohon ketik lokasi lengkap, mis. "'+home.r+' '+home.b+'".')}
 setState('idle','');
 if(r&&r===home)return bot('✅ '+B('Lokasi sudah sesuai')+'\n\n'+it.name+' ('+it.code+') berada di lokasi yang benar:\n📍 '+B(it.home)+'\n\nGunakan /lacak untuk melacak barang lain.',[['/Lacak',lacak]]);
 const where=r?(r.b===r.r?r.r:r.b+' - '+r.r):'"'+t.trim()+'"';
 bot('⚠️ '+B('Barang tidak pada tempatnya')+'\n\n'+it.name+' ('+it.code+') ditemukan di '+where+'.\nSeharusnya berada di:\n📍 '+B(it.home)+'\n\nMohon kembalikan ke lokasi tersebut. Laporan sudah dicatat untuk Admin.\n\nGunakan /lacak untuk melacak barang lain.',[['/Lacak',lacak]])}
