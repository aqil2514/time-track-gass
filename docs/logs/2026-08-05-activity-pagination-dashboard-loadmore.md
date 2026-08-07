# Update Sistem — 5 Agustus 2026

## Apa yang diperbarui?

Session ini berisi beberapa perbaikan bug dan peningkatan performa di halaman aktivitas dan dashboard supervisor.

---

## 1. Halaman Aktivitas Tidak Muncul Data Saat Filter Rentang Tanggal

**Masalah:** Ketika supervisor memilih filter berupa rentang tanggal (misal: 1–5 Agustus), halaman aktivitas karyawan tidak menampilkan data sama sekali — layar kosong.

**Penyebab:** Sistem hanya bisa membaca filter "tanggal tunggal". Ketika filter berupa rentang (tanggal mulai dan selesai), sistem tidak mengenalinya dan tidak jadi mengambil data.

**Solusi:** Sistem diperbarui agar bisa membaca kedua jenis filter — tanggal tunggal maupun rentang tanggal.

---

## 2. Tampilan Navigasi Halaman (Pagination) Diperbarui

**Sebelumnya:** Hanya ada tombol "Sebelumnya" dan "Selanjutnya".

**Sekarang:**
- Tombol langsung ke halaman pertama dan halaman terakhir
- Kotak input yang bisa diketik nomor halaman secara manual — halaman baru dibuka setelah pengguna selesai mengetik (bukan langsung saat mengetik)
- Pilihan jumlah data per halaman: 10, 50, atau 100 baris
- Tampilan total jumlah data (contoh: "1–50 dari 1.234 data")

---

## 3. Dashboard Timeline Lebih Cepat — "Muat Lebih Banyak"

**Masalah:** Ketika supervisor membuka dashboard dengan filter rentang tanggal yang panjang (misal seminggu atau sebulan), semua data dimuat sekaligus. Ini membuat halaman lambat dan berat, terutama jika datanya banyak.

**Solusi:** Sistem sekarang hanya memuat 20 sesi pertama. Di bagian bawah halaman ada tombol **"Muat lebih banyak"** — klik tombol ini untuk memuat 20 sesi berikutnya, dan seterusnya.

**Catatan:** Perubahan ini hanya berlaku di tampilan web supervisor. Aplikasi desktop karyawan tidak terpengaruh.

---

## 4. Perbaikan Error Saat Build

Dua bug teknis diperbaiki yang menyebabkan proses build (kompilasi kode) gagal:

- **Bug tipe data:** Sistem mengharapkan tipe data `bigint` tapi menerima `Decimal` dari database — diperbaiki agar keduanya cocok.
- **Bug struktur data:** Dua dialog konfirmasi (hapus massal dan ubah kategori massal) mengakses data di lokasi yang salah setelah struktur data diubah — diperbaiki ke lokasi yang benar.

---

## 5. Perbaikan Server Tidak Bisa Jalan di VPS

**Masalah:** Setelah deploy ke VPS (server production), aplikasi server gagal dijalankan oleh PM2 dengan error: `cross-env: command not found`.

**Penyebab:** Script untuk menjalankan server menggunakan alat bernama `cross-env` (dibutuhkan di Windows), tapi alat ini tidak ikut terinstall di server Linux karena masuk kategori "alat pengembangan" (devDependencies), bukan "alat production".

**Solusi:** Hapus penggunaan `cross-env` dari script production. Di Linux, pengaturan timezone bisa langsung ditulis tanpa alat tambahan.

```
# Sebelum
cross-env TZ=Asia/Shanghai node dist/src/main

# Sesudah
TZ=Asia/Shanghai node dist/src/main
```

---

## Status

✅ Semua perbaikan selesai. Build web dan server berjalan tanpa error.
