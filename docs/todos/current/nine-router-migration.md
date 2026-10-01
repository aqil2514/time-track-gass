# Migrasi LLM Call Sites ke 9Router (dengan Fallback Gemini)

## Latar Belakang

User diminta menggunakan [9Router](https://9router.com/) — AI gateway open source (OpenAI-compatible endpoint, 60+ provider, smart fallback) — sebagai proxy untuk panggilan LLM di project ini. Endpoint yang diberikan: `https://9router.gass.web.id/v1`.

Referensi lengkap seluruh titik pemanggilan LLM yang ada di codebase (sebelum migrasi ini): lihat [docs/references/llm-call-sites.md](../../references/llm-call-sites.md).

Keputusan desain (hasil diskusi dengan user):
- **Semua 6 titik panggilan Gemini** ditarget untuk pindah ke 9Router, tapi dikerjakan **satu per satu** (pilot dulu, bukan sekaligus).
- **Model**: `ag/gemini-3.6-flash-low` (lewat 9Router).
- **Fallback**: kalau 9Router gagal (timeout/error/non-2xx), otomatis fallback ke Gemini native (`@google/genai`, SDK langsung) — bukan hard-switch tanpa jaring pengaman.
- Pilot pertama dipilih: **Normal Analyze**, karena representatif (vision + structured JSON output) dan paling mudah dibuktikan berhasil/tidaknya secara langsung dari traffic nyata.

## Kondisi Saat Ini (Sebelum Migrasi)

6 titik panggilan Gemini, semua di `apps/server`, native `@google/genai` SDK, non-streaming `generateContent`:

| # | Titik | Jenis | Lewat `AnalyzerService`? |
|---|---|---|---|
| 1 | `summarySession.helper.ts` | text-only | ✅ Ya |
| 2 | `image-validation.processor.ts` | vision | ✅ Ya |
| 3 | `normal-analyze.processor.ts` → `gemini-analyze.helper.ts` | vision | ❌ Inject langsung |
| 4 | `manual-analyze.processor.ts` → `analyze-manual-image.helper.ts` | vision | ❌ Inject langsung |
| 5 | `manual-analyze.processor.ts` → `extract-datetime.helper.ts` | vision | ❌ Inject langsung |
| 6 | `daily-summary.processor.ts` → `dailySummary.helper.ts` | text-only | ❌ Inject langsung |
| 7 | `daily-summary-category.processor.ts` → `dailySummaryPerCategory.helper.ts` | text-only | ❌ Inject langsung |

(Catatan: 7 call site fisik tapi dihitung "6 titik" di dokumen referensi karena pengelompokan per-fitur; detail persisnya ada di `llm-call-sites.md`.)

Tidak ada satu chokepoint — migrasi per titik dilakukan secara independen.

## Target Arsitektur

Per titik yang dimigrasikan:

```
Caller (processor/helper)
  → coba 9Router (OpenAI-compatible, model ag/gemini-3.6-flash-low)
      ↓ sukses → return hasil, log [PROVIDER=9ROUTER] sukses
      ↓ gagal (catch)
  → fallback ke Gemini native (model yang sama seperti sebelum migrasi)
      ↓ log [PROVIDER=9ROUTER] gagal + alasan
      ↓ sukses → return hasil, log [PROVIDER=GEMINI-FALLBACK] sukses
```

Return shape ke caller **tidak berubah** (tetap `{ text: string }` atau bentuk yang sudah dikonsumsi `JSON.parse` di tempat lama) — supaya logic downstream (parsing, simpan DB, dll) tidak perlu disentuh.

### Komponen Bersama (dibuat sekali, dipakai semua titik)

- **`NineRouterService`** (`apps/server/src/services/analyzer/services/nine-router/nine-router.service.ts`)
  - POST ke `https://9router.gass.web.id/v1/chat/completions`
  - Auth: header `Authorization: Bearer ${process.env.NINEROUTER_API_KEY}`
  - Body format OpenAI chat-completions: `messages` (role/content), vision via content part `image_url` (data URI base64), `response_format: { type: 'json_schema', json_schema: {...} }`
  - Timeout 30s
  - Method saat ini: `analyzeImage(request: NineRouterVisionRequest)` — vision only. **Perlu ditambah method untuk text-only** (dipakai di titik Daily Summary, Daily Summary per Category, Summary Session) sebelum migrasi ke titik-titik tersebut.
- **Interface**: `apps/server/src/services/analyzer/interfaces/nine-router.interface.ts`
- Didaftarkan & diexport dari `AnalyzerModule` (`@Global()`) — otomatis tersedia di semua module tanpa import eksplisit.
- **Env var baru**: `NINEROUTER_API_KEY` (didokumentasikan di `apps/server/README.md`).

### Pola Logging per Titik

Supaya bisa dibedakan di log server mana yang lewat 9Router vs fallback Gemini:
```
[PROVIDER=9ROUTER] model=ag/gemini-3.6-flash-low sukses
[PROVIDER=9ROUTER] model=ag/gemini-3.6-flash-low gagal, fallback ke Gemini langsung. Alasan: <pesan>
[PROVIDER=GEMINI-FALLBACK] model=<model-gemini-asli> sukses
```
Memudahkan `grep PROVIDER` di log untuk menghitung rasio sukses 9Router vs frekuensi fallback — jadi dasar keputusan apakah 9Router layak dilanjutkan/di-root-kan sebagai primary permanen.

## Progres per Titik

### 1. Normal Analyze — ✅ Selesai (Pilot)

- **File diubah**:
  - `apps/server/src/helpers/image-upload/normal-analyze-processor/gemini-analyze.helper.ts` — tambah fungsi `analyzeImageViaGateway(nineRouter, gemini, model, prompt, imageUrl)`. Fungsi lama `analyzeImage` (native Gemini) dipertahankan sebagai fallback internal. Logic fetch+base64 image diekstrak ke helper lokal `fetchImageAsBase64` (dipakai bersama kedua jalur).
  - `apps/server/src/app/image-upload/processor/normal-analyze.processor.ts` — inject `NineRouterService`, ganti panggilan `analyzeImage(...)` → `analyzeImageViaGateway(...)`.
- **Logging**: sudah ditambahkan sesuai pola di atas (sukses 9Router, gagal+fallback, sukses fallback).
- **Status verifikasi**: ⏳ menunggu user coba di traffic nyata (upload screenshot → cek log) sebelum lanjut ke titik berikutnya.

### 2. Manual Analyze (`analyze-manual-image.helper.ts`) — ⬜ Belum dikerjakan

- Pola sama dengan Normal Analyze (vision + JSON schema), tinggal terapkan `analyzeImageViaGateway`-style ke helper ini.
- Model-tier array beda sumber (`job.data.model` kalau disuplai caller) — perlu dicek tidak merusak logic existing.

### 3. Extract Datetime (`extract-datetime.helper.ts`, fungsi `tryGemini`) — ⬜ Belum dikerjakan

- Vision call lain di Manual Analyze flow, client Gemini yang sama. Terapkan pola fallback yang sama.

### 4. Daily Summary (`dailySummary.helper.ts`, fungsi `analyzeSummaryByAi`) — ⬜ Belum dikerjakan

- Text-only. **Butuh method text-only baru di `NineRouterService`** (belum ada — service saat ini cuma punya `analyzeImage`).

### 5. Daily Summary per Category (`dailySummaryPerCategory.helper.ts`, fungsi `getDailyAiSummary`) — ⬜ Belum dikerjakan

- Text-only. Sama seperti di atas, butuh method text-only.

### 6. Summary Session (`summarySession.helper.ts`) — ⬜ Belum dikerjakan

- Text-only, saat ini lewat `AnalyzerService.callAnalyzerProvider`. Pertimbangkan migrasi sekaligus konsolidasi `AnalyzerService` jadi chokepoint tunggal untuk semua titik (bukan cuma 2 titik seperti sekarang).

### 7. Image Validation (`image-validation.processor.ts`) — ⬜ Belum dikerjakan

- Vision, juga lewat `AnalyzerService`. Sama seperti di atas.

## Hal yang Perlu Diputuskan Sebelum Lanjut ke Titik Text-Only (4, 5, 6)

- Desain method text-only di `NineRouterService` — apakah generic satu method `chatCompletion(messages, schema)` yang dipakai baik vision maupun text (vision tinggal tambah content part), atau tetap pisah `analyzeImage` vs `analyzeText`.
- Apakah migrasi ke titik 6 & 7 (yang sudah lewat `AnalyzerService`) jadi momentum untuk **konsolidasi** 4 titik yang masih inject `GEMINI_AI` langsung (titik 2, 3, 4, 5) supaya semua akhirnya lewat satu service orchestrator — sesuai arah yang disebut di `llm-call-sites.md` bagian implikasi migrasi.

## File yang Dihapus (Terkait, dari Pembersihan Sebelumnya)

Sebagai bagian dari housekeeping sebelum migrasi ini dimulai, jalur **Zhipu AI/GLM** (provider lama yang tidak pernah punya live caller) sudah dihapus dari codebase atas permintaan user. Detail lengkap ada di `llm-call-sites.md` bagian "Riwayat". Tidak terkait langsung dengan migrasi 9Router, tapi menyederhanakan `AnalyzerService`/`AnalyzerModule` sebelum migrasi ini dimulai.

## Status

🔄 **Sedang berjalan** — 1 dari 7 titik selesai (Normal Analyze, pilot). Menunggu verifikasi hasil pilot dari user sebelum lanjut ke titik berikutnya.
