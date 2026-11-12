// Sinkronisasi realtime chatbot <-> dashboard lewat Firebase Firestore.
// Dimuat PALING AWAL (sebelum script aplikasi) di index.html dan dashboard/index.html.
// Cara kerja: aplikasi tetap memakai localStorage seperti sebelumnya; file ini mencerminkan
// kunci 'siumper-*' ke Firestore dan menerapkan perubahan dari device lain kembali ke localStorage.
// Jika Firebase gagal dimuat (offline), aplikasi tetap jalan secara lokal.
(function(){
 if(!window.firebase){console.warn('[cloud] Firebase SDK tidak termuat, mode lokal saja');return}
 firebase.initializeApp({
  apiKey:"AIzaSyBmC0uKXyFiJWLf_mJdLyhozoVERx6XOns",
  authDomain:"siumper.firebaseapp.com",
  projectId:"siumper",
  storageBucket:"siumper.firebasestorage.app",
  messagingSenderId:"980916954184",
  appId:"1:980916954184:web:388537daa2cac0e502647d"
 });
 const db=firebase.firestore();
 const ls=window.localStorage,P=Storage.prototype,_set=P.setItem,_rem=P.removeItem;
 const KV=['siumper-dbr','siumper-res','siumper-bookings','siumper-block']; // satu dokumen per kunci (terakhir menang)
 const COL={'siumper-log':{name:'log',max:1000},'siumper-reports':{name:'reports',max:300}}; // satu dokumen per entri
 const warn=e=>{console.warn('[cloud]',e&&e.message||e);try{rawSet('siumper-syncfail',String((+ls.getItem('siumper-syncfail')||0)+1))}catch(x){}};
 const touch=()=>{try{rawSet('siumper-lastsync',new Date().toISOString())}catch(x){}};
 const fire=()=>window.dispatchEvent(new Event('siumper-cloud'));
 const rawSet=(k,v)=>_set.call(ls,k,v),rawDel=k=>_rem.call(ls,k);
 const canon=e=>JSON.stringify(Object.keys(e).sort().map(k=>[k,e[k]]));
 const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=((h*33)^s.charCodeAt(i))>>>0;return h.toString(36)+s.length.toString(36)};
 const eid=e=>hash(canon(e));
 const parse=v=>{try{const a=JSON.parse(v);return Array.isArray(a)?a:[]}catch(e){return[]}};
 const seen={},ready={};
 for(const k in COL)seen[k]=new Set();

 // ---------- tulis ke Firestore ketika aplikasi menulis localStorage ----------
 P.setItem=function(k,v){_set.call(this,k,v);if(this===ls)push(k,v)};
 P.removeItem=function(k){_rem.call(this,k);if(this===ls)drop(k)};
 function push(k,v){
  if(KV.includes(k)){db.collection('kv').doc(k).set({v:String(v),ts:Date.now()}).catch(warn);return}
  const c=COL[k];if(!c)return;
  ready[k].then(()=>{
   const fresh=parse(v).filter(e=>e&&!seen[k].has(eid(e)));
   upload(c.name,k,fresh)
  })
 }
 function upload(name,k,list){
  for(let i=0;i<list.length;i+=400){
   const b=db.batch();
   list.slice(i,i+400).forEach(e=>{const id=eid(e);seen[k].add(id);b.set(db.collection(name).doc(id),e)});
   b.commit().catch(warn)
  }
 }
 function drop(k){
  if(KV.includes(k)){db.collection('kv').doc(k).delete().catch(warn);return}
  const c=COL[k];if(!c)return;
  seen[k].clear();
  db.collection(c.name).get().then(s=>{
   for(let i=0;i<s.docs.length;i+=400){const b=db.batch();s.docs.slice(i,i+400).forEach(d=>b.delete(d.ref));b.commit().catch(warn)}
  }).catch(warn)
 }

 // ---------- dengarkan perubahan dari device lain ----------
 KV.forEach(k=>{
  let first=true;
  db.collection('kv').doc(k).onSnapshot(s=>{
   touch();
   if(s.metadata.hasPendingWrites)return; // gema dari tulisan sendiri
   const had=first;first=false;
   if(s.exists){const v=s.data().v;if(ls.getItem(k)!==v){rawSet(k,v);fire()}}
   else if(had){const local=ls.getItem(k);if(local!=null)push(k,local)} // database masih kosong: unggah data lokal sebagai awal
   else if(ls.getItem(k)!=null){rawDel(k);fire()} // dihapus dari device lain
  },warn)
 });
 Object.keys(COL).forEach(k=>{
  const c=COL[k];let first=true,res;ready[k]=new Promise(r=>res=r);
  db.collection(c.name).orderBy('t','desc').limit(c.max).onSnapshot(s=>{
   touch();
   const remote=s.docs.map(d=>{seen[k].add(d.id);return d.data()});
   let list=remote;
   if(first){ // gabungkan entri lokal lama yang belum ada di database
    const miss=parse(ls.getItem(k)).filter(e=>e&&e.t&&!seen[k].has(eid(e)));
    if(miss.length){upload(c.name,k,miss);list=remote.concat(miss).sort((a,b)=>a.t<b.t?1:-1).slice(0,c.max)}
   }
   const arr=list.slice().reverse(),json=JSON.stringify(arr);
   if(ls.getItem(k)!==json&&(arr.length||ls.getItem(k)!=null)){rawSet(k,json);if(!first)fire()}
   if(first){first=false;res();fire()}
  },e=>{warn(e);if(first){first=false;res()}})
 });
})();
