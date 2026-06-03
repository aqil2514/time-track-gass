- Upgrade timer ke native Rust thread untuk menghindari drift pada macOS
- Tambah upload timeout 60 detik agar upload yang stuck tidak memblokir timer
- Tambah logging untuk start/stop native timer

## Native Timer (Rust)

- Timer sebelumnya menggunakan `setTimeout` JavaScript yang rentan drift saat tab tidak aktif, device sleep, atau CPU load tinggi
- Timer sekarang dijalankan oleh OS thread dari Rust (`std::thread::spawn`) dan mengirim event `native_timer_tick` ke frontend via Tauri
- JavaScript hanya menerima tick dari Rust, bukan mengatur waktu sendiri
- Stop signal menggunakan `AtomicBool` untuk menghentikan thread dengan aman tanpa race condition

## Upload Timeout

- Upload screenshot kini memiliki batas waktu 60 detik
- Jika upload tidak selesai dalam 60 detik, request dibatalkan dan retry dimulai
- Mencegah timer macet karena koneksi lambat atau server tidak merespons
