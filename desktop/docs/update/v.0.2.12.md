- Fitur untuk kirim error ke server
- User lama tidak bisa akses fitur switch mode, user baru bisa
- Fitur upload gambar
- Perkuat validasi gambar
- Fitur history mulai sesi dan akhiri sesi
- Update endpoint v2 agar jadi 1x api call

## Fitur Session History (Stop Otomatis)
- Ambil semua sesi aktif (yang end_at masih null)
- Untuk tiap sesi, cek aktivitas terakhir user
- Jika tidak ada aktivitas → fallback ke start_at sesi
- Hitung selisih waktu → jika ≤ 15 menit, skip
- Jika > 15 menit → matikan sesi dengan waktu aktivitas terakhir sebagai end_at
- Jika end_at null (tidak ada aktivitas) → otomatis pakai new Date() via ??