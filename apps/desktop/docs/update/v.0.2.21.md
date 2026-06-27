- Perbaiki regression dari v0.2.20 yang menyebabkan timer mulai dari awal saat aplikasi di-refresh

## Timer Mulai Ulang Setelah Refresh (Regression v0.2.20)

**Dampak untuk pengguna:** Update v0.2.20 tanpa sengaja memperkenalkan bug baru — saat aplikasi di-refresh atau di-restart, timer yang seharusnya melanjutkan countdown malah mengulang dari awal dan langsung mengambil screenshot baru. Ini menyebabkan screenshot diambil terlalu cepat dan tidak sesuai jadwal. Sekarang timer kembali melanjutkan countdown yang tersisa setelah refresh, seperti sebelum v0.2.20.

**Teknis:**
- Di v0.2.20, `result === "cooldown"` ditambahkan ke kondisi yang memanggil `scheduleNextCapture()` di `startAutoCapture` — tujuannya agar timer lanjut setelah timeout upload
- Tapi saat `"cooldown"` karena throttle 422, `captureHandler` sudah mengatur `nextCaptureAtRef` dan memanggil `startCountdown()` sendiri di dalamnya
- `scheduleNextCapture()` yang ikut dipanggil dari orchestrator me-reset countdown ke 5 menit penuh, menimpa nilai yang sudah diset
- Fix: kembalikan `startAutoCapture` agar hanya panggil `scheduleNextCapture()` saat `result === "success"` — `"cooldown"` tidak perlu karena sudah diurus di dalam `captureHandler`
