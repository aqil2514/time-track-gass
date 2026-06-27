- Fitur upload manual gambar aktivitas untuk mode tracker non-otomatis

## Upload Manual Gambar Aktivitas

**Dampak untuk pengguna:** Pengguna kini dapat mengunggah bukti aktivitas kerja secara manual per slot jam. Setiap slot menampilkan status terkini: menunggu upload, sedang diproses, terverifikasi, atau gambar tidak valid beserta alasannya.

**Fitur:**
- Pilih slot jam (00–23) lalu unggah 8 gambar aktivitas sekaligus
- Sistem memvalidasi format file, ukuran, dan kecocokan tanggal & jam gambar dengan slot yang dipilih
- Analisis konten gambar dilakukan secara async menggunakan Gemini AI (antrian BullMQ), dengan fallback ke nama file jika AI tidak dapat membaca timestamp dari gambar
- Status slot diperbarui otomatis: `progress` saat diproses, `verified` setelah analisis berhasil, `invalid` jika ada gambar yang tidak lolos validasi
- Gambar invalid ditampilkan beserta alasan spesifik per file; pengguna dapat upload ulang setelah memperbaiki
- Upload ulang otomatis membersihkan data invalid sebelum mengirim gambar baru

**Teknis:**
- Endpoint baru: `POST /image-upload/manual`, `GET /image-upload/manual`, `DELETE /image-upload/manual/invalid`
- Status slot disimpan sementara di Redis (`manual-invalid:userId:slotId:date`) selama proses berlangsung
- Processor `ManualAnalyzeProcessor` menangani validasi datetime (Gemini → fallback filename) dan analisis konten per gambar
- Jika analisis AI gagal setelah semua retry, slot tetap dianggap jam kerja aktif dengan kategori `ai_error`
- Tip format nama file (`YYYY-MM-DD_HH-mm-ss`) hanya ditampilkan saat sistem terpaksa fallback ke filename karena AI tidak dapat membaca timestamp
