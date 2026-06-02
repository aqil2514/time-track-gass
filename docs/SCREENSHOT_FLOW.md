# Screenshot Flow

Dokumen ini menjelaskan alur pengambilan screenshot pada aplikasi worker desktop.

## Ringkasan

Flow utama:

1. Worker memulai work session.
2. Desktop langsung mengambil screenshot pertama.
3. Screenshot di-upload ke server.
4. Server memasukkan file ke queue analisis.
5. Worker queue memproses gambar secara background.
6. Hasil analisis disimpan ke database.
7. Desktop menjadwalkan screenshot berikutnya.

## 1. Pemicu awal

Pengambilan screenshot dikendalikan oleh hook timer di:

- `desktop/src/routes/home/logic/timer-hooks/use-home-timer-controller.ts:20`

Saat session dimulai:

- `startAutoCapture()` dipanggil di `desktop/src/routes/home/logic/timer-hooks/use-home-timer-controller.ts:182`
- fungsi ini langsung memanggil `captureHandler()` untuk screenshot pertama di `desktop/src/routes/home/logic/timer-hooks/use-home-timer-controller.ts:187`
- setelah screenshot pertama, desktop memulai native timer Rust via `startNativeTimer(intervalMenit)`

Artinya screenshot pertama tidak menunggu interval dulu.

### Native timer (sejak v0.2.18)

Timer tidak lagi dikendalikan oleh `setTimeout` JavaScript. Timer sekarang berjalan sebagai OS thread dari Rust dan mengirim event `native_timer_tick` ke frontend via Tauri.

- Desktop mendaftarkan listener `native_timer_tick` lewat Tauri event API
- Setiap tick yang diterima memicu `onTick()` → capture → upload
- Interval dikontrol sepenuhnya dari sisi Rust menggunakan `std::thread::spawn` dan `AtomicBool` sebagai stop signal
- JavaScript hanya menerima tick, tidak mengatur waktu sendiri

Pendekatan ini menghilangkan drift yang sebelumnya terjadi saat tab tidak aktif, device sleep, atau CPU load tinggi — terutama pada macOS.

## 2. Capture gambar di desktop

Implementasi capture ada di:

- `desktop/src/hooks/use-capture.ts:38`

### macOS

Jika platform adalah macOS:

1. Aplikasi mengecek permission screen recording.
2. Jika belum ada permission, aplikasi meminta izin.
3. Aplikasi menunggu sampai permission terdeteksi.
4. Jika tetap belum ada, aplikasi menampilkan warning dan melempar error.
5. Jika permission aktif, aplikasi memanggil command native `capture_screen_macos`.

### non-macOS

Jika platform bukan macOS:

1. Aplikasi mencari monitor yang bisa di-screenshot.
2. Aplikasi mengambil screenshot monitor pertama.
3. Hasil file sementara dikirim ke command native `resize_and_encode`.

Output akhirnya adalah string gambar siap upload.

## 3. Upload ke server

Setelah capture berhasil, desktop meng-upload hasil screenshot ke backend dari:

- `desktop/src/routes/home/logic/timer-hooks/use-home-timer-controller.ts:94`

Flow upload:

1. Desktop membaca token dari `auth.json`.
2. Desktop mengirim `POST /image-upload` dengan body `{ image: dataUrl }`.
3. Request disertai header `Authorization: Bearer <token>`.

Backend endpoint upload ada di:

- `server/src/app/image-upload/controller/image-upload.controller.ts:31`

Endpoint ini tidak memproses gambar langsung, tetapi meneruskan pekerjaan ke queue normal analyze.

## 4. Queue analisis

Nama queue untuk flow ini didefinisikan di:

- `server/src/constants/queue.constant.ts:9`

Processor queue ada di:

- `server/src/app/image-upload/processor/normal-analyze.processor.ts:21`

Saat job diproses:

1. Job membawa data user, file, dan metadata session.
2. Server membangun prompt analisis.
3. Gambar dianalisis oleh model AI.
4. Hasil JSON di-parse.
5. Data seperti app name, window title, category, dan summary disimpan ke database.

## 5. Retry dan error handling

Di desktop, capture/upload punya retry:

- maksimal 3 kali
- delay retry 5 detik

Jika gagal:

- error dicatat ke log lokal
- status berubah menjadi `error`
- jika server membalas `429`, flow dihentikan lebih cepat dan dicatat sebagai throttled

## 6. Loop berikutnya

Jika upload sukses, desktop:

1. memanggil `mutate()` untuk refresh data home
2. mengubah status menjadi countdown
3. menunggu tick berikutnya dari native timer Rust

Native timer yang mengatur interval — desktop tidak lagi menjadwalkan screenshot berikutnya secara manual dari JavaScript.

Flow ini terus berjalan sampai user menekan stop.

## 7. Stop flow

Saat worker menghentikan session:

- semua timer dibersihkan
- flag stop diaktifkan
- status kembali ke `idle`

## 8. Ringkas satu baris

**start session → capture screenshot → upload → queue analisis → simpan hasil → jadwalkan capture berikutnya**
