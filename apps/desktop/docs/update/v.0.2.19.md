- Tambah cycle timeout guard 30 detik agar timer tidak stuck di status "Processing AI Analysis"
- Refactor timer controller menjadi beberapa hook kecil
- Hapus debug logs yang tidak diperlukan

## Cycle Timeout Guard

**Dampak untuk pengguna:** Sebelumnya, ada kasus langka di mana tracker bisa macet selamanya di tulisan "Processing AI Analysis" tanpa ada pemberitahuan apapun. Pengguna tidak sadar tracker-nya tidak berjalan, sehingga jam kerja mereka tidak terhitung. Sekarang, jika proses upload screenshot tidak selesai dalam 30 detik, aplikasi otomatis menampilkan notifikasi kepada pengguna, lalu timer kembali berjalan normal. Screenshot yang gagal memang tidak tersimpan, tapi pengguna tahu dan tracker tidak berhenti diam-diam. Waktu tunggu 30 detik dipilih karena normalnya upload selesai di bawah 10 detik — jika lebih dari itu sudah dipastikan ada masalah.

**Teknis:**
- Sebelumnya jika `load("auth.json")` atau `api.post` hang tanpa batas waktu, timer akan stuck selamanya di status "uploading" (tampil sebagai "Processing AI Analysis")
- Sekarang seluruh siklus upload dibungkus `Promise.race` dengan batas 30 detik (axios timeout 15 detik, cycle timeout 30 detik)
- Jika timeout tercapai, user mendapat notifikasi, screenshot tidak tersimpan, namun timer tetap berjalan normal

## Refactor Timer Controller

**Dampak untuk pengguna:** Tidak ada perubahan tampilan atau perilaku. Perubahan ini murni internal untuk merapikan kode agar lebih mudah dipelihara dan dikembangkan ke depannya.

**Teknis:**
- `use-home-timer-controller.ts` dipecah menjadi beberapa child hooks:
  - `use-keep-awake.ts` — mengelola keep awake native
  - `use-native-timer-trigger.ts` — mengelola listen/unlisten native timer tick
  - `use-countdown.ts` — mengelola countdown state dan interval
  - `use-capture-handler.ts` — mengelola logika capture dan upload
- Orchestrator hanya memegang semua refs dan mengkomposisi child hooks

## Cleanup Logs

**Dampak untuk pengguna:** Tidak ada perubahan yang terasa langsung. Secara tidak langsung, aplikasi sedikit lebih ringan karena tidak perlu menulis banyak log yang tidak berguna ke database setiap siklus timer.

**Teknis:**
- Hapus 25 dari 33 panggilan `writeMacTimerLog` yang hanya berguna saat debugging aktif
- Tersisa hanya log untuk event error, warning, dan timeout yang actionable
