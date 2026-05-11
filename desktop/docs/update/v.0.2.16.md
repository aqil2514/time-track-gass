- Tambah validasi anti-cheat saat auto screenshot upload
- Tambah popup fatal saat retry upload habis
- Tambah fokus window saat error total terjadi

## Alur Auto Screenshot
- Saat session dimulai, desktop menjalankan auto screenshot sesuai interval
- Hasil capture dikirim ke server lewat endpoint `POST /image-upload`
- Server akan menolak request yang datang terlalu cepat sebelum upload ke S3 dan sebelum antrean BullMQ
- Saat cooldown terjadi, server ikut mengirim sisa waktu dalam detik agar desktop bisa lanjut countdown dari durasi yang tersisa
- Jika upload berhasil, desktop lanjut ke siklus capture berikutnya

## Penanganan Error
- Jika server membalas error non-2xx, desktop akan melakukan retry maksimal 3 kali
- Jika request ditolak karena jeda upload belum cukup, desktop tidak meneruskan upload berikutnya sampai waktu aman
- Jika seluruh retry gagal, desktop menampilkan popup error agar user melakukan hard restart aplikasi
- Saat error total terjadi, window akan dibawa ke depan supaya pesan error langsung terlihat
