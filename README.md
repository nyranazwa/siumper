# SiUMPER – Prototype Chatbot Telegram

Simulasi chatbot Telegram untuk cek ketersediaan ruangan/barang, reservasi, dan pelacakan barang lewat stiker DBR.
Murni HTML + CSS + JavaScript (tanpa build, tanpa dependensi).

## Cara menjalankan di Visual Studio Code

**Opsi 1 – Live Server (paling mudah)**
1. Buka folder ini di VS Code (`File > Open Folder`).
2. Pasang ekstensi **Live Server** (`ritwickdey.LiveServer`, VS Code akan menyarankannya otomatis).
3. Klik kanan `index.html` → **Open with Live Server**.

**Opsi 2 – Terminal VS Code**
- Python: `python -m http.server 5500` lalu buka http://localhost:5500
- Node.js: `npm start` lalu buka http://localhost:5500

Membuka `index.html` langsung (double-click) juga bisa.

## Struktur
```
index.html        kerangka halaman
css/style.css     tampilan (mendukung mode terang/gelap)
js/data.js        data dummy + pengaturan DEMO
js/helpers.js     helper, parsing tanggal, cek ketersediaan, form isian
js/flows.js       alur bot (/cek, /reservasi, /kode, /lacak)
js/main.js        input pengguna & inisialisasi
```
Urutan pemuatan skrip di `index.html` penting (data → helpers → flows → main).

## Perintah bot
`/start` `/cek` (`/ruangan`, `/barang`) `/reservasi` `/kode` `/lacak`

## Catatan
- **Data masih dummy** (js/data.js): gedung, ruangan per lantai, jam tersedia, stok, kode DBR.
- **DEMO** di js/data.js: `const DEMO={items:['mic wireless'],rooms:['Aula']}` membuat Mic Wireless dan Aula selalu "tidak tersedia".
  Kosongkan array-nya setelah database tersedia.
- **OCR stiker DBR belum nyata**: foto diterima, lalu kode dibaca dari nama file (mis. `DBR-2026-0101.jpg`) atau diketik/dipilih.
- Ini simulasi di browser, bukan bot Telegram sungguhan. Untuk bot asli, logika di `flows.js` dapat dipindahkan ke backend
  (mis. Node + grammY atau Python + python-telegram-bot) dengan data dari database.
