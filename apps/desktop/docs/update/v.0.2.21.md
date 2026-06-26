- Perbaiki timer yang mulai dari awal saat aplikasi di-refresh padahal seharusnya melanjutkan countdown

## Timer Mulai Ulang Setelah Refresh

**Dampak untuk pengguna:** Sebelumnya, jika aplikasi di-refresh atau di-restart saat timer sedang berjalan, timer akan langsung mengambil screenshot baru alih-alih melanjutkan countdown yang tersisa. Ini menyebabkan screenshot diambil terlalu cepat dan tidak sesuai jadwal. Sekarang, jika ada kondisi cooldown aktif saat resume (misalnya screenshot baru saja diambil sebelum refresh), timer melanjutkan countdown yang tersisa tanpa mengambil screenshot ulang.

**Teknis:**
- `startAutoCapture` menambahkan `result === "cooldown"` ke kondisi yang memanggil `scheduleNextCapture()`
- Akibatnya saat resume dan `captureHandler` return `"cooldown"` (karena throttle 422), `scheduleNextCapture()` ikut dipanggil dan me-reset countdown ke 5 menit penuh
- Padahal saat `"cooldown"`, `captureHandler` sudah mengatur `nextCaptureAtRef` dan `startCountdown()` sendiri — tidak perlu `scheduleNextCapture()` lagi
- Fix: kembalikan `startAutoCapture` agar hanya panggil `scheduleNextCapture()` saat `result === "success"`, bukan `"cooldown"`
