# Cara Kerja Tracker

Halaman ini menjelaskan bagaimana aplikasi merekam aktivitasmu di balik layar, baik di mode Auto maupun Manual.

---

## Mode Auto

### Alur kerja saat sesi aktif

Setelah kamu menekan **Start Session**, aplikasi bekerja dalam siklus berulang setiap **5 menit**:

1. Aplikasi mengambil screenshot layarmu secara otomatis
2. Screenshot dikirim ke server
3. AI menganalisis screenshot dan mengidentifikasi aktivitas yang sedang kamu lakukan
4. Data aktivitas diperbarui di halaman utama
5. Timer mulai menghitung mundur 5 menit untuk pengambilan berikutnya

Siklus ini terus berulang selama sesi berjalan.

### Jika analisis AI gagal

Setelah screenshot diterima server, AI akan mencoba menganalisisnya. Jika analisis gagal, server secara otomatis mencoba ulang dengan model AI yang lebih canggih — sampai tiga kali percobaan.

Jika semua percobaan gagal, screenshot tetap disimpan dengan catatan bahwa analisis tidak berhasil, namun **waktu tersebut tetap dihitung sebagai jam kerja aktif**.

Selain itu, jika layarmu tidak berubah selama beberapa screenshot berturut-turut (misalnya kamu meninggalkan komputer tanpa menguncinya), sistem akan mendeteksi ini sebagai kondisi **idle** dan mencatatnya sebagai waktu tidak aktif, bukan waktu kerja.

### Jika pengiriman screenshot gagal

Aplikasi akan mencoba ulang hingga **3 kali** dengan jeda 5 detik tiap percobaan. Jika setelah 3 kali masih gagal, timer capture berhenti dan muncul notifikasi error. Sesi kerja di server masih tercatat aktif, tapi aplikasi tidak lagi mengambil screenshot secara otomatis. Untuk melanjutkan, lakukan **hard-restart** aplikasi dengan menekan **CTRL + F5**, lalu tekan **Start Session** kembali.

Jika pengiriman terlalu lama (lebih dari 30 detik), screenshot tersebut tidak tersimpan tetapi timer tetap berjalan dan muncul notifikasi peringatan — sesi tidak berhenti.

### Sesi berakhir otomatis

Server memeriksa setiap 5 menit apakah ada sesi yang sudah tidak aktif. Jika dalam **15 menit terakhir tidak ada screenshot yang masuk**, server akan mengakhiri sesimu secara otomatis.

Ini bisa terjadi jika misalnya:
- Komputer sleep atau terkunci
- Koneksi internet terputus cukup lama
- Aplikasi tidak berjalan di latar belakang

Jika sesimu berakhir otomatis, kamu perlu menekan **Start Session** lagi untuk memulai sesi baru.

### Sesi dilanjutkan saat aplikasi dibuka ulang

Jika kamu menutup aplikasi tanpa menekan **Stop Session**, sesi tetap tercatat sebagai aktif di server. Saat aplikasi dibuka kembali, sesi akan dilanjutkan otomatis dan badge **"Session resumed automatically"** akan muncul sebentar.

---

## Mode Manual

### Alur kerja

1. Klik **Upload Image** di halaman utama
2. Pilih **slot jam** yang ingin kamu isi — misalnya `09 s/d 10` untuk jam 09.00–10.00
3. Unggah minimal **8 screenshot** untuk slot tersebut
4. Klik **Submit**
5. Screenshot dikirim ke server dan dianalisis oleh AI

Slot jam hanya bisa dipilih jika jamnya sudah berlalu. Kamu tidak bisa mengisi slot untuk jam yang belum terjadi.

### Kenapa minimal 8 screenshot?

Agar hasil analisis AI cukup representatif untuk menggambarkan aktivitas selama satu jam penuh. Semakin banyak screenshot yang diunggah, semakin akurat rekaman aktivitasnya.

### Validasi screenshot oleh AI

Setiap screenshot yang kamu unggah akan divalidasi oleh AI sebelum disimpan. AI membaca jam yang tertera di taskbar (bilah bawah layar) untuk memastikan screenshot tersebut memang diambil pada jam yang sesuai dengan slot yang kamu pilih.

Jika **satu saja** screenshot tidak lolos validasi — misalnya jam tidak terbaca atau jam tidak sesuai slot — maka **seluruh batch dibatalkan** dan kamu perlu mengunggah ulang.

Agar proses ini lebih andal, kamu bisa memberi nama file screenshot dengan format berikut sebagai cadangan jika AI gagal membaca jam dari gambar:

```
YYYY-MM-DD_HH-mm-ss.jpg
Contoh: 2025-06-26_08-30-00.jpg
```

Dengan nama file berformat ini, sistem bisa membaca jam dari nama file secara langsung tanpa bergantung pada taskbar.

---

## Pemrosesan data harian

Beberapa data di halaman utama tidak langsung tersedia, karena diproses oleh server secara terjadwal:

| Data | Kapan tersedia |
|---|---|
| Ringkasan per sesi (Session Timeline) | Diproses setiap jam (hanya di lingkungan produksi) |
| AI Daily Insight | Diproses setiap hari pukul 22.00 — tersedia keesokan harinya |
| Activity Breakdown per kategori | Diproses setiap hari pukul 23.00 |
| Total waktu kerja di laporan absensi | Dihitung setiap hari pukul 01.00 dini hari |

Karena itu, **AI Daily Insight untuk hari ini tidak akan muncul** — data baru tersedia setelah melewati pukul 22.00 malam dan kamu melihatnya di hari berikutnya.
