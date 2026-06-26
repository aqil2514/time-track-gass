# Fitur Idle Detection — 24 Juni 2026

## Apa itu Idle Detection?

Fitur ini mendeteksi apabila karyawan mendiamkan layar dalam waktu lama tanpa aktivitas. Jika terdeteksi, waktu tersebut **tidak dihitung sebagai jam kerja**.

---

## Mengapa dibuat?

Request dari Nisarofah (HR): karyawan yang sengaja membiarkan layar diam (tanpa bekerja) tidak seharusnya mendapat hitungan jam kerja.

---

## Cara kerjanya

1. Setiap 5 menit, aplikasi desktop mengambil screenshot layar karyawan dan mengirimnya ke server.
2. Server menghitung "sidik jari" gambar tersebut menggunakan teknologi bernama **pHash** (perceptual hash) — semacam kode unik yang merepresentasikan isi gambar.
3. Sidik jari gambar baru dibandingkan dengan 3 screenshot terakhir milik user yang sama.
4. Jika ketiga screenshot sebelumnya sangat mirip (≥ 95% sama), maka screenshot ini dikategorikan sebagai **`idle`**.
5. Kategori `idle` **tidak dihitung** sebagai jam kerja aktif — sama seperti kategori `unclassified`.

---

## Apa yang berubah di sistem?

- Ditambah kolom `image_hash` di tabel database `ai_screen_report` untuk menyimpan sidik jari setiap screenshot.
- Kategori baru `idle` ditambahkan, dikecualikan dari semua perhitungan jam kerja.
- Seluruh laporan jam kerja (harian, mingguan, ringkasan supervisor, dll) sudah diperbarui untuk mengabaikan kategori `idle`.

---

## Bagaimana jika AI gagal menganalisis screenshot?

Jika AI (Gemini) gagal menganalisis gambar, sistem tetap menyimpan data dengan kategori `ai_error` dan tetap dihitung sebagai jam kerja. Namun jika saat AI gagal juga terdeteksi idle, kategorinya di-override menjadi `idle` — sehingga tetap tidak dihitung jam kerja.

---

## Status

✅ Selesai dan aktif di production sejak 24 Juni 2026.
