// Beranda tiga dashboard sesuai "OBJECTIVE DASHBOARD": Staf UMPER (S-1..S-5), Tim IT (IT-1..IT-6), Pimpinan (P-1..P-6).
// Dimuat setelah dash.js, dbr.js, res.js. Data live berasal dari chatbot (log, reservasi, DBR); metrik yang belum
// bisa diukur prototype (Gemini Vision, NLP formulir, biaya API, riwayat bulan lalu) memakai data simulasi di data.json -> dashboard.extra.
const OX=()=>D.dashboard.extra||{};
const SIM='<span class="bd gr sim" title="Data simulasi: belum bisa diukur oleh prototype">simulasi</span>';
const rp=n=>'Rp'+num(Math.round(n));
// ---------- pengelompokan log ----------
const oFeat=l=>l.feat||({barang:'/cek',ruangan:'/cek'})[l.type]||(/reservasi/i.test(l.ket)?'/reservasi':'/start');
const oRate=ls=>ls.length?ls.filter(l=>l.ok).length/ls.length*100:0;
const oAvgS=ls=>ls.length?ls.reduce((a,l)=>a+l.ms,0)/ls.length/1000:0;
const oPct=(a,b)=>b?(a-b)/b*100:0;
const monthStart=()=>{const d=sod(new Date());d.setDate(1);return d};
// ---------- grafik tambahan ----------
function oHbar(rows,o){o=o||{};const mx=o.max||Math.max(1,...rows.map(r=>r.v)),f=v=>o.fmt?o.fmt(v):v;
 return '<div class="hb">'+rows.map(r=>'<div class="hr"><span class="hl" title="'+esc(r.label)+'">'+esc(r.label)+'</span><div class="ht"><div class="hf" style="width:'+Math.max(0,Math.min(100,r.v/mx*100))+'%;background:'+(r.color||o.color||'#e5484d')+'" title="'+esc(r.label+': '+f(r.v))+'"></div></div><b class="hv">'+f(r.v)+'</b></div>').join('')+'</div>'}
function oVbars(o){const W=o.w||440,H=o.h||250,L=48,R=14,T=14,B=30,iw=W-L-R,ih=H-T-B,n=o.labels.length,ns=o.series.length,gw=iw/n,bw=Math.min(W>600?64:34,gw*.74/ns),mx=o.max,Y=v=>T+ih-Math.min(v,mx)/mx*ih,f=v=>o.fmt?o.fmt(v):v;
 let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img">';
 o.ticks.forEach(t=>{s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(t)+'" y2="'+Y(t)+'" stroke="#e8ebf0"/><text x="'+(L-8)+'" y="'+(Y(t)+4)+'" font-size="10.5" fill="#6b7686" text-anchor="end">'+f(t)+'</text>'});
 o.labels.forEach((l,i)=>{s+='<text x="'+(L+i*gw+gw/2)+'" y="'+(H-10)+'" font-size="10.5" fill="#6b7686" text-anchor="middle">'+esc(l)+'</text>'});
 o.series.forEach((se,j)=>se.vals.forEach((v,i)=>{const x=L+i*gw+(gw-bw*ns)/2+j*bw,y=Y(v),c=(se.colors&&se.colors[i])||se.color;
  s+='<rect x="'+x+'" y="'+y+'" width="'+(bw-2)+'" height="'+Math.max(0,T+ih-y)+'" fill="'+c+'" rx="2"><title>'+esc(se.name+' – '+o.labels[i]+': '+f(v))+'</title></rect>';
  if(o.vals&&v)s+='<text x="'+(x+(bw-2)/2)+'" y="'+(y-4)+'" font-size="10" fill="#1b2330" text-anchor="middle">'+f(v)+'</text>'}));
 if(o.limit!=null)s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(o.limit)+'" y2="'+Y(o.limit)+'" stroke="#e5484d" stroke-dasharray="5 4"/><text x="'+(W-R)+'" y="'+(Y(o.limit)-4)+'" font-size="10.5" fill="#e5484d" text-anchor="end">'+esc(o.limitLabel||'')+'</text>';
 return s+'</svg>'}
const leg=a=>'<div class="leg">'+a.map(x=>'<span><i style="background:'+x[1]+'"></i>'+x[0]+'</span>').join('')+'</div>';
const fillGaps=(v,d)=>{let last=d;return v.map(x=>{if(x==null)return last;last=x;return x})};

// =====================================================================
// DASHBOARD STAF UMPER
// =====================================================================
let OBLD='';
function oStaf(){const now=new Date(),today=isoL(now),A=assets(),logs=allLogs(),ex=OX(),ms=monthStart();
 // S-1 antrean verifikasi
 const pend=RES().filter(r=>r.status==='Diproses').sort((a,b)=>a.created.localeCompare(b.created));
 const wait=r=>{const m=Math.max(0,Math.floor((now-new Date(r.created))/60000));return m<1?'Baru masuk':m<60?m+' menit':m<1440?Math.floor(m/60)+' jam':Math.floor(m/1440)+' hari '+Math.floor(m%1440/60)+' jam'};
 const antre='<div class="tw scroll"><table><thead><tr><th>#</th><th>No. Transaksi</th><th>Jenis</th><th>Pemohon</th><th>Dimohon untuk</th><th>Menunggu</th></tr></thead><tbody>'+
  (pend.length?pend.map((r,i)=>'<tr><td>'+(i+1)+'</td><td><code>'+r.id+'</code></td><td>'+(r.kind==='room'?'Ruangan':'Barang')+'</td><td><b>'+esc(r.name)+'</b><br><small>'+esc(r.org)+'</small></td><td>'+rname(r)+'</td><td>'+(i===0?'<b class="red">'+wait(r)+'</b> (terlama)':wait(r))+'</td></tr>').join(''):'<tr><td colspan="6" class="empty">Tidak ada pengajuan yang menunggu. 🎉</td></tr>')+'</tbody></table></div>';
 // S-6 barang belum dikembalikan (status pengembalian)
 const out=RES().filter(r=>['Dipinjam','Terlambat'].includes(loanOf(r))).sort((a,b)=>(loanOf(a)==='Terlambat'?0:1)-(loanOf(b)==='Terlambat'?0:1)||lastDate(a).localeCompare(lastDate(b))),late=out.filter(r=>loanOf(r)==='Terlambat');
 const pinjam='<div class="tw scroll"><table><thead><tr><th>Barang</th><th>Peminjam</th><th>Batas kembali</th><th>Status</th></tr></thead><tbody>'+(out.length?out.map(r=>'<tr><td>'+esc(r.itemNama)+' <small>× '+r.qty+'</small></td><td><b>'+esc(r.name)+'</b><br><small>'+esc(r.org)+'</small></td><td>'+fIso(lastDate(r))+'</td><td><span class="bd '+loanCls[loanOf(r)]+'">'+(loanOf(r)==='Terlambat'?'Terlambat '+lateDays(r)+' hari':'Dipinjam')+'</span></td></tr>').join(''):'<tr><td colspan="4" class="empty">Semua barang sudah dikembalikan.</td></tr>')+'</tbody></table></div>';
 // S-2 jadwal ruangan 7 hari
 const days=Array.from({length:7},(_,i)=>addD(now,i)),iso=days.map(isoL),rooms=RM().filter(r=>!OBLD||r.b===OBLD),blds=[...new Set(RM().map(r=>r.b))];
 const apr=RES().filter(x=>x.kind==='room'&&x.status==='Disetujui'),busy=(r,i)=>!roomFree(r,i)||apr.some(x=>roomKey(x)===rl(r).toLowerCase()&&x.dates.includes(i));
 const cell=(r,i)=>{return busy(r,i)?'<td class="c f">Terisi</td>':'<td class="c e">Kosong</td>'};
 const terisiHariIni=RM().filter(r=>busy(r,today)).length;
 const sched='<div class="tools"><label>Gedung: <select data-obld><option value="">Semua gedung</option>'+blds.map(b=>'<option value="'+esc(b)+'"'+(OBLD===b?' selected':'')+'>'+esc(b)+'</option>').join('')+'</select></label><span class="sub" style="margin:0">Hari ini: <b>'+terisiHariIni+'</b> dari '+RM().length+' ruangan terisi</span></div>'+
  '<div class="tw scroll"><table class="hm"><thead><tr><th>Ruangan</th>'+days.map((d,i)=>'<th style="text-align:center">'+(i?DAYS[d.getDay()].slice(0,3)+' '+d.getDate():'Hari ini')+'</th>').join('')+'</tr></thead><tbody>'+
  rooms.map(r=>'<tr><td>'+esc(rl(r))+'</td>'+iso.map(i=>cell(r,i)).join('')+'</tr>').join('')+'</tbody></table></div>';
 const bentrok=logs.filter(l=>l.t>=ms&&!l.ok&&/Reservasi ditolak/.test(l.ket)).length+(ex.bentrokDicegahBulanIni||0);
 // S-3 barang habis / menipis
 const stok=Object.entries(D.stock).map(([k,s])=>{const f=itemFree(k,today),t=s.total,st=f===0?'habis':f<=Math.max(1,Math.ceil(t*.25))?'menipis':'ok';return{k,n:s.n,f,t,st,blk:isBlk('item',k,today)}}).filter(x=>x.st!=='ok').sort((a,b)=>(a.st==='habis'?0:1)-(b.st==='habis'?0:1)||a.f-b.f);
 const brg='<div class="tw"><table><thead><tr><th>Barang</th><th>Tersedia</th><th>Status</th></tr></thead><tbody>'+(stok.length?stok.map(x=>'<tr><td>'+esc(x.n)+'</td><td>'+x.f+' dari '+x.t+'</td><td><span class="bd '+(x.st==='habis'?'bad':'warn')+'">'+(x.st==='habis'?'Habis':'Menipis')+'</span>'+(x.blk?' <small>(dinonaktifkan admin)</small>':'')+'</td></tr>').join(''):'<tr><td colspan="3" class="empty">Semua barang tersedia cukup hari ini.</td></tr>')+'</tbody></table></div>';
 // S-5 kelengkapan kode stiker per gedung
 const g={};A.forEach(a=>{const k=a.room.gedung,e=g[k]||(g[k]={t:0,ok:0});e.t++;if(/^DBR-\d{4}-\d{4}$/.test(a.code||''))e.ok++});
 const lengAll=A.length?Math.round(A.filter(a=>/^DBR-\d{4}-\d{4}$/.test(a.code||'')).length/A.length*100):0;
 const lengkap=Object.entries(g).map(([k,e])=>({label:k.replace(/\s*\(.*\)/,''),v:Math.round(e.ok/e.t*100),color:e.ok/e.t>=.9?'#16915a':e.ok/e.t>=.7?'#f0a020':'#e5484d'})).sort((a,b)=>a.v-b.v);
 return banner('Abel','Daftar pekerjaan yang perlu ditindaklanjuti hari ini.')+
 '<div class="kpis k5">'+kpi('📝','r','Menunggu verifikasi',pend.length,pend.length?'Terlama: '+wait(pend[0]):'Tidak ada antrean')+
  kpi('🛡️','b','Pengajuan bentrok ditolak sistem',bentrok,'bulan ini, dicegah otomatis')+
  kpi('📦','r','Barang habis / menipis',stok.length,stok.filter(x=>x.st==='habis').length+' habis hari ini')+
  kpi('🏷️','g','Kelengkapan kode stiker',lengAll+'%','seluruh barang DBR')+
  kpi('↩️',late.length?'r':'g','Barang belum dikembalikan',out.length,late.length?'<b class="red">'+late.length+' terlambat</b>':'Tidak ada yang terlambat')+'</div>'+
 '<div class="g2"><div class="card"><div class="ch"><h3>📝 Antrean Verifikasi Reservasi</h3><a href="#/reservasi">Buka Reservasi →</a></div>'+antre+'</div>'+
 '<div class="card"><div class="ch"><h3>📦 Barang Habis / Menipis</h3><a href="#/barang">Ketersediaan Barang →</a></div>'+brg+'</div></div>'+
 '<div class="card"><div class="ch"><h3>↩️ Peminjaman Barang Belum Dikembalikan</h3><a href="#/reservasi" data-rt="item">Buka Reservasi →</a></div>'+pinjam+'</div>'+
 '<div class="card"><div class="ch"><h3>🗓️ Jadwal Ruangan 7 Hari ke Depan</h3><a href="#/ruangan">Ketersediaan Ruangan →</a></div>'+leg([['Kosong','#16915a'],['Terisi / dinonaktifkan','#e5484d'],['Akhir pekan boleh dipesan (perlu persetujuan)','#9aa3b0']])+sched+'</div>'+
 '<div class="card"><div class="ch"><h3>✅ Kelengkapan Kode Stiker per Gedung</h3><a href="#/dbr">Kelola DBR →</a></div><p class="sub" style="margin:0 0 8px">Persentase barang DBR yang kode stikernya terisi dan berformat benar.</p>'+oHbar(lengkap,{max:100,fmt:v=>v+'%'})+'</div>'}

// =====================================================================
function oIT(){const logs=recent(allLogs()),today=sod(new Date()),P=PERIOD,from=addD(today,-(P-1)),to=addD(today,1),cur=inR(logs,from,to),prv=inR(logs,addD(from,-P),from),ex=OX();
 const c=stats(cur),p=stats(prv),days=Array.from({length:P},(_,i)=>addD(from,i)),labels=days.map(fmtD);
 // IT-1 keberhasilan + gagal per fitur + alasan terbanyak
 const feats=['/cek','/reservasi','/start'],fr=feats.map(f=>{const s=stats(cur.filter(l=>oFeat(l)===f));return{label:f+' ('+s.n+' permintaan)',v:s.fail}});
 const why={};cur.filter(l=>!l.ok).forEach(l=>{const k=l.ket.replace(/\s*\(.*\)\s*$/,'');why[k]=(why[k]||0)+1});
 const whyRows=Object.entries(why).sort((a,b)=>b[1]-a[1]).slice(0,4);
 // IT-2 waktu respons
 const tT=D.dashboard.targetMs/1000,per=days.map(d=>inR(cur,d,addD(d,1))),txt=fillGaps(per.map(x=>x.length?oAvgS(x):null),0),pT=cur.length?cur.filter(l=>l.ms/1000<=tT).length/cur.length*100:0,pTp=prv.length?prv.filter(l=>l.ms/1000<=tT).length/prv.length*100:0;
 // IT-4 formulir tanpa koreksi: terukur dari reservasi chatbot yang memakai NLP; jika belum ada, memakai data simulasi
 const nlA=RES().filter(r=>r.nlp),nlN=nlA.length,nlOk=nlA.filter(r=>r.nlp==='tanpa_koreksi').length,nlPct=nlN?Math.round(nlOk/nlN*100):0;
 const ft=ex.formTanpaKoreksi||[],wl=ft.map((_,i)=>fmtD(addD(today,-7*(ft.length-1-i))));
 // IT-5 sinkronisasi
 let ls=null;try{ls=localStorage.getItem('siumper-lastsync')}catch(e){}const last=ls?new Date(ls):SYNC,fail=+(localStorage.getItem('siumper-syncfail')||0),online=navigator.onLine&&SRC_OK;
 // IT-6 biaya Gemini (simulasi)
 const gw=ex.geminiBiayaMingguan||[],lim=ex.geminiBatasBulanan||250000,bulan=gw.slice(-4).reduce((a,b)=>a+b,0),gl=gw.map((_,i)=>i===gw.length-1?'Minggu ini':'M-'+(gw.length-1-i));
 const mxC=Math.ceil(Math.max(...gw,lim/4)/20000)*20000;
 const kpis='<div class="kpis">'+kpi('✔','g','Permintaan berhasil (IT-1)',Math.round(c.rate)+'%',delta(c.rate-p.rate,true,'%',' dari periode sebelumnya'))+
  kpi('⚡','b','Respons ≤ '+tT+' detik (IT-2)',Math.round(pT)+'%',delta(pT-pTp,true,'%',' dari periode sebelumnya'))+
  (nlN?kpi('📝','b','Formulir tanpa koreksi (IT-4)',nlPct+'%','<b>terukur</b>: '+nlOk+' dari '+nlN+' reservasi via NLP')
   :kpi('📝','b','Formulir tanpa koreksi (IT-4)',(ft.length?ft[ft.length-1]:0)+'%',ft.length>1?delta(ft[ft.length-1]-ft[ft.length-2],true,'%',' dari minggu lalu')+' '+SIM:SIM))+
  '<div class="card kpi"><div class="ico '+(online?'g':'r')+'">'+(online?'🟢':'🔴')+'</div><div><div class="l">Terakhir sinkron (IT-5)</div><div class="v" style="font-size:20px">'+(last?fmtT(last):'-')+'</div><div class="d"><span class="bd '+(online?'ok':'bad')+'">'+(online?'Terhubung':'Terputus')+'</span> &nbsp;Gagal: <b class="'+(fail?'red':'grn')+'">'+fail+'</b></div></div></div></div>';
 const cResp='<div class="card"><div class="ch"><h3>Waktu Respons Chatbot</h3>'+periodSel()+'</div>'+leg([['Rata-rata waktu respons','#e5484d'],['Target ≤ '+tT+' detik','#2a6fdb']])+
  lineChart({labels,min:0,max:5,ticks:[0,1,2,3,4,5],fmt:(v,x)=>dec(v,x?1:0)+' dtk',target:tT,series:[{name:'Waktu respons',color:'#e5484d',vals:txt}]})+
  '<p class="sub" style="margin:4px 0 0">Hari ini rata-rata <b>'+dec(txt[txt.length-1])+' dtk</b>. Permintaan yang memenuhi target: <b>'+Math.round(pT)+'%</b>.</p></div>';
 const cForm='<div class="card"><div class="ch"><h3>Tren Formulir Tanpa Koreksi (NLP) '+SIM+'</h3></div><div class="leg"><span><i style="background:#16915a"></i>% formulir terisi benar tanpa koreksi pengguna</span></div>'+lineChart({labels:wl,min:0,max:100,ticks:[0,25,50,75,100],fmt:v=>Math.round(v)+'%',series:[{name:'Formulir tanpa koreksi',color:'#16915a',vals:ft,area:true,end:(ft[ft.length-1]||0)+'%'}]})+
  '<p class="sub" style="margin:4px 0 0">Naik <b>'+((ft[ft.length-1]||0)-(ft[0]||0))+' poin</b> dalam '+ft.length+' minggu terakhir.</p></div>';
 const cFail='<div class="card"><div class="ch"><h3>Permintaan Tidak Terproses per Fitur</h3>'+periodSel()+'</div><p class="sub" style="margin:0 0 6px">Chatbot tidak memahami atau tidak bisa memenuhi permintaan (bukan gangguan internet). Dari '+num(c.n)+' permintaan, '+Math.round(c.rate)+'% berhasil.</p>'+oHbar(fr,{max:Math.max(5,...fr.map(x=>x.v))})+
  '<div class="sub" style="margin:12px 0 4px"><b>Alasan terbanyak</b></div><ul class="chk">'+(whyRows.length?whyRows.map(w=>'<li>'+esc(w[0])+' <b>('+w[1]+')</b></li>').join(''):'<li>Tidak ada kegagalan pada periode ini.</li>')+'</ul></div>';
 const cCost='<div class="card"><div class="ch"><h3>Biaya Gemini API per Minggu '+SIM+'</h3><span class="bd '+(bulan>lim?'bad':'ok')+'">'+rp(bulan)+' / '+rp(lim)+' ('+Math.round(bulan/lim*100)+'%)</span></div>'+
  oVbars({labels:gl,max:mxC,ticks:[0,.25,.5,.75,1].map(x=>Math.round(mxC*x)),fmt:v=>v>=1000?Math.round(v/1000)+'rb':v,series:[{name:'Biaya mingguan',color:'#2a6fdb',vals:gw,colors:gw.map(v=>v>lim/4?'#e5484d':'#2a6fdb')}],limit:lim/4,limitLabel:'Batas '+rp(lim/4)+'/minggu',w:520,h:270})+
  '<p class="sub" style="margin:4px 0 0">Garis merah: batas Rp250.000/bulan (≈ '+rp(lim/4)+' per minggu).</p></div>';
 return banner('Bruno','Kesehatan sistem: apakah chatbot cepat, akurat, dan tersambung ke data UMPER.')+kpis+
 '<div class="g2">'+cResp+cForm+'</div>'+
 '<div class="g2">'+cFail+cCost+'</div>'+
 '<div class="note pg"><span>ℹ️ Data bertanda <b>simulasi</b> belum bisa diukur oleh prototype ini (NLP formulir, biaya API). Sisanya dihitung dari log chatbot dan sinkronisasi Firebase.</span></div>'}

// =====================================================================
// DASHBOARD PIMPINAN
// =====================================================================
function oPim(){const logs=recent(allLogs()),today=sod(new Date()),ex=OX(),N=14,a0=addD(today,-(N-1)),a1=addD(today,1),cur=inR(logs,a0,a1),prv=inR(logs,addD(a0,-N),a0),res=RES();
 const luarJam=l=>{const h=l.t.getHours(),d=l.t.getDay();return d===0||h<8||h>=(d===6?14:16)};
 const pOut=ls=>ls.length?ls.filter(luarJam).length/ls.length*100:0;
 // P-1 reservasi via chatbot vs manual per bulan
 const now=new Date(),mk=(d)=>d.getFullYear()+'-'+pad(d.getMonth()+1),curM=mk(now),hist=ex.reservasiBulanan||[];
 const months=Array.from({length:6},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);return{k:mk(d),l:MS[d.getMonth()]}});
 const mv=months.map(m=>{if(m.k===curM){const r=res.filter(x=>x.created.slice(0,7)===curM);return{c:r.filter(x=>x.source==='chatbot').length,m:r.filter(x=>x.source!=='chatbot').length}}const h=hist.find(x=>x.m===m.k);return{c:h?h.chatbot:0,m:h?h.manual:0}});
 const share=mv.map(x=>x.c+x.m?Math.round(x.c/(x.c+x.m)*100):0);
 // P-3 jadwal bentrok (cek tumpang tindih reservasi ruangan disetujui bulan ini)
 const tm=s=>{const [a,b]=s.replace(/\./g,':').split('-').map(x=>x.split(':').map(Number));return[a[0]*60+(a[1]||0),b[0]*60+(b[1]||0)]};
 const ap=res.filter(r=>r.kind==='room'&&r.status==='Disetujui');let clash=0;
 ap.forEach((r,i)=>ap.slice(i+1).forEach(q=>{if(roomKey(r)!==roomKey(q))return;if(!r.dates.some(d=>q.dates.includes(d)&&d.slice(0,7)===curM))return;const x=tm(r.time),y=tm(q.time);if(x[0]<y[1]&&y[0]<x[1])clash++}));
 const dicegah=logs.filter(l=>l.t>=monthStart()&&!l.ok&&/Reservasi ditolak/.test(l.ket)).length+(ex.bentrokDicegahBulanIni||0);
 // P-4 rata-rata waktu verifikasi per bulan (jam)
 const wv=(ex.waktuVerifikasiJam||[]).slice(),ver=res.filter(r=>r.verified&&r.status==='Disetujui'&&r.created.slice(0,7)===curM&&new Date(r.verified)>=new Date(r.created));
 if(ver.length)wv[wv.length-1]=ver.reduce((a,r)=>a+(new Date(r.verified)-new Date(r.created))/36e5,0)/ver.length;
 const base=ex.waktuVerifikasiSebelumSistem||48,wvMax=Math.ceil(Math.max(base,...wv)/12)*12;
 // P-5 barang paling sering tidak tersedia
 const cnt={};(ex.barangTidakTersedia||[]).forEach(x=>cnt[x.label]=(cnt[x.label]||0)+x.v);
 logs.forEach(l=>{if(l.live&&l.type==='barang'){const m=l.ket.match(/^(.+?) tidak tersedia/);if(m)cnt[m[1]]=(cnt[m[1]]||0)+1}});
 const top=Object.entries(cnt).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([label,v])=>({label,v}));
 const lastMS=ver.length?'':' '+SIM;
 return banner('Pimpinan','Ringkasan evaluasi dampak sistem terhadap layanan UMPER.')+
 '<div class="kpis">'+kpi('🌙','b','Permintaan di luar jam layanan (P-2)',Math.round(pOut(cur))+'%',delta(pOut(cur)-pOut(prv),true,'%',' dari '+N+' hari sebelumnya'))+
  kpi('🛡️','g','Jadwal bentrok bulan ini (P-3)',clash,'<b class="up">'+dicegah+'</b> bentrok berhasil dicegah')+
  kpi('💬','g','Reservasi via chatbot (P-1)',share[5]+'%','bulan lalu '+share[4]+'%')+
  kpi('⏱️','r','Waktu verifikasi (P-4)',dec(wv[wv.length-1])+' jam','sebelum sistem '+base+' jam')+'</div>'+
 '<div class="g2"><div class="card"><div class="ch"><h3>Reservasi: Chatbot vs Input Manual (P-1)</h3></div>'+leg([['Via chatbot','#16915a'],['Input manual','#9aa3b0']])+
  oVbars({labels:months.map(m=>m.l),max:Math.max(10,Math.ceil(Math.max(...mv.map(x=>Math.max(x.c,x.m)))/10)*10),ticks:(()=>{const mx=Math.max(10,Math.ceil(Math.max(...mv.map(x=>Math.max(x.c,x.m)))/10)*10);return[0,1,2,3,4].map(i=>i*mx/4)})(),vals:true,series:[{name:'Via chatbot',color:'#16915a',vals:mv.map(x=>x.c)},{name:'Input manual',color:'#9aa3b0',vals:mv.map(x=>x.m)}]})+
  '<p class="sub" style="margin:4px 0 0">Porsi chatbot bulan ini <b>'+share[5]+'%</b> (bulan lalu '+share[4]+'%). Bulan berjalan masih parsial. Riwayat Jun–Okt '+SIM+'</p></div>'+
 '<div class="card"><div class="ch"><h3>Rata-rata Waktu Verifikasi (P-4)'+lastMS+'</h3></div>'+leg([['Rata-rata waktu verifikasi (jam)','#e5484d'],['Sebelum ada sistem ('+base+' jam)','#2a6fdb']])+
  lineChart({labels:months.map(m=>m.l),min:0,max:wvMax,ticks:[0,1,2,3,4].map(i=>i*wvMax/4),fmt:(v,x)=>dec(v,x?1:0)+' jam',target:base,series:[{name:'Waktu verifikasi',color:'#e5484d',vals:wv,end:dec(wv[wv.length-1])+' jam'}]})+
  '<p class="sub" style="margin:4px 0 0">Turun <b>'+Math.round((1-wv[wv.length-1]/base)*100)+'%</b> dibanding kondisi sebelum sistem.</p></div></div>'+
 '<div class="card"><div class="ch"><h3>5 Barang yang Paling Sering Tidak Tersedia (P-5)</h3><a href="#/barang">Ketersediaan Barang →</a></div><p class="sub" style="margin:0 0 6px">Dasar pertimbangan pengadaan: jumlah permintaan yang berakhir "tidak tersedia".</p>'+'<div style="max-width:600px">'+oHbar(top,{L:150})+'</div></div>'}

// ---------- pasang ke router ----------
PAGES.staff.beranda=oStaf;PAGES.it.beranda=oIT;
NAV.pimpinan=[['beranda','🏠','Beranda'],['pengaturan','⚙️','Pengaturan']];
PAGES.pimpinan={beranda:oPim,pengaturan:settingsPage};
document.addEventListener('change',e=>{if(e.target.matches('[data-obld]')){OBLD=e.target.value;render()}});
