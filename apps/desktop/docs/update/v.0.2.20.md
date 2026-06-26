- Perbaiki timer yang tetap mati setelah koneksi internet bermasalah meskipun timeout guard sudah berjalan
- Perbaiki proses pencatatan log yang bisa ikut hang saat internet bermasalah

## Timer Tetap Mati Setelah Internet Hang

**Dampak untuk pengguna:** Di versi 0.2.19, sudah ada perlindungan 30 detik supaya timer tidak stuck selamanya. Tapi ternyata ada celah — setelah perlindungan itu berhasil mendeteksi masalah, timer tetap berhenti diam-diam tanpa melanjutkan countdown. Jadi pengguna menerima notifikasi timeout, tapi setelah itu timer tidak jalan lagi. Sekarang setelah notifikasi muncul, timer langsung lanjut countdown seperti biasa.

**Teknis:**
- `captureHandler` mengembalikan nilai `"cooldown"` saat timeout terjadi
- Orchestrator (`handleNativeTimerTick` dan `startAutoCapture`) tidak punya branch untuk handle `"cooldown"` → `scheduleNextCapture()` tidak dipanggil → timer berhenti
- Fix: tambah `result === "cooldown"` ke kondisi yang memanggil `scheduleNextCapture()`

## Pencatatan Log Ikut Hang Saat Internet Bermasalah

**Dampak untuk pengguna:** Ini adalah akar penyebab kenapa timer bisa stuck permanen meskipun timeout guard 30 detik sudah ada di versi 0.2.19. Setelah 30 detik upload tidak respond, aplikasi mencoba mencatat log kejadian tersebut ke server — tapi pencatatan log ini ternyata juga ikut hang tanpa batas waktu karena internet masih bermasalah. Akibatnya timer stuck selamanya di tahap pencatatan log, tidak pernah sampai ke langkah berikutnya. Sekarang pencatatan log diberi batas waktu 5 detik dan tidak akan menghentikan timer meski gagal.

**Teknis:**
- `writeLogToDb` memanggil `api.post` ke server tanpa timeout dan `throw error` ke caller
- Saat internet hang, `writeLogToDb` ikut hang → eksekusi tidak pernah sampai ke `return "cooldown"`
- Fix: tambah `timeout: 5_000` pada request log, dan ubah menjadi silent fail (tidak throw) agar log tidak pernah crash flow utama
