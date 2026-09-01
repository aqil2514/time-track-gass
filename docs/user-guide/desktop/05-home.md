# Halaman Utama (Home)

Halaman utama adalah pusat kendali aplikasi. Di sini kamu bisa memulai sesi kerja, melihat ringkasan aktivitas, dan mengekspor data.

---

## Area kontrol

Di bagian atas halaman terdapat beberapa tombol dan informasi yang bisa kamu gunakan.

### Pilih tanggal

Gunakan **Date Picker** untuk melihat data aktivitas di tanggal tertentu. Secara default, halaman menampilkan data hari ini.

### Mode tracker

Aplikasi memiliki dua mode pencatatan aktivitas: **Auto** dan **Manual**. Mode mana yang tersedia untukmu ditentukan oleh supervisor atau admin. Jika supervisor mengizinkan kedua mode, kamu bisa beralih antar mode melalui menu profil di pojok kanan atas. Jika hanya satu mode yang diizinkan, opsi ganti mode tidak akan muncul.

---

### Mulai/Hentikan sesi (Mode Auto)

Jika tracker kamu menggunakan mode **Auto**, akan muncul tombol **Start Session** dan **Stop Session**.

- Klik **Start Session** untuk mulai sesi kerja — aplikasi akan mulai mengambil screenshot layarmu secara otomatis
- Klik **Stop Session** untuk mengakhiri sesi

Selama sesi berjalan, kamu akan melihat badge status di sebelah tombol yang menunjukkan apa yang sedang dilakukan aplikasi:

| Status | Artinya |
|---|---|
| Standby | Sesi belum dimulai atau sudah berhenti |
| Next in Xs | Menunggu giliran berikutnya untuk ambil screenshot (X = detik tersisa) |
| Capturing... | Sedang mengambil screenshot layar |
| Processing AI Analysis... | Screenshot sedang dianalisis oleh AI |
| Error | Terjadi kesalahan — coba restart sesi |

Jika sebelumnya kamu menutup aplikasi tanpa menghentikan sesi, sesi akan dilanjutkan otomatis saat aplikasi dibuka kembali. Hal ini ditandai dengan badge **"Session resumed automatically"**.

### Upload screenshot (Mode Manual)

Jika tracker kamu menggunakan mode **Manual**, akan muncul tombol **Upload Image**.

1. Klik **Upload Image** — dialog unggah akan terbuka
2. Di sisi kiri, pilih **slot jam** yang ingin kamu isi (contoh: `09 s/d 10` artinya jam 09.00–10.00)
   - Slot hanya bisa dipilih untuk jam yang sudah berlalu
   - Slot di masa depan dikunci dan tidak bisa dipilih
3. Setelah memilih slot, unggah screenshot aktivitas kerja pada jam tersebut
4. Klik **Submit** untuk mengirimkan

Setelah berhasil diunggah, screenshot akan diproses oleh AI untuk mengenali aktivitas yang tercatat.

### Refresh data

Klik tombol **refresh** (ikon panah melingkar) untuk memperbarui data yang ditampilkan di halaman.

### Export To Excel

Klik tombol **Export To Excel** untuk mengunduh data aktivitas yang sedang ditampilkan ke dalam file Excel.

### Ringkasan waktu kerja

Di pojok kanan atas area kontrol, terdapat dua badge:

- **Today** — total waktu kerja hari ini
- **This Week** — total waktu kerja minggu ini

---

## Area data

Di bawah area kontrol, terdapat tiga bagian yang menampilkan detail aktivitasmu.

### AI Daily Insight

Ringkasan naratif aktivitasmu yang dibuat oleh AI.

- Untuk **hari ini**: menampilkan pesan "Daily summary for today is being processed..." karena data masih dikumpulkan
- Untuk **hari-hari sebelumnya**: menampilkan ringkasan aktivitas dan keterangan produktivitas

### Activity Breakdown

Menampilkan tiga kategori aktivitas yang paling banyak kamu lakukan pada tanggal yang dipilih, beserta persentase waktunya.

### Timeline aktivitas

Daftar detail semua aktivitas yang tercatat. Kamu bisa beralih antara dua tampilan:

- **Session** — aktivitas dikelompokkan berdasarkan sesi kerja (hanya tersedia di mode Auto)
- **Category** — aktivitas dikelompokkan berdasarkan kategori jenis pekerjaan

Di mode Manual, timeline hanya menampilkan tampilan **Category**.
