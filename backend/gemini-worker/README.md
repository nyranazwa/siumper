# Proxy Gemini untuk chatbot SiUMPER

Chatbot mengirim pesan bebas mahasiswa ke proxy ini, proxy meminta Gemini mengubahnya jadi data terstruktur
(maksud, ruangan, barang, tanggal, jam, nama, NIM/NIP, organisasi, keperluan). **API key hanya ada di proxy**, tidak pernah ke browser.
Gemini hanya *memahami* pesan; tersedia/tidak, bentrok, jam layanan, dan tanggal lewat tetap dicek oleh chatbot dari data.

## Pasang di Cloudflare Workers (gratis)
1. Buat API key di https://aistudio.google.com/apikey
2. Di folder ini:
   ```
   npx wrangler login
   npx wrangler secret put GEMINI_API_KEY      # tempel key-nya
   npx wrangler deploy
   ```
3. Salin alamat hasil deploy (mis. `https://siumper-gemini.<akun>.workers.dev`) ke `js/nlp-config.js`:
   ```js
   window.SIUMPER_NLP_URL='https://siumper-gemini.<akun>.workers.dev';
   ```
4. Jika situs bukan `https://nyranazwa.github.io`, ubah `ALLOWED_ORIGINS` di `wrangler.toml`.

Model default `gemini-2.5-flash` (ubah lewat `GEMINI_MODEL` di `wrangler.toml`).

## Uji di laptop tanpa Cloudflare
```
GEMINI_API_KEY=xxxx node backend/gemini-worker/dev-server.mjs     # http://localhost:8787
```
lalu isi `window.SIUMPER_NLP_URL='http://localhost:8787'` dan buka chatbot lewat `python3 -m http.server 8000`.

## Perlindungan bawaan
- Hanya origin dalam `ALLOWED_ORIGINS` yang dilayani (browser lain ditolak 403).
- Pesan dipotong 600 karakter, daftar ruangan/barang maksimal 300 entri.
- Jawaban Gemini dipaksa berformat JSON sesuai skema; maksud yang tidak dikenal ditolak.
- Pesan pengguna diperlakukan sebagai data, bukan instruksi (melawan prompt injection).
- Belum ada pembatasan laju (rate limit). Sebelum dipakai umum, tambahkan di Cloudflare (WAF rate limiting) agar biaya tidak membengkak.

## Privasi
Pesan (termasuk nama dan NIM/NIP bila diketik) dikirim ke Gemini API untuk diproses. Pertimbangkan itu sebelum peluncuran
dan jelaskan di pesan /start bila diperlukan.
