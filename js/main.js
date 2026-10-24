// Penanganan input pengguna (teks, tombol, unggah file) dan inisialisasi.
// ---------- INPUT ----------
function handle(t){t=t.trim();if(!t)return;me(t);const c=t.toLowerCase();if(S.inMenu&&(c==='/ruangan'||c==='/barang')){S.inMenu=false;return resForm(c==='/ruangan'?'room':'item')}if(c[0]==='/')S.inMenu=false;
const cmd={'/start':start,'/cek':cek,'/reservasi':reservasi,'/lacak':lacak,'/ruangan':ruangan,'/barang':barang};
 if(cmd[c])return cmd[c]();
 ({cekRoom:doCekRoom,cekItem:doCekItem,resText:doRes,spj:()=>bot('Unggah SPJ dan SIK lewat kartu unggah di atas (tombol "Pilih file") atau tombol 📎, lalu tekan Kirim berkas.'),code:found,where:doWhere}[S.st]||(()=>bot('Perintah tidak dikenali. Gunakan /start untuk melihat menu.')))(t)}
document.getElementById('f').onsubmit=e=>{e.preventDefault();const v=inp.value;inp.value='';handle(v)};
document.getElementById('file').onchange=e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 if(S.st==='foto'||S.st==='code'){if(!f.type.startsWith('image/'))return bot('⚠️ Mohon kirim foto stiker (gambar).');
  const r=new FileReader();r.onload=()=>{const m=f.name.toUpperCase().match(/DBR-\d{4}-\d{4}/);readCode(r.result,m?m[0]:null)};r.readAsDataURL(f)}
 else if(S.st==='spj'){if(!S.upCard)return;const k=S.upCard.add(f);me('📎 '+f.name+(k?' → '+k.toUpperCase():''));if(!k)bot('SPJ dan SIK sudah terisi. Tekan "Kirim berkas" untuk melanjutkan.')}
 else{me('📎 '+f.name);bot('Kirim file hanya saat diminta: /lacak (foto stiker) atau saat unggah SPJ dan SIK pada /reservasi.')}};
const ch=document.getElementById('chips');['/Start','/Cek','/Reservasi','/Lacak'].forEach(c=>{const b=document.createElement('button');b.textContent=c;b.onclick=()=>{S.inRes=false;handle(c)};ch.appendChild(b)});
const tb=document.getElementById('theme'),root=document.documentElement;
const paintTheme=()=>{tb.textContent=root.dataset.theme==='dark'?'☀️':'🌙'};paintTheme();
tb.onclick=()=>{const t=root.dataset.theme==='dark'?'light':'dark';root.dataset.theme=t;try{localStorage.setItem('siumper-theme',t)}catch(e){}paintTheme()};
if(window.visualViewport){const A=document.getElementById('app'),fit=()=>{A.style.height=visualViewport.height+'px'};visualViewport.addEventListener('resize',fit);fit()}
loadData().then(()=>{add('day','Hari ini');setTimeout(()=>handle('/Start'),200)});
