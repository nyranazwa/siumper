# SiUMPER – Chatbot prototype + Dashboard

Jalankan dari folder ini (harus lewat server, bukan klik dua kali):

    python3 -m http.server 8000
    # chatbot   : http://localhost:8000/index.html
    # dashboard : http://localhost:8000/dashboard/index.html   (buka lewat alamat langsung; tidak ada tombol di chatbot)

## Integrasi
- Ruangan chatbot = ruangan DBR (satu sumber). Menambah gedung/ruangan di dashboard otomatis muncul di chatbot.
- Data dummy: `data.json` (dibuat oleh `node tools/gen-data.js`). Dibaca chatbot (`js/data.js`) dan dashboard.
- `js/logger.js` mencatat tiap permintaan chatbot (jenis, berhasil/gagal, waktu respons), booking yang disetujui,
  dan laporan lokasi aset ke localStorage. Dashboard membaca data itu (otomatis refresh), digabung dengan seed log 28 hari di data.json.
- Menu "Daftar Barang Ruangan (DBR)" (Staf UMPER): Daftar Gedung -> Rincian Gedung (daftar ruangan) -> Rincian Barang (Kelola Rincian Barang DBR). Kode stiker unik per barang dipakai chatbot /lacak.
- Menu "Lokasi Aset (DBR)" ada di sisi Tim IT.
- Menu "Reservasi" (Staf UMPER): daftar peminjaman ruangan dan barang. Chatbot mengirim reservasi berstatus Diproses, Admin menyetujui di dashboard (atau tombol simulasi di chatbot).
- Dashboard punya dua tampilan: Tim IT (Bruno) dan Staf UMPER (Abel), ganti lewat menu profil kanan atas.
- Untuk database/API nyata: ganti `DATA_URL` di `js/data.js` dan `dashboard/js/dash.js`; log bisa dikirim lewat fungsi `rec()` di `js/logger.js`.

## Revisi sesuai catatan dosen
- Daftar Gedung menampilkan **Jumlah Ruangan** (bukan lantai); Rincian Gedung punya kolom **Lokasi Lantai**, dan form Tambah/Ubah Ruangan punya pilihan **Lokasi Lantai** (Lantai 1-8).
- **Keterangan** barang DBR berupa pilihan: Baik, Rusak Ringan, Rusak Berat (tampil sebagai badge; beranda Staf memisahkan Rusak Ringan dan Rusak Berat).
- Barang/ruangan yang ditambah di dashboard langsung dikenali chatbot (/lacak) tanpa reload; chatbot juga menampilkan "Kondisi" barang.
- Persetujuan reservasi hanya lewat dashboard (tombol "Verifikasi (Setujui)" / "Tolak"). Tombol simulasi di chatbot dihapus; chatbot baru mengirim jawaban setelah Staf UMPER memverifikasi.
- Tambah Gedung meminta **Nama Gedung, Jumlah Lantai, dan Jumlah Ruangan**; ruangan dibuat otomatis dan dibagi rata per lantai. Tambah Ruangan memilih **Lokasi Lantai** sesuai jumlah lantai gedung.
- Stok barang = stok dasar + barang DBR: barang DBR bernama baru otomatis menjadi jenis barang di Ketersediaan Barang, form reservasi, dan chatbot (total = jumlah semua baris DBR bernama sama). Ruangan DBR sudah otomatis ke Ketersediaan Ruangan dan chatbot.
