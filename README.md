# SiUMPER – Chatbot prototype + Dashboard

Jalankan dari folder ini (harus lewat server, bukan klik dua kali):

    python3 -m http.server 8000
    # chatbot   : http://localhost:8000/index.html
    # dashboard : http://localhost:8000/dashboard/index.html   (buka lewat alamat langsung; tidak ada tombol di chatbot)

## Integrasi
- Ruangan chatbot = ruangan DBR (satu sumber). Menambah gedung/ruangan di dashboard otomatis muncul di chatbot.
- Data dummy: `data.json` (dibuat oleh `node tools/gen-data.js`). Dibaca chatbot (`js/data.js`) dan dashboard.
- `js/logger.js` mencatat tiap permintaan chatbot (jenis, berhasil/gagal, waktu respons), dan booking yang disetujui ke localStorage. Dashboard membaca data itu (otomatis refresh), digabung dengan seed log 28 hari di data.json.
- Menu "Daftar Barang Ruangan (DBR)" (Staf UMPER): Daftar Gedung -> Rincian Gedung (daftar ruangan) -> Rincian Barang (Kelola Rincian Barang DBR). Kode stiker unik per barang.
- Menu "Reservasi" (Staf UMPER): daftar peminjaman ruangan dan barang. Chatbot mengirim reservasi berstatus Diproses, Admin menyetujui di dashboard (atau tombol simulasi di chatbot).
- Dashboard punya dua tampilan: Tim IT (Bruno) dan Staf UMPER (Abel), ganti lewat menu profil kanan atas.
- Untuk database/API nyata: ganti `DATA_URL` di `js/data.js` dan `dashboard/js/dash.js`; log bisa dikirim lewat fungsi `rec()` di `js/logger.js`.

## Revisi sesuai catatan dosen
- Daftar Gedung menampilkan **Jumlah Ruangan** (bukan lantai); Rincian Gedung punya kolom **Lokasi Lantai**, dan form Tambah/Ubah Ruangan punya pilihan **Lokasi Lantai** (Lantai 1-8).
- **Keterangan** barang DBR berupa pilihan: Baik, Rusak Ringan, Rusak Berat (tampil sebagai badge; beranda Staf memisahkan Rusak Ringan dan Rusak Berat).
- Barang/ruangan yang ditambah di dashboard langsung dikenali chatbot tanpa reload; chatbot juga menampilkan "Kondisi" barang.
- Persetujuan reservasi hanya lewat dashboard (tombol "Verifikasi (Setujui)" / "Tolak"). Tombol simulasi di chatbot dihapus; chatbot baru mengirim jawaban setelah Staf UMPER memverifikasi.
- Tambah Gedung meminta **Nama Gedung, Jumlah Lantai, dan Jumlah Ruangan**; ruangan dibuat otomatis dan dibagi rata per lantai. Tambah Ruangan memilih **Lokasi Lantai** sesuai jumlah lantai gedung.
- Stok barang = stok dasar + barang DBR: barang DBR bernama baru otomatis menjadi jenis barang di Ketersediaan Barang, form reservasi, dan chatbot (total = jumlah semua baris DBR bernama sama). Ruangan DBR sudah otomatis ke Ketersediaan Ruangan dan chatbot.

## Fitur tambahan (masukan dosen)
- **Alasan penolakan:** tombol Tolak di dashboard (Reservasi) membuka dialog dengan dropdown alasan: *Dokumen salah / tidak lengkap*, *Keputusan mendadak dari kampus*, *Lainnya* (diisi Staf UMPER). Alasan tampil di tabel dashboard, CSV, dan dikirim ke mahasiswa lewat chatbot (juga di `/status`).
- **Batal di chatbot:** pada konfirmasi "Data sudah benar?" kini ada tombol **Kirim / Edit / Batal** (atau ketik `batal`). Batal tidak menyimpan data apa pun.
- **Status pengembalian barang:** peminjaman barang yang disetujui punya status *Dijadwalkan, Dipinjam, Terlambat, Dikembalikan* (dihitung dari tanggal selesai). Staf menandai **✓ Kembali** di Reservasi (tab Barang, ada filter belum dikembalikan/terlambat). Beranda Staf punya KPI dan tabel "Barang belum dikembalikan".
- **Pengingat ke chatbot:** `/status` menampilkan status pengajuan dan pengembalian. Chatbot mengirim pengingat otomatis H-1, hari-H, dan saat terlambat, pengingat manual dari tombol 🔔 Staf, serta kabar saat barang tercatat dikembalikan. Reservasi dianggap milik chat ini lewat `siumper-mine` (setara chat id Telegram).
  - Catatan prototype: pengingat dicek berkala selama chat terbuka. Di Telegram asli, kirim lewat backend (penjadwal harian) karena bot harus bisa mengirim lebih dulu.

## NLP dengan Gemini (ketik bebas)
- Mahasiswa bisa mengetik bebas, mis. *"pinjam mic kabel besok jam 8 sampai 10 atas nama Budi, NIM 2200123, HIMA PGSD"*. Gemini mengubahnya menjadi data terstruktur, chatbot menanyakan hanya data yang kurang, lalu menampilkan ringkasan **Kirim / Edit / Batal**. Form tetap ada sebagai cadangan.
- Gemini hanya memahami pesan. Tersedia/tidak, bentrok, dan jam layanan tetap dihitung dari data. Key Gemini disimpan di proxy (`backend/gemini-worker`), bukan di browser. Cara pasang: `backend/gemini-worker/README.md`.
- NLP **nonaktif** sampai `window.SIUMPER_NLP_URL` di `js/nlp-config.js` diisi. Jika kosong atau proxy gagal, chatbot otomatis memakai parser regex lama.
- Dashboard Tim IT: KPI "Formulir tanpa koreksi (IT-4)" kini terukur dari reservasi NLP (Kirim langsung = tanpa koreksi, Edit = dikoreksi); sebelum ada data NLP memakai data simulasi.

## Aturan tanggal
Cek dan reservasi (chatbot lewat form, teks, maupun NLP, serta form di dashboard) tidak bisa untuk tanggal sebelum hari ini. Hari ini (hari-H) boleh. Chatbot membalas pesan penolakan dan mencatatnya sebagai "Tanggal sudah lewat" di log.

## Deploy otomatis ke GitHub Pages
Setelah mengubah file, jalankan `./deploy.sh "pesan singkat"` di folder ini. Skrip akan commit dan push ke
https://github.com/nyranazwa/siumper, lalu GitHub Pages memperbarui situs dalam 1-2 menit. Pengaturan awal (sekali saja): lihat bagian bawah file `deploy.sh`.

Fitur /lacak (pelacakan barang lewat foto stiker) sudah dihapus dari chatbot dan dashboard.
