// Dashboard SiUMPER. Sumber data: ../data.json (nanti ganti ke endpoint API) + log live dari chatbot (localStorage).
const DATA_URL='../data.json';
const K_LOG='siumper-log',K_BOOK='siumper-bookings',K_REP='siumper-reports',K_ROLE='siumper-role';
const MS=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MF=['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const DAYS=['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const TYPES={barang:'Ketersediaan barang',ruangan:'Ketersediaan ruangan',aset:'Lokasi aset (DBR)',lainnya:'Lainnya'};
const TCOL={barang:'#e5484d',ruangan:'#2a6fdb',aset:'#16915a',lainnya:'#9aa3b0'};
const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const sod=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x};
const isoL=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const fmtD=d=>d.getDate()+' '+MS[d.getMonth()];
const fmtFull=d=>DAYS[d.getDay()]+', '+d.getDate()+' '+MF[d.getMonth()]+' '+d.getFullYear();
const fmtT=d=>d.getDate()+' '+MS[d.getMonth()]+' '+pad(d.getHours())+':'+pad(d.getMinutes());
const rd=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}};
const num=n=>new Intl.NumberFormat('id-ID').format(n);
const dec=(n,p=1)=>n.toFixed(p).replace('.',',');

let D=null,BOOK=[],ROLE=rd(K_ROLE,'it'),PERIOD=7,SYNC=null,SRC_OK=true,sig='';
// ---------- ketersediaan (sama dengan logika chatbot) ----------
const rl=r=>r.b===r.r?r.r:r.b+' - '+r.r;
const dow=i=>new Date(i+'T00:00:00Z').getUTCDay();
// Blokir manual oleh admin UMPER (key room = rl(r) huruf kecil, key item = kunci stok)
const K_BLK='siumper-block',BLK=()=>rd(K_BLK,[]);
const isBlk=(kind,key,i)=>BLK().some(b=>b.kind===kind&&b.key===key&&(!b.from||i>=b.from)&&(!b.to||i<=b.to));
const saveBLK=l=>{try{localStorage.setItem(K_BLK,JSON.stringify(l))}catch(e){}render()};
const roomFree=(r,i)=>!isBlk('room',rl(r).toLowerCase(),i)&&!BOOK.some(b=>b.kind==='room'&&b.key===rl(r).toLowerCase()&&b.date===i);
function roomWin(r,i){if(!roomFree(r,i)||dow(i)===0)return null;let o=r.h[0],c=r.h[1];if(dow(i)===6)c=Math.min(c,14);return c>o?[o,c]:null}
function itemFree(k,i){if(isBlk('item',k,i))return 0;const used=BOOK.filter(b=>b.kind==='item'&&b.key===k&&b.date===i).reduce((a,b)=>a+b.qty,0);return Math.max(0,D.stock[k].total-used)}
const hh=n=>pad(n)+'.00';
// ---------- data ----------
async function load(){
 try{const r=await fetch(DATA_URL,{cache:'no-store'});if(!r.ok)throw new Error(r.status);D=await r.json();SYNC=new Date();SRC_OK=true}
 catch(e){SRC_OK=false;if(!D){$('#pg').innerHTML='<div class="card empty">Gagal memuat data.json. Jalankan lewat server lokal (mis. <code>npx serve</code> atau <code>python -m http.server</code>), bukan dibuka langsung dari file.</div>';return false}}
 return true}
function sync(){const b=rd(K_BOOK,null);BOOK=Array.isArray(b)?b:D.bookings}
function allLogs(){
 const base=sod(new Date()),now=new Date();
 const seed=D.dashboard.seedLogs.map(l=>{const t=addD(base,-l.d);t.setMinutes(l.m);return{t,type:l.type,ok:l.ok,ms:l.ms,ket:l.ket}});
 const live=rd(K_LOG,[]).map(l=>({t:new Date(l.t),type:l.type,ok:l.ok,ms:l.ms,ket:l.ket,live:true}));
 return seed.concat(live).sort((a,b)=>b.t-a.t)}
const recent=ls=>{const n=new Date();return ls.filter(l=>l.t<=n)};
const inR=(ls,a,b)=>ls.filter(l=>l.t>=a&&l.t<b);
function stats(ls){const n=ls.length,ok=ls.filter(l=>l.ok).length;return{n,ok,fail:n-ok,rate:n?ok/n*100:0,ms:n?ls.reduce((a,l)=>a+l.ms,0)/n:0}}
function assets(){const rep={};rd(K_REP,[]).forEach(r=>rep[r.code]=r);
 return D.dashboard.assets.map(a=>{const r=rep[a.code];const seen=r?r.seen:a.lastSeen;
  const st=!a.home?'belum':(seen===a.home?'sesuai':'tidak');return{...a,seen,st}})}
// ---------- grafik SVG ----------
function lineChart(o){const W=o.w||440,H=o.h||250,L=40,R=22,T=12,Bt=28,iw=W-L-R,ih=H-T-Bt,n=o.labels.length,mn=o.min||0,mx=o.max;
 const X=i=>L+(n<2?iw/2:i*iw/(n-1)),Y=v=>T+ih-(v-mn)/(mx-mn)*ih;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img">';
 o.ticks.forEach(t=>{s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(t)+'" y2="'+Y(t)+'" stroke="#e8ebf0"/><text x="'+(L-8)+'" y="'+(Y(t)+4)+'" font-size="10.5" fill="#6b7686" text-anchor="end">'+(o.fmt?o.fmt(t):t)+'</text>'});
 const step=n>10?2:1;o.labels.forEach((l,i)=>{if(i%step===0||i===n-1)s+='<text x="'+X(i)+'" y="'+(H-8)+'" font-size="10.5" fill="#6b7686" text-anchor="middle">'+l+'</text>'});
 (o.targets||(o.target?[{v:o.target}]:[])).forEach(t=>{s+='<line x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(t.v)+'" y2="'+Y(t.v)+'" stroke="'+(t.color||'#2a6fdb')+'" stroke-dasharray="5 4" opacity=".8"/>'});
 o.series.forEach(se=>{const pts=se.vals.map((v,i)=>[X(i),Y(Math.min(Math.max(v,mn),mx))]);if(!pts.length)return;const d=pts.map((p,i)=>(i?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join('');
  if(se.area)s+='<path d="'+d+'L'+pts[pts.length-1][0]+' '+(T+ih)+'L'+pts[0][0]+' '+(T+ih)+'Z" fill="'+se.color+'" opacity=".08"/>';
  s+='<path d="'+d+'" fill="none" stroke="'+se.color+'" stroke-width="2"/>';
  pts.forEach((p,i)=>{s+='<circle cx="'+p[0]+'" cy="'+p[1]+'" r="'+(i===pts.length-1?4:3)+'" fill="'+se.color+'"><title>'+esc(se.name+' – '+o.labels[i]+': '+(o.fmt?o.fmt(se.vals[i],1):se.vals[i]))+'</title></circle>'});
  if(se.end){const p=pts[pts.length-1];s+='<text x="'+(p[0]+4)+'" y="'+(p[1]-9)+'" font-size="11.5" font-weight="700" fill="'+se.color+'" text-anchor="end">'+se.end+'</text>'}});
 return s+'</svg>'}
function donut(parts,top,sub,size=150){const tot=parts.reduce((a,p)=>a+p.v,0)||1,r=size*.36,c=2*Math.PI*r,sw=size*.17;let off=0;
 let s='<svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'"><g transform="rotate(-90 '+size/2+' '+size/2+')"><circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="#eceff3" stroke-width="'+sw+'"/>';
 parts.forEach(p=>{const len=p.v/tot*c;s+='<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+p.color+'" stroke-width="'+sw+'" stroke-dasharray="'+len+' '+(c-len)+'" stroke-dashoffset="'+(-off)+'"><title>'+esc(p.label+': '+p.v)+'</title></circle>';off+=len});
 return s+'</g><text x="'+size/2+'" y="'+(size/2+4)+'" text-anchor="middle" font-size="'+size*.15+'" font-weight="700" fill="#1b2330">'+top+'</text><text x="'+size/2+'" y="'+(size/2+size*.12)+'" text-anchor="middle" font-size="'+size*.062+'" fill="#6b7686">'+sub+'</text></svg>'}
function hbars(rows,max,ca,cb){const W=440,rh=38,L=84,H=rows.length*rh+26,iw=W-L-10,X=v=>L+v/max*iw;let s='<svg viewBox="0 0 '+W+' '+H+'" width="100%">';
 for(let t=0;t<=max;t+=Math.ceil(max/5)){s+='<line x1="'+X(t)+'" x2="'+X(t)+'" y1="0" y2="'+(H-22)+'" stroke="#eef0f4"/><text x="'+X(t)+'" y="'+(H-8)+'" font-size="10.5" fill="#6b7686" text-anchor="middle">'+t+'</text>'}
 rows.forEach((r,i)=>{const y=i*rh+6;s+='<text x="'+(L-8)+'" y="'+(y+14)+'" font-size="11.5" text-anchor="end" fill="#1b2330">'+esc(r.label)+'</text>';
  const wa=X(r.a)-L,wb=X(r.b)-L;s+='<rect x="'+L+'" y="'+y+'" width="'+wa+'" height="20" fill="'+ca+'"><title>'+esc(r.label+' tersedia: '+r.a)+'</title></rect><rect x="'+(L+wa)+'" y="'+y+'" width="'+wb+'" height="20" fill="'+cb+'"><title>'+esc(r.label+' tidak tersedia: '+r.b)+'</title></rect>';
  if(r.a)s+='<text x="'+(L+wa/2)+'" y="'+(y+14)+'" font-size="10.5" fill="#fff" text-anchor="middle">'+r.a+'</text>';if(r.b)s+='<text x="'+(L+wa+wb/2)+'" y="'+(y+14)+'" font-size="10.5" fill="#fff" text-anchor="middle">'+r.b+'</text>'});
 return s+'</svg>'}
// ---------- komponen ----------
const kpi=(ic,cls,l,v,d)=>'<div class="card kpi"><div class="ico '+cls+'">'+ic+'</div><div><div class="l">'+l+'</div><div class="v">'+v+'</div><div class="d">'+d+'</div></div></div>';
function delta(val,goodUp,unit,txt){const up=val>=0,good=goodUp?up:!up;return '<b class="'+(good?'up':'dn')+'">'+(up?'↑':'↓')+' '+Math.abs(Math.round(val))+unit+'</b>'+txt}
const banner=(name,sub)=>'<div class="ban"><h1>Selamat Datang, '+name+'!</h1><p>'+sub+'</p><svg viewBox="0 0 420 120" preserveAspectRatio="xMaxYMax meet"><g fill="#fff" stroke="#c8707a" stroke-width="1.5"><rect x="150" y="40" width="200" height="80"/><rect x="195" y="15" width="110" height="105"/><path d="M180 15h140l-70-14z"/></g><g fill="#e3a3aa">'+Array.from({length:40},(_,i)=>'<rect x="'+(160+(i%10)*18)+'" y="'+(50+Math.floor(i/10)*17)+'" width="9" height="10"/>').join('')+'</g></svg></div>';
const typeBadge=l=>'<span class="bd '+(l.ok?'ok':'bad')+'">'+(l.ok?'Berhasil':'Gagal')+'</span>';
function logTable(ls,n){return '<div class="tw"><table><thead><tr><th>Waktu</th><th>Jenis Permintaan</th><th>Status</th><th>Keterangan</th></tr></thead><tbody>'+ls.slice(0,n).map(l=>'<tr><td>'+fmtT(l.t)+(l.live?' <span class="live" title="dari chatbot"></span>':'')+'</td><td>'+TYPES[l.type]+'</td><td>'+typeBadge(l)+'</td><td>'+esc(l.ket)+'</td></tr>').join('')+'</tbody></table></div>'}
const periodSel=()=>'<select data-period>'+[7,14].map(p=>'<option value="'+p+'"'+(p===PERIOD?' selected':'')+'>'+p+' hari terakhir</option>').join('')+'</select>';
function integ(){const a=D.dashboard.assets;return[['Inventaris barang',Object.keys(D.stock).length,'jenis barang'],['Jadwal ruangan',RM().length,'ruangan'],['Lokasi aset (DBR)',a.length,'aset']]}
function integCard(){const t=SYNC?SYNC.getDate()+' '+MF[SYNC.getMonth()]+' '+SYNC.getFullYear()+', '+pad(SYNC.getHours())+':'+pad(SYNC.getMinutes()):'-';
 return '<div class="card"><div class="ch"><h3>🗄️ Status Integrasi Data</h3><a href="#/integrasi">Lihat detail →</a></div><div class="stat"><div class="dbi">🛢️</div><div><span class="bd '+(SRC_OK?'ok':'bad')+'">'+(SRC_OK?'Terhubung':'Terputus')+'</span><div style="margin-top:6px;font-size:12px">Terakhir sinkron<br><b style="font-size:13.5px">'+t+'</b></div></div></div><ul class="chk">'+integ().map(x=>'<li>'+x[0]+'</li>').join('')+'</ul><div class="note">ℹ️ Data diperbarui secara otomatis sesuai jadwal sistem.</div></div>'}

// ---------- halaman: Tim IT ----------
function itHome(){const logs=allLogs(),today=sod(new Date()),P=PERIOD,from=addD(today,-(P-1)),to=addD(today,1),pf=addD(from,-P);
 const cur=inR(logs,from,to),prv=inR(logs,pf,from),c=stats(cur),p=stats(prv);
 const pc=(a,b)=>b?(a-b)/b*100:0;
 const days=Array.from({length:P},(_,i)=>addD(from,i)),per=days.map(d=>inR(cur,d,addD(d,1)));
 const labels=days.map(fmtD),tot=per.map(x=>x.length),okd=per.map(x=>x.filter(l=>l.ok).length),msd=per.map(x=>x.length?x.reduce((a,l)=>a+l.ms,0)/x.length/1000:0);
 const mx=Math.max(50,Math.ceil(Math.max(...tot)/100)*100),tk=[0,1,2,3,4].map(i=>i*mx/4);
 const dist=Object.keys(TYPES).map(k=>({k,label:TYPES[k],v:cur.filter(l=>l.type===k).length,color:TCOL[k]}));
 const msMax=Math.max(6,Math.ceil(Math.max(...msd)));
 const last=msd[msd.length-1];
 const failToday=recent(logs).filter(l=>!l.ok&&l.t>=today);
 const nots=[];
 if(failToday.length)nots.push({c:'red',i:'!',tx:'Terdapat '+failToday.length+' permintaan gagal diproses pada '+fmtD(today)+' '+today.getFullYear()+'.',t:pad(failToday[0].t.getHours())+':'+pad(failToday[0].t.getMinutes())});
 {const tdk=assets().filter(a=>a.st==='tidak').length;if(tdk)nots.push({c:'amb',i:'!',tx:tdk+' barang DBR ditemukan tidak pada lokasinya (lihat Lokasi Aset).',t:'—'})}
 nots.push({c:c.ms/1000>D.dashboard.targetMs/1000?'amb':'grn',i:c.ms/1000>D.dashboard.targetMs/1000?'!':'✓',tx:'Rata-rata waktu respons '+(c.ms/1000>D.dashboard.targetMs/1000?'melebihi target, ':'periode ini ')+dec(c.ms/1000)+' detik.',t:pad(new Date().getHours())+':'+pad(new Date().getMinutes())});
 D.dashboard.notifications.forEach(n=>nots.push({c:n.ic==='ok'?'grn':'blu',i:n.ic==='ok'?'✓':'i',tx:n.text,t:n.time}));
 return banner('Bruno','Berikut pemantauan kinerja chatbot dan sistem.')+
 '<div class="kpis">'+kpi('💬','b','Permintaan Tercatat',num(c.n),delta(pc(c.n,p.n),true,'%',' dari periode sebelumnya'))+
 kpi('✔','g','Keberhasilan Respons',Math.round(c.rate)+'%',delta(c.rate-p.rate,true,'%',' dari periode sebelumnya'))+
 kpi('🕒','b','Rata-rata Waktu Respons',dec(c.ms/1000)+' detik',delta(pc(c.ms,p.ms),false,'%',' dari periode sebelumnya'))+
 kpi('✖','r','Permintaan Gagal',num(c.fail),delta(pc(c.fail,p.fail),false,'%',' dari periode sebelumnya'))+'</div>'+
 '<div class="g3"><div class="card"><div class="ch"><h3>Tren Permintaan Chatbot</h3>'+periodSel()+'</div><div class="leg"><span><i style="background:#2a6fdb"></i>Total permintaan</span><span><i style="background:#e5484d"></i>Permintaan berhasil</span></div>'+
  lineChart({labels,max:mx,ticks:tk,series:[{name:'Total permintaan',color:'#2a6fdb',vals:tot},{name:'Permintaan berhasil',color:'#e5484d',vals:okd}]})+'</div>'+
 '<div class="card"><div class="ch"><h3>Distribusi Jenis Permintaan</h3></div><div class="donutw" style="margin-top:14px">'+donut(dist.map(d=>({...d,label:d.label})),num(c.n),'Total permintaan',170)+'<div class="dl">'+dist.map(d=>'<div><i style="background:'+d.color+'"></i>'+d.label+'<span class="p">'+(c.n?Math.round(d.v/c.n*100):0)+'% ('+d.v+')</span></div>').join('')+'</div></div></div>'+
 '<div class="card"><div class="ch"><h3>Tren Waktu Respons</h3>'+periodSel()+'</div><div class="leg"><span><i style="background:#e5484d"></i>Rata-rata waktu respons</span><span><i style="background:#2a6fdb"></i>Target (≤ '+D.dashboard.targetMs/1000+' detik)</span></div>'+
  lineChart({labels,min:0,max:msMax,ticks:[0,2,4,6].filter(t=>t<=msMax),fmt:(v,x)=>dec(v,x?1:0)+(x?' dtk':' dtk'),target:D.dashboard.targetMs/1000,series:[{name:'Rata-rata waktu respons',color:'#e5484d',vals:msd,end:dec(last)+' dtk'}]})+'</div></div>'+
 '<div class="g3b"><div class="card"><div class="ch"><h3>Log Terakhir</h3><a href="#/log">Lihat semua →</a></div>'+logTable(recent(logs),5)+'</div>'+integCard()+
 '<div class="card"><div class="ch"><h3>🔔 Notifikasi &amp; Peringatan</h3><a href="#/log">Lihat semua →</a></div><div class="nl">'+nots.slice(0,5).map(n=>'<div class="it"><span class="dot '+n.c+'">'+n.i+'</span><span>'+esc(n.tx)+'</span><span class="t">'+n.t+'</span></div>').join('')+'</div></div></div>'+
 '<div class="note pg"><span>ℹ️ Permintaan bertanda titik hijau <span class="live"></span> berasal dari chatbot prototype yang berjalan di browser ini; sisanya data dummy (data.json).</span></div>'}

let LOGF={t:'',s:'',q:''};
function logPage(){const logs=recent(allLogs()).filter(l=>(!LOGF.t||l.type===LOGF.t)&&(!LOGF.s||String(l.ok)===LOGF.s)&&(!LOGF.q||l.ket.toLowerCase().includes(LOGF.q.toLowerCase())));
 return '<h2 class="ph">Log Chatbot</h2><p class="sub">Seluruh permintaan yang diterima chatbot. Menampilkan 200 terbaru dari '+num(logs.length)+' hasil.</p>'+
 '<div class="tools"><select data-lf="t"><option value="">Semua jenis</option>'+Object.entries(TYPES).map(([k,v])=>'<option value="'+k+'"'+(LOGF.t===k?' selected':'')+'>'+v+'</option>').join('')+'</select><select data-lf="s"><option value="">Semua status</option><option value="true"'+(LOGF.s==='true'?' selected':'')+'>Berhasil</option><option value="false"'+(LOGF.s==='false'?' selected':'')+'>Gagal</option></select><input data-lf="q" placeholder="Cari keterangan…" value="'+esc(LOGF.q)+'"><button class="btn sec2" data-act="csvlog">Unduh CSV</button></div><div class="card">'+logTable(logs,200)+'</div>'}
function integPage(){return '<h2 class="ph">Integrasi Data</h2><p class="sub">Sumber: <code>'+esc(DATA_URL)+'</code> (ganti ke endpoint API saat database siap).</p><div class="g3e">'+integ().map(x=>'<div class="card"><h3>'+x[0]+'</h3><div class="kpi" style="margin-top:8px"><div class="v">'+num(x[1])+'</div><div class="d">'+x[2]+'</div></div><span class="bd '+(SRC_OK?'ok':'bad')+'">'+(SRC_OK?'Terhubung':'Terputus')+'</span></div>').join('')+'</div>'+
 '<div class="card"><h3>Sinkronisasi</h3><p>Terakhir sinkron: <b>'+(SYNC?fmtT(SYNC)+' '+SYNC.getFullYear():'-')+'</b></p><p>Booking tersimpan dari chatbot: <b>'+rd(K_BOOK,[]).length+'</b> &nbsp; Laporan lokasi aset: <b>'+rd(K_REP,[]).length+'</b> &nbsp; Log live: <b>'+rd(K_LOG,[]).length+'</b></p><button class="btn" data-act="resync">Sinkronkan sekarang</button></div>'}
function perfPage(){const logs=allLogs(),from=addD(sod(new Date()),-(PERIOD-1)),cur=inR(logs,from,addD(sod(new Date()),1)),ms=cur.map(l=>l.ms).sort((a,b)=>a-b),q=p=>ms.length?ms[Math.min(ms.length-1,Math.floor(p*ms.length))]/1000:0;
 const byH=Array(24).fill(0);cur.forEach(l=>byH[l.t.getHours()]++);const mxH=Math.max(1,...byH);
 return '<h2 class="ph">Performa Sistem</h2><p class="sub">Periode: '+periodSel()+'</p><div class="kpis">'+kpi('⚡','b','Median respons',dec(q(.5))+' dtk','')+kpi('📈','r','Persentil 95',dec(q(.95))+' dtk','')+kpi('🐢','r','Terlama',dec(q(1))+' dtk','')+kpi('✔','g','Target ≤ '+D.dashboard.targetMs/1000+' dtk',Math.round(ms.length?ms.filter(x=>x<=D.dashboard.targetMs).length/ms.length*100:0)+'%','permintaan memenuhi target')+'</div>'+
 '<div class="g2"><div class="card"><h3>Permintaan per jam</h3><svg viewBox="0 0 560 190" width="100%">'+byH.map((v,h)=>{const bh=v/mxH*140;return '<rect x="'+(h*23+6)+'" y="'+(155-bh)+'" width="17" height="'+bh+'" fill="#2a6fdb"><title>'+pad(h)+'.00: '+v+'</title></rect>'+(h%3===0?'<text x="'+(h*23+14)+'" y="175" font-size="10" fill="#6b7686" text-anchor="middle">'+pad(h)+'</text>':'')}).join('')+'</svg></div>'+
 '<div class="card"><h3>Kegagalan per jenis</h3><div class="tw"><table><thead><tr><th>Jenis</th><th>Total</th><th>Gagal</th><th>Keberhasilan</th></tr></thead><tbody>'+Object.entries(TYPES).map(([k,v])=>{const s=stats(cur.filter(l=>l.type===k));return '<tr><td>'+v+'</td><td>'+s.n+'</td><td>'+s.fail+'</td><td>'+dec(s.rate)+'%</td></tr>'}).join('')+'</tbody></table></div></div></div>'}
function settingsPage(){return '<h2 class="ph">Pengaturan</h2><div class="card"><h3>Data &amp; log lokal</h3><p>Log live, booking, dan laporan lokasi dari chatbot disimpan di localStorage browser ini.</p><button class="btn sec2" data-act="clr">Hapus log live</button> <button class="btn sec2" data-act="clrb">Reset booking dari chatbot</button> <button class="btn sec2" data-act="clrr">Hapus laporan lokasi</button> <button class="btn sec2" data-act="clrd">Reset DBR ke data.json</button></div><div class="card"><h3>Sumber data</h3><p><code>'+esc(DATA_URL)+'</code> – ubah konstanta <code>DATA_URL</code> di <code>dashboard/js/dash.js</code> (dan <code>DATA_URL</code> di <code>js/data.js</code>) ke endpoint API.</p></div>'}

// ---------- halaman: Staf UMPER ----------
function stHome(){const today=isoL(new Date()),A=assets(),stockK=Object.keys(D.stock);
 const freeU=stockK.reduce((a,k)=>a+itemFree(k,today),0),roomsOk=RM().filter(r=>roomWin(r,today)).length,perlu=A.filter(a=>a.st==='tidak').length;
 const KB=[{l:'Baik',c:'#16915a',v:A.filter(a=>/^baik/i.test(a.item.ket)).length},{l:'Rusak Ringan',c:'#f0a020',v:A.filter(a=>/ringan/i.test(a.item.ket)).length},{l:'Rusak Berat',c:'#e5484d',v:A.filter(a=>/berat/i.test(a.item.ket)).length},{l:'Belum diisi',c:'#9aa3b0',v:A.filter(a=>!a.item.ket).length}];
 const rec=A.filter(a=>a.lengkap).length,sesuai=A.filter(a=>a.st==='sesuai').length,dl=D.dashboard.deltas;
 const top=stockK.map(k=>({k,t:D.stock[k].total})).sort((a,b)=>b.t-a.t).slice(0,5).map(x=>{const f=itemFree(x.k,today);return{label:D.stock[x.k].n,a:f,b:x.t-f}});
 const rooms=['Aula','Gedung C (Dewi Sartika) - Ruang 4','Gedung C (Dewi Sartika) - Ruang 19','Isola - Auditorium'].map(n=>RM().find(r=>rl(r)===n)).filter(Boolean).map(r=>{let a=0;for(let i=0;i<7;i++)if(roomWin(r,isoL(addD(new Date(),i))))a++;return{label:r.r+(r.b.startsWith('Gedung C')?' (C)':''),a,b:7-a}});
 const now=new Date(),ml=Array.from({length:6},(_,i)=>MS[(now.getMonth()-5+i+12)%12]),kel=D.dashboard.kelengkapan.slice(0,5).concat([Math.round(rec/A.length*100)]);
 return banner('Abel','Berikut ringkasan informasi fasilitas dan inventaris kampus.')+
 '<div class="kpis">'+kpi('📦','r','Total Aset Tercatat',A.length,delta(dl.aset,true,'%',' dari bulan lalu'))+kpi('📦','r','Barang Tersedia',freeU,delta(dl.barang,true,'%',' dari bulan lalu'))+kpi('🗓️','r','Ruangan Tersedia',roomsOk,delta(dl.ruangan,true,'%',' dari bulan lalu'))+kpi('🏢','r','Ruangan DBR',DBR().rooms.length,'pada '+new Set(DBR().rooms.map(r=>r.gedung)).size+' gedung')+'</div>'+
 '<div class="sec">Menu Utama</div><div class="menu4">'+[['📦','Ketersediaan Barang','Stok total, jumlah tersedia, dan kondisi barang.','barang'],['🗓️','Ketersediaan Ruangan','Status ruangan berdasarkan tanggal dan waktu.','ruangan'],['📋','Daftar Barang Ruangan (DBR)','Kelola gedung, ruangan, dan barang di dalamnya.','dbr'],['🧾','Rekapitulasi & Laporan','Ringkasan data inventaris, ruangan, dan aset.','rekap']].map(m=>'<a class="mi" href="#/'+m[3]+'"><div class="sq">'+m[0]+'</div><div><b>'+m[1]+'</b><span>'+m[2]+'</span></div><div class="ar">›</div></a>').join('')+'</div>'+
 '<div class="sec">Grafik dan Data Utama</div><div class="g3e"><div class="card"><div class="ch"><h3>Ketersediaan Barang (Top 5)</h3><a href="#/barang">Lihat semua →</a></div><div class="leg"><span><i class="sq" style="background:#16915a"></i>Tersedia</span><span><i class="sq" style="background:#e5484d"></i>Tidak tersedia</span></div>'+hbars(top,Math.max(...top.map(x=>x.a+x.b)),'#16915a','#e5484d')+'</div>'+
 '<div class="card"><div class="ch"><h3>Status Ketersediaan Ruangan</h3><a href="#/ruangan">Lihat semua →</a></div><div class="leg"><span><i class="sq" style="background:#16915a"></i>Tersedia</span><span><i class="sq" style="background:#e5484d"></i>Tidak tersedia</span><span>(7 hari ke depan)</span></div>'+hbars(rooms,7,'#16915a','#e5484d')+'</div>'+
 '<div class="card"><div class="ch"><h3>Tren Kelengkapan Data Inventaris</h3><a href="#/rekap">Lihat detail →</a></div>'+lineChart({labels:ml,min:0,max:100,ticks:[0,25,50,75,100],fmt:v=>Math.round(v)+'%',series:[{name:'Kelengkapan',color:'#b3121f',vals:kel,area:1,end:kel[5]+'%'}]})+'</div></div>'+
 '<div class="g4"><div class="card"><div class="ch"><h3>Kelengkapan Data DBR</h3><a href="#/aset">Lihat detail →</a></div><div class="donutw">'+donut([{v:rec,color:'#16915a',label:'Data lengkap'},{v:A.length-rec,color:'#e5484d',label:'Belum lengkap'}],Math.round(rec/A.length*100)+'%','Lengkap',120)+'<div class="dl"><div><i style="background:#16915a"></i>Data lengkap<span class="p">'+rec+'</span></div><div><i style="background:#e5484d"></i>Belum lengkap<span class="p">'+(A.length-rec)+'</span></div></div></div></div>'+
 '<div class="card"><div class="ch"><h3>Kondisi Barang DBR</h3><a href="#/dbr">Lihat semua →</a></div><div class="donutw">'+donut(KB.map(x=>({v:x.v,color:x.c,label:x.l})),Math.round(KB[0].v/Math.max(1,A.length)*100)+'%','Kondisi baik',120)+'<div class="dl">'+KB.map(x=>'<div><i style="background:'+x.c+'"></i>'+x.l+'<span class="p">'+x.v+'</span></div>').join('')+'</div></div></div>'+
 integCard()+'<div class="card"><div class="ch"><h3>Log Terakhir</h3></div><div class="tw"><table><thead><tr><th>Waktu</th><th>Jenis</th><th>Status</th></tr></thead><tbody>'+recent(allLogs()).slice(0,5).map(l=>'<tr><td>'+fmtT(l.t)+'</td><td>Permintaan</td><td>'+typeBadge(l)+'</td></tr>').join('')+'</tbody></table></div></div></div>'}
let DSEL=isoL(new Date());
// Kartu "Atur Ketersediaan" (tampilan Staf UMPER / admin): nonaktifkan barang atau ruangan pada rentang tanggal.
function blockCard(kind){const opts=kind==='room'?RM().map(r=>[rl(r).toLowerCase(),rl(r)]):Object.entries(D.stock).map(([k,s])=>[k,s.n]),name=Object.fromEntries(opts),list=BLK().filter(b=>b.kind===kind),tgl=s=>s?fmtD(new Date(s+'T00:00:00')):'';
 return '<div class="card" style="margin-top:16px"><h3>Atur Ketersediaan (Admin UMPER)</h3><p>Ketersediaan dihitung otomatis dari data reservasi. Gunakan form ini hanya untuk menonaktifkan '+(kind==='room'?'ruangan':'barang')+' secara manual (mis. perbaikan atau kegiatan khusus).</p>'+
 '<form data-blk-form="'+kind+'" class="tools"><select name="tgt">'+opts.map(o=>'<option value="'+esc(o[0])+'">'+esc(o[1])+'</option>').join('')+'</select><label>Mulai: <input type="date" name="from" value="'+DSEL+'" required></label><label>Sampai: <input type="date" name="to"></label><input type="text" name="note" placeholder="Alasan (opsional)"><button class="btn" type="submit">Nonaktifkan</button></form>'+
 (list.length?'<div class="tw"><table><thead><tr><th>'+(kind==='room'?'Ruangan':'Barang')+'</th><th>Periode</th><th>Alasan</th><th></th></tr></thead><tbody>'+list.map(b=>'<tr><td>'+esc(name[b.key]||b.key)+'</td><td>'+tgl(b.from)+(b.to?' – '+tgl(b.to):' dan seterusnya')+'</td><td>'+esc(b.note||'-')+'</td><td><button class="btn" data-act="unblk" data-id="'+esc(b.id)+'">Aktifkan kembali</button></td></tr>').join('')+'</tbody></table></div>':'<p class="sub">Tidak ada yang dinonaktifkan manual.</p>')+'</div>'}
const dateTool=()=>'<div class="tools"><label>Tanggal: <input type="date" data-date value="'+DSEL+'"></label></div>';
function barangPage(){const A=assets();return '<h2 class="ph">Ketersediaan Barang</h2><p class="sub">Stok total, jumlah tersedia, dan kondisi barang pada tanggal terpilih.</p>'+dateTool()+'<div class="tw"><table><thead><tr><th>Barang</th><th>Stok total</th><th>Dipinjam</th><th>Tersedia</th><th>Kondisi</th><th>Lokasi simpan</th><th>Status</th></tr></thead><tbody>'+Object.entries(D.stock).map(([k,s])=>{const f=itemFree(k,DSEL);return '<tr><td>'+s.n+'</td><td>'+s.total+'</td><td>'+(s.total-f)+'</td><td>'+f+'</td><td>'+s.cond+'</td><td>'+esc(D.home[k]||'-')+'</td><td><span class="bd '+(f>0?'ok':'bad')+'">'+(f>0?'Tersedia':isBlk('item',k,DSEL)?'Dinonaktifkan admin':'Tidak tersedia')+'</span></td></tr>'}).join('')+'</tbody></table></div>'+blockCard('item')}
function ruanganPage(){return '<h2 class="ph">Ketersediaan Ruangan</h2><p class="sub">Status ruangan berdasarkan tanggal dan jam layanan.</p>'+dateTool()+'<div class="tw"><table><thead><tr><th>Gedung</th><th>Ruangan</th><th>Lantai</th><th>Status</th><th>Jam tersedia</th><th>Keterangan</th></tr></thead><tbody>'+RM().map(r=>{const w=roomWin(r,DSEL);const why=!roomFree(r,DSEL)?(isBlk('room',rl(r).toLowerCase(),DSEL)?'Dinonaktifkan admin UMPER':'Sudah dipesan'):dow(DSEL)===0?'Libur kampus (Minggu)':'';return '<tr><td>'+esc(r.b)+'</td><td>'+esc(r.r)+'</td><td>'+r.f+'</td><td><span class="bd '+(w?'ok':'bad')+'">'+(w?'Tersedia':'Tidak tersedia')+'</span></td><td>'+(w?hh(w[0])+' - '+hh(w[1])+' WIB':'-')+'</td><td>'+why+'</td></tr>'}).join('')+'</tbody></table></div>'+blockCard('room')}
let AF='';
function asetPage(){const A=assets().filter(a=>!AF||a.st===AF);const lab={sesuai:['ok','Sesuai'],tidak:['bad','Tidak sesuai'],belum:['gr','Belum tercatat']};
 return '<h2 class="ph">Lokasi Asset (DBR)</h2><p class="sub">Lokasi resmi menurut DBR dibandingkan laporan terakhir dari chatbot /lacak.</p><div class="tools"><select data-af><option value="">Semua status</option>'+Object.entries(lab).map(([k,v])=>'<option value="'+k+'"'+(AF===k?' selected':'')+'>'+v[1]+'</option>').join('')+'</select></div><div class="tw"><table><thead><tr><th>Kode</th><th>Nama barang</th><th>Lokasi resmi (DBR)</th><th>Terakhir terlihat</th><th>Status</th></tr></thead><tbody>'+A.map(a=>'<tr><td>'+a.code+'</td><td>'+esc(a.name)+'</td><td>'+esc(a.home||'-')+'</td><td>'+esc(a.seen||'-')+'</td><td><span class="bd '+lab[a.st][0]+'">'+lab[a.st][1]+'</span></td></tr>').join('')+'</tbody></table></div>'}
function dbrPage(){const A=assets(),g={};A.filter(a=>a.home).forEach(a=>(g[a.home]=g[a.home]||[]).push(a));
 return '<h2 class="ph">Daftar Barang Ruangan (DBR)</h2><p class="sub">Barang yang seharusnya berada di setiap ruangan.</p><div class="g2">'+Object.entries(g).sort().map(([h,l])=>'<div class="card"><h3>'+esc(h)+' <span class="bd gr">'+l.length+'</span></h3><div class="tw" style="margin-top:8px"><table><tbody>'+l.map(a=>'<tr><td>'+a.code+'</td><td>'+esc(a.name)+'</td><td>'+(a.st==='tidak'?'<span class="bd bad">Tidak sesuai</span>':'<span class="bd ok">Sesuai</span>')+'</td></tr>').join('')+'</tbody></table></div></div>').join('')+'</div>'}
function rekapPage(){const A=assets(),rec=A.filter(a=>a.lengkap).length;
 return '<h2 class="ph">Rekapitulasi &amp; Laporan</h2><div class="kpis">'+kpi('📦','r','Jenis barang',Object.keys(D.stock).length,'')+kpi('🗓️','r','Ruangan terdaftar',RM().length,'')+kpi('📍','r','Aset tercatat',A.length,'')+kpi('✅','g','Kelengkapan data',Math.round(rec/A.length*100)+'%','')+'</div><div class="card"><h3>Unduh laporan</h3><p>Unduh data dalam format CSV (dapat dibuka di Excel).</p><button class="btn" data-act="csvaset">Aset &amp; lokasi</button> <button class="btn" data-act="csvstok">Stok barang</button> <button class="btn" data-act="csvlog">Log chatbot</button></div>'}

// ---------- router ----------
const NAV={it:[['beranda','🏠','Beranda'],['log','💬','Log Chatbot'],['aset','📍','Lokasi Aset (DBR)'],['integrasi','🔗','Integrasi Data'],['performa','📊','Performa Sistem'],['pengaturan','⚙️','Pengaturan']],
 staff:[['beranda','🏠','Beranda'],['barang','📦','Ketersediaan Barang'],['ruangan','🗓️','Ketersediaan Ruangan'],['reservasi','📝','Reservasi'],['dbr','📋','Daftar Barang Ruangan (DBR)'],['rekap','🧾','Rekapitulasi & Laporan'],['pengaturan','⚙️','Pengaturan']]};
const PAGES={it:{beranda:itHome,log:logPage,aset:()=>asetPage(),integrasi:integPage,performa:perfPage,pengaturan:settingsPage},staff:{beranda:stHome,barang:barangPage,ruangan:ruanganPage,aset:asetPage,dbr:dbrPage,rekap:rekapPage,pengaturan:settingsPage}};
const cur=()=>{const p=(location.hash.replace('#/','')||'beranda').split('/')[0];return PAGES[ROLE][p]?p:'beranda'};
function render(){if(!D)return;sync();const p=cur();
 $('#uname').textContent=({it:'Bruno',staff:'Abel',pimpinan:'Pimpinan'})[ROLE]||'Abel';$('#urole').textContent=({it:'Tim IT',staff:'Staf UMPER',pimpinan:'Kepala UMPER'})[ROLE]||'Staf UMPER';
 $('#nav').innerHTML=NAV[ROLE].map(n=>'<a href="#/'+n[0]+'" class="'+(n[0]===p?'on':'')+'"><span class="i">'+n[1]+'</span>'+n[2]+'</a>').join('');
 $('#umenu').innerHTML='<div class="h">Tampilkan sebagai</div><button data-role="it" class="'+(ROLE==='it'?'on':'')+'">Tim IT – Bruno</button><button data-role="staff" class="'+(ROLE==='staff'?'on':'')+'">Staf UMPER – Abel</button><button data-role="pimpinan" class="'+(ROLE==='pimpinan'?'on':'')+'">Pimpinan – Kepala UMPER</button>';
 $('#today').textContent=fmtFull(new Date());
 const y=window.scrollY;$('#pg').innerHTML=PAGES[ROLE][p]();window.scrollTo(0,y);sig=signature()}
const signature=()=>BLK().length+'|'+rd(K_LOG,[]).length+'|'+rd(K_BOOK,[]).length+'|'+rd(K_REP,[]).length;
function csv(name,rows){const t='﻿'+rows.map(r=>r.map(c=>'"'+String(c==null?'':c).replace(/"/g,'""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([t],{type:'text/csv'}));a.download=name;a.click()}
document.addEventListener('click',async e=>{const t=e.target.closest('[data-role],[data-act],#ubtn,#burger,#out');
 if(!t){$('#umenu').classList.remove('show');return}
 if(t.id==='ubtn'){$('#umenu').classList.toggle('show');return}
 if(t.id==='burger'){$('#sb').classList.toggle('open');return}
 if(t.id==='out'){alert('Prototype: belum ada autentikasi.');return}
 if(t.dataset.role){ROLE=t.dataset.role;try{localStorage.setItem(K_ROLE,ROLE)}catch(x){}$('#umenu').classList.remove('show');location.hash='#/beranda';render();return}
 const a=t.dataset.act;
 if(a==='resync'){await load();render()}
 if(a==='unblk')saveBLK(BLK().filter(b=>b.id!==t.dataset.id));
 if(a==='clr'){localStorage.removeItem(K_LOG);render()}
 if(a==='clrb'){localStorage.removeItem(K_BOOK);render()}
 if(a==='clrr'){localStorage.removeItem(K_REP);render()}
 if(a==='csvlog')csv('log-chatbot.csv',[['Waktu','Jenis','Status','Waktu respons (ms)','Keterangan']].concat(allLogs().map(l=>[l.t.toISOString(),TYPES[l.type],l.ok?'Berhasil':'Gagal',l.ms,l.ket])));
 if(a==='csvaset')csv('aset-dbr.csv',[['Kode','Nama','Lokasi resmi','Terakhir terlihat','Status']].concat(assets().map(x=>[x.code,x.name,x.home||'',x.seen||'',x.st])));
 if(a==='csvstok')csv('stok-barang.csv',[['Barang','Stok total','Kondisi']].concat(Object.values(D.stock).map(s=>[s.n,s.total,s.cond])))});
document.addEventListener('change',e=>{const t=e.target;
 if(t.matches('[data-period]')){PERIOD=+t.value;render()}
 else if(t.matches('[data-lf]')){LOGF[t.dataset.lf]=t.value;render()}
 else if(t.matches('[data-af]')){AF=t.value;render()}
 else if(t.matches('[data-date]')&&t.value){DSEL=t.value;render()}});
document.addEventListener('input',e=>{const t=e.target;if(t.matches('[data-lf="q"]')){LOGF.q=t.value;const pos=t.selectionStart;render();const n=$('[data-lf="q"]');n.focus();n.setSelectionRange(pos,pos)}});
window.addEventListener('hashchange',()=>{$('#sb').classList.remove('open');render()});
window.addEventListener('storage',()=>{if(signature()!==sig)render()});
setInterval(()=>{if(D&&signature()!==sig&&!document.activeElement.matches('input,select'))render()},4000);
load().then(ok=>{if(ok)render()});
window.addEventListener('siumper-cloud',()=>{if(D&&!document.activeElement.matches('input,select,textarea'))render()});
document.addEventListener('submit',e=>{const f=e.target;if(!f.matches('[data-blk-form]'))return;e.preventDefault();const g=n=>f.elements[n].value.trim(),from=g('from'),to=g('to');
 if(!from)return alert('Isi tanggal mulai.');if(to&&to<from)return alert('Tanggal akhir harus sama atau setelah tanggal mulai.');
 saveBLK(BLK().concat({id:'BLK-'+Date.now(),kind:f.dataset.blkForm,key:g('tgt'),from,to,note:g('note'),at:new Date().toISOString()}))});
