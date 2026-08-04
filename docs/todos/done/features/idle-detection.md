# Idle Detection via Screenshot Similarity

## Latar Belakang

Request dari Nisarofah HR: jika user sengaja mendiamkan layar dalam waktu lama, sistem seharusnya mendeteksi bahwa tidak ada aktivitas dan menandai periode tersebut sebagai "idle" — bukan dihitung sebagai jam kerja aktif.

## Konsep

Bandingkan screenshot baru dengan screenshot sebelumnya. Jika 3x berturut-turut hasilnya sangat mirip (≥ 95% similarity), kategori otomatis di-set ke `"idle"`.

## Keputusan Teknis

- **Lokasi perbandingan:** Server (bukan client/desktop)
- **Library:** `sharp-phash` — wrapper di atas `sharp`, menghasilkan 64-char binary string (`0`/`1`), distance dihitung via `sharp-phash/distance`
- **Metode hashing:** Perceptual hash (pHash)
- **Threshold similarity:** ≥ 95% → maksimal **3 bit berbeda** dari 64 bit (`dist <= 3`)
- **Jumlah berturut-turut:** 3x screenshot berturut-turut mirip → screenshot ke-4 dan seterusnya di-set idle (basis: 15 menit = 3 interval × 5 menit, request dari HR)
- **Kategori:** `"idle"` sebagai kategori baru, berbeda dari `"unclassified"`

## Perubahan Database

Tambah kolom baru di tabel `ai_screen_report`:

```
image_hash  String?
```

Fungsi: menyimpan pHash dari screenshot agar tidak perlu download ulang gambar dari S3 setiap kali perbandingan dilakukan.

## Alur Implementasi

Flow: `POST /image-upload` → `image-scanner.service.ts` (upload S3 + enqueue) → **`NormalAnalyzeProcessor`** (semua logika di bawah terjadi di sini)

1. Endpoint menerima screenshot, upload ke S3, push job ke BullMQ dengan `imageUrl` (signed URL, 1 jam)
2. Processor menerima job — `imageUrl` sudah tersedia, tidak perlu download ulang dari S3 secara manual
3. Hitung pHash dari `imageUrl` menggunakan `sharp-phash`
4. Ambil 3 record terakhir user dari `ai_screen_report` beserta `image_hash`-nya
5. Bandingkan hash baru dengan ketiga record: jika `dist <= 3` pada ketiganya → tandai sebagai idle
6. Jalankan AI analysis seperti biasa (Gemini)
7. Jika idle terdeteksi → override `category = "idle"` setelah AI selesai
8. Simpan hasil ke DB beserta `image_hash` yang baru dihitung

## Keputusan Tambahan

- Kategori `"idle"` tidak perlu masuk ke `divisions.vision_config` — hardcode di server logic, berlaku untuk semua divisi (sama seperti `"unclassified"`)
- Jika idle terdeteksi, AI analysis tetap dijalankan seperti biasa — idle hanya override hasil kategori setelah AI selesai
- Kategori `"idle"` **tidak dihitung sebagai jam kerja** — diexclude di semua 6 query kalkulasi bersama `"unclassified"` menggunakan `NOT IN ('unclassified', 'idle')`

## AI Error Fallback

Jika Gemini error setelah 3 retry, `onFailed` tetap menyimpan record ke DB dengan:
- `category = "ai_error"` — dihitung sebagai jam kerja
- `app_name = "AI Error"`, `window_title = "Analisis Gagal"`, summary informatif
- `image_hash` tetap dihitung (dengan try/catch) agar record ini ikut berpartisipasi dalam idle detection berikutnya

**Idle + AI Error:** `onFailed` juga menjalankan idle detection. Jika idle terdeteksi saat AI error, `category` di-override ke `"idle"` (tidak dihitung jam kerja) — `app_name` dan `window_title` tetap `"AI Error"` / `"Analisis Gagal"`, hanya `category` dan `summary` yang berbeda.

## Status

✅ **Selesai dan verified di production** — idle detection aktif, record `idle` sudah muncul di DB dengan `image_hash` tersimpan. Semua query kalkulasi jam kerja sudah exclude `idle`.
