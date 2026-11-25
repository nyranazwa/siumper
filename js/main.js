// Penanganan input pengguna (teks, tombol, unggah file) dan inisialisasi.
// ---------- INPUT ----------
function handle(t){t=t.trim();if(!t)return;me(t);const c=t.toLowerCase();if(S.inMenu&&(c==='/ruangan'||c==='/barang')){S.inMenu=false;return resForm(c==='/ruangan'?'room':'item')}if(c[0]==='/'){S.inMenu=false;S.draft=null;S.nlpEdit=false}
const cmd={'/start':start,'/cek':cek,'/reservasi':reservasi,'/ruangan':ruangan,'/barang':barang,'/status':statusCmd};
 if((c==='batal'||c==='/batal')&&['resText','confirm','spj'].includes(S.st)){S.inMenu=false;return cancelRes()}
 if(cmd[c])return cmd[c]();
 const legacy=()=>({cekRoom:doCekRoom,cekItem:doCekItem,resText:doRes,spj:()=>bot('Unggah SPJ dan SIK lewat kartu unggah di atas (tombol "Pilih file") atau tombol 📎, lalu tekan Kirim berkas.')}[S.st]||(()=>bot('Perintah tidak dikenali. Gunakan /start untuk melihat menu.')))(t);
 if(nlpOn()&&NLP_STATES.includes(S.st))return nlpHandle(t,legacy);
 return legacy()}
document.getElementById('f').onsubmit=e=>{e.preventDefault();const v=inp.value;inp.value='';handle(v)};
document.getElementById('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 if(S.st==='spj'){if(!S.upCard)return;const k=S.upCard.add(f);me('📎 '+f.name+(k?' → '+k.toUpperCase():''));if(!k)bot('SPJ dan SIK sudah terisi. Tekan "Kirim berkas" untuk melanjutkan.')}
 else{me('📎 '+f.name);bot('Kirim file hanya saat unggah SPJ dan SIK pada /reservasi.')}};
const ch=document.getElementById('chips');['/Start','/Cek','/Reservasi','/Status'].forEach(c=>{const b=document.createElement('button');b.textContent=c;b.onclick=()=>{S.inRes=false;handle(c)};ch.appendChild(b)});
const tb=document.getElementById('theme'),root=document.documentElement;
const paintTheme=()=>{tb.textContent=root.dataset.theme==='dark'?'☀️':'🌙'};paintTheme();
tb.onclick=()=>{const t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;try{localStorage.setItem('siumper-theme',t)}catch(e){}paintTheme()};
if(window.visualViewport){const A=document.getElementById('app'),fit=()=>{A.style.height=visualViewport.height+'px'};visualViewport.addEventListener('resize',fit);fit()}
loadData().then(()=>{add('day','Hari ini');setTimeout(()=>handle('/Start'),200);setTimeout(remindTick,2500);setInterval(remindTick,3000);window.addEventListener('siumper-cloud',remindTick)});
