# Manual Upload: Async Validation via BullMQ

## Latar Belakang

`POST /image-upload/manual` saat ini memvalidasi gambar secara **sinkron** sebelum enqueue ke BullMQ. Validasi ini memanggil Gemini AI untuk ekstraksi datetime dari setiap gambar — untuk 8 gambar, ini bisa memakan waktu lama dan menyebabkan request timeout di sisi desktop.

Error "Gagal memproses gambar" yang muncul di lapangan kemungkinan besar disebabkan oleh Gemini API timeout/network error yang tertangkap oleh catch block di `ImageValidationService`, bukan bug logika.

## Kondisi Saat Ini

### Server — `POST /image-upload/manual` (sinkron, lambat)

```
Controller.uploadFileManual
  → validateImage(images, body, date)   ← BOTTLENECK: sinkron, panggil Gemini per gambar
      ↓ jika ada invalidImages → throw 422 dengan detail per gambar
      ↓ jika semua valid
  → analyzeActivityManual(...)          ← sudah async, enqueue ke BullMQ
  → return { success: true }
```

### Step Validasi Saat Ini (ImageValidationService)

Per gambar, dilakukan secara serial:

1. Cek duplikat (hash)
2. Cek ukuran (max 5MB)
3. Cek format buffer (JPEG/PNG)
4. `adjustImage` — crop, resize, greyscale via sharp (lokal, cepat)
5. `extractDateTime` via Gemini — ekstrak jam dan tanggal dari screenshot ← **BOTTLENECK**
6. Cek jam terbaca, tanggal terbaca, tanggal sesuai hari upload, jam sesuai slot
7. `validateInterval` — cek jarak antar gambar minimal 5 menit

Step 1–4 lokal dan cepat. Step 5 yang bermasalah: dipanggil 8x secara serial, bisa puluhan detik total. Kalau desktop timeout duluan sebelum server selesai → request gagal tanpa feedback yang jelas.

## Target Arsitektur

### POST /manual (cepat, tidak blocking)

Hanya lakukan validasi lokal tanpa Gemini:
1. Cek minimum 8 gambar
2. Cek duplikat (hash)
3. Cek ukuran (max 5MB)
4. Cek format buffer (JPEG/PNG)

Jika ada yang tidak lolos → throw 422 langsung (tetap sinkron, cepat).
Jika semua lolos → upload ke S3, enqueue job, return `{ success: true }`.

### BullMQ Processor

**Step 1 — Validasi Gemini (async):**
- `adjustImage` per gambar
- `extractDateTime` via Gemini per gambar
  - Jika gagal (Gemini error) → tandai gambar sebagai invalid, **tidak retry job**
- Cek jam terbaca, tanggal terbaca, tanggal sesuai slot, jam sesuai slot
- `validateInterval` — cek jarak antar gambar minimal 5 menit
- Jika ada invalid:
  - Simpan detail invalid (gambar mana + alasan) ke DB/Redis
  - Hapus semua s3Keys dari S3
  - Job selesai (tidak lanjut ke step 2)
- Jika semua valid → lanjut step 2

**Step 2 — Analisis AI:**
- Sama seperti flow yang sudah ada sekarang

### GET /manual (tambah status baru)

| Status | Kondisi |
|---|---|
| `"verified"` | Sudah ada di DB |
| `"progress"` | Masih di queue BullMQ |
| `"invalid"` | Validasi Gemini gagal — include detail per gambar ← **baru** |
| `"not-found"` | Belum upload |

### Desktop UI (update kecil)

- Tambah handle status `"invalid"` di `ProgressStatus` type
- Tampilkan komponen baru: pesan gambar mana yang bermasalah + tombol upload ulang
- `POST /manual` tidak lagi perlu handle 422 validasi Gemini (hanya 422 untuk validasi lokal)

## Keuntungan

- `POST /manual` tidak lagi timeout saat Gemini lambat
- Feedback validasi tetap jelas — user tahu gambar mana yang bermasalah via status `"invalid"`
- Konsisten dengan pola BullMQ yang sudah ada

## Desain Enqueue & S3 Key

- S3 key format: `Activity-manual-${userId}-${randomUUID()}.${ext}` — tidak encode datetime, cukup UUID
- `originalFilename` disuntik ke data job BullMQ sebagai fallback datetime parsing di processor
- Datetime dari filename bersifat opsional — hanya dipakai jika Gemini gagal extract
- Format filename fallback: `YYYY-MM-DD_HH-mm-ss` (contoh: `2025-06-26_08-30-00.jpg`) — sudah dikomunikasikan ke user via hint di `form-header-info.tsx`

### Job data per child (MANUAL_ANALYZE queue):
```typescript
{
  userId: string,
  s3Key: string,           // UUID-based, tidak berubah
  originalFilename?: string, // untuk fallback datetime parsing
  slotId: number,          // untuk validasi jam di processor
  date: string,            // untuk validasi tanggal di processor
}
```

### Alur extract datetime di processor:
1. Gemini extract datetime dari gambar → berhasil → pakai
2. Gemini gagal → parse `originalFilename` dengan regex `YYYY-MM-DD_HH-mm-ss`
3. Keduanya gagal → skip job (return `{ skipped: true }`, tidak throw/retry)

## Redis Invalid Status

- Key: `manual-invalid:${userId}:${slotId}:${formattedDate}` (format tanggal: `dd-MM-yyyy`)
- TTL: 86400 detik (24 jam) — expire alami di akhir hari
- Value: `SlotInvalidStatus[]` — array `{ s3Key, reason }` per gambar yang skip
- Disimpan di `ManualAnalyzeProcessor` saat skip: **append** (baca existing → push → set ulang)
- Dibaca di `ImageUploadManualService.getStatus()` sebelum cek BullMQ

### Provider Redis
- `RedisModule` — global module, provider `REDIS_CLIENT` (terpisah dari koneksi BullMQ)
- Env vars sama: `BULL_MQ_REDIS_HOST`, `BULL_MQ_REDIS_PORT`, `BULL_MQ_REDIS_PASSWORD`
- Didaftarkan di `third-party-registry.ts`

## File yang Diubah / Dibuat

### Server
- ✅ **`image-upload-manual.controller.ts`** — endpoint POST, GET, DELETE `/invalid` manual
- ✅ **`image-upload-manual.service.ts`** — orchestrator POST (validate → S3 → enqueue) + `getStatus()` (DB → Redis → BullMQ) + `clearInvalid()` (hapus Redis key)
- ✅ **`image-upload.controller.ts`** — bersihkan endpoint manual, sisakan hanya auto upload
- ✅ **`image-upload.module.ts`** — daftarkan controller & service baru
- ✅ **`helpers/manual-analyze-post/validate-local.helper.ts`** — validasi lokal tanpa AI
- ✅ **`helpers/manual-analyze-post/upload-s3.helper.ts`** — upload paralel via Promise.all, key UUID-based
- ✅ **`helpers/manual-analyze-post/enqueue.helper.ts`** — enqueue FlowProducer dengan `slotId`, `date`, `originalFilename`
- ✅ **`helpers/manual-analyze-processor/extract-datetime.helper.ts`** — Gemini primary, fallback filename regex, null jika keduanya gagal
- ✅ **`helpers/manual-analyze-processor/validate-datetime.helper.ts`** — validasi date string + jam sesuai slotId
- ✅ **`helpers/image-upload/manual-slot-status/slot-status-redis.helper.ts`** — `setSlotInvalid`, `getSlotInvalid`, `clearSlotInvalid`
- ✅ **`helpers/image-upload/get-manual-status.helper.ts`** — tambah `checkIsInvalid` (query Redis)
- ✅ **`manual-analyze.processor.ts`** — inject `REDIS_CLIENT`, append invalid ke Redis saat skip, 6 step: S3 → extract datetime → validate date/slot → build prompt → analyze → save DB
- ✅ **`services/redis/redis.module.ts`** — global `REDIS_CLIENT` provider
- ✅ **`app-registry/third-party-registry.ts`** — daftarkan `RedisModule`

### Desktop
- ✅ **`form-header-info.tsx`** — hint format filename fallback (`YYYY-MM-DD_HH-mm-ss`) saat belum min 8 gambar
- ✅ **`index.tsx`** — tambah `"invalid"` ke `ProgressStatus`, wire `invalidImages` + `forceShowForm` + `onReupload` + `onInputNew`, DELETE endpoint dipanggil saat reupload
- ✅ **`right-invalid-state.tsx`** — komponen baru: ScrollArea list alasan gambar invalid, dua tombol aksi: "Upload Ulang Semua" dan "Input Gambar Baru"

## Desktop — Alur Tombol Status Invalid

| Tombol | Aksi |
|---|---|
| **Upload Ulang Semua** | DELETE `/image-upload/manual/invalid` (hapus Redis key) → `mutate()` → status jadi `not-found` → form upload muncul |
| **Input Gambar Baru** | Set `forceShowForm = true` (bypass render invalid, Redis tetap ada) → form upload muncul langsung |

`forceShowForm` reset otomatis saat user pindah slot.

## Status

✅ **Selesai**

Semua flow sudah diimplementasi end-to-end:
- POST: validasi lokal → S3 → enqueue BullMQ (non-blocking)
- Processor: extract datetime (Gemini + filename fallback) → validasi date/slot → analyze → save DB; skip append ke Redis
- GET: cek DB → Redis (invalid) → BullMQ (progress) → not-found
- DELETE `/invalid`: hapus Redis key agar status kembali ke `not-found`
- Desktop: handle status `"invalid"` dengan ScrollArea list detail gambar + dua tombol (upload ulang / input baru)
