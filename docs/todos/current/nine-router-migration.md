# Migrasi LLM Call Sites ke 9Router (Full Replace, Gemini Dihapus)

## Status & TODO saat ini (ringkas)

✅ **Selesai** — semua 7 titik panggilan LLM sudah dimigrasikan penuh ke 9Router. Gemini (`@google/genai`, provider `GEMINI_AI`, `AnalyzerService`) sudah dihapus total dari codebase — tidak ada fallback, 9Router jadi satu-satunya provider AI.

- [x] `NineRouterService` + interface, sekarang di module sendiri `NineRouterModule` (`@Global()`), menggantikan `AnalyzerModule` lama.
- [x] Method text-only `chatCompletion` ditambahkan di `NineRouterService` (untuk titik 4, 5, 6 yang sebelumnya text-only).
- [x] Titik 1 — Normal Analyze: migrasi awal (pilot, dengan fallback Gemini) sudah ada sejak sebelumnya; fallback Gemini-nya kini **dihapus** sebagai bagian full-replace ini.
- [x] Titik 2 — Manual Analyze (`analyze-manual-image.helper.ts`): migrasi selesai.
- [x] Titik 3 — Extract Datetime (`extract-datetime.helper.ts`): migrasi selesai, `jsonSchema` eksplisit `{date, time}` dipakai (lebih robust dari prompt-only sebelumnya). Fallback non-AI ke parsing nama file tetap dipertahankan (bukan bagian dari provider AI).
- [x] Titik 4 — Daily Summary (`dailySummary.helper.ts`): migrasi selesai, pakai `chatCompletion`.
- [x] Titik 5 — Daily Summary per Category (`dailySummaryPerCategory.helper.ts`): migrasi selesai, pakai `chatCompletion`.
- [x] Titik 6 — Summary Session (`summarySession.helper.ts`): migrasi selesai, panggil `NineRouterService` langsung (sebelumnya lewat `AnalyzerService.callAnalyzerProvider` yang kini sudah dihapus).
- [x] Titik 7 — Image Validation (`image-validation.processor.ts`): migrasi selesai, pakai `jsonSchema` eksplisit `{date, time}` (sebelumnya prompt-only).
- [x] Housekeeping: `AnalyzerService`, `analyzer.interface.ts`, `AnalyzerModule`, `AIGeminiModule`, provider `GEMINI_AI`, dan dependency `@google/genai` dihapus total. `services/analyzer/` di-rename/diratakan jadi `services/nine-router/`.
- [ ] Observasi latensi 9Router di titik-titik baru (sebelumnya hanya diamati di Titik 1, ~25 detik/vision call) — belum dipantau ulang pasca full rollout, terutama Titik 7 (Image Validation) yang berjalan **synchronous dalam HTTP request** (minimal 8x vision call per slot upload, blocking) — ini titik paling sensitif terhadap latensi dari semua titik yang ada.
- [ ] Logging pola `[PROVIDER=...]` yang dipakai di Titik 1 untuk membandingkan rasio sukses/fallback sudah tidak relevan lagi (tidak ada fallback) — logging sukses masih ada tapi tidak perlu dibedakan provider lagi karena hanya 9Router.

## Latar Belakang

User diminta menggunakan [9Router](https://9router.com/) — AI gateway open source (OpenAI-compatible endpoint, 60+ provider, smart fallback) — sebagai proxy untuk panggilan LLM di project ini. Endpoint yang diberikan: `https://9router.gass.web.id/v1`.

Referensi lengkap seluruh titik pemanggilan LLM yang ada di codebase (sebelum migrasi ini): lihat [docs/references/llm-call-sites.md](../../references/llm-call-sites.md) — **catatan: dokumen ini mendeskripsikan kondisi sebelum migrasi, sudah stale pasca full-replace ini**.

Riwayat keputusan:
- Migrasi awalnya direncanakan **satu per satu** dengan **fallback ke Gemini native** kalau 9Router gagal (lihat riwayat di bawah untuk pilot Titik 1).
- Setelah pilot Titik 1 terverifikasi sukses di produksi, migrasi ke titik lain **ditahan (paused)** untuk sementara atas keputusan user.
- **2026-10-24**: Daily Summary & Daily Summary per Category mulai mengalami error di produksi (Gemini sudah tidak dipakai lagi secara efektif). User memutuskan untuk **langsung full-replace semua titik sisa (2-7) ke 9Router, tanpa fallback ke Gemini sama sekali** — termasuk menghapus fallback Gemini yang masih ada di Titik 1 (pilot) demi konsistensi penuh. Keputusan ini final, bukan lagi pilot bertahap.

## Kondisi Akhir (Setelah Migrasi)

Semua 7 titik panggilan LLM, semua di `apps/server`, sekarang murni lewat `NineRouterService` (OpenAI-compatible endpoint 9Router), model `ag/gemini-3-flash` untuk semua titik:

| # | Titik | Jenis | File |
|---|---|---|---|
| 1 | Normal Analyze | vision | `analyze-image.helper.ts` (rename dari `gemini-analyze.helper.ts`) → `normal-analyze.processor.ts` |
| 2 | Manual Analyze | vision | `analyze-manual-image.helper.ts` → `manual-analyze.processor.ts` |
| 3 | Extract Datetime | vision | `extract-datetime.helper.ts` → dipanggil dari `manual-analyze.processor.ts` |
| 4 | Daily Summary | text-only | `dailySummary.helper.ts` → `daily-summary.processor.ts` |
| 5 | Daily Summary per Category | text-only | `dailySummaryPerCategory.helper.ts` → `daily-summary-category.processor.ts` |
| 6 | Summary Session | text-only | `summarySession.helper.ts` → `summary-session.processor.ts` |
| 7 | Image Validation | vision | `image-validation.processor.ts` (helper, bukan BullMQ processor) → dipanggil sync dari `image-validation.service.ts` |

Tidak ada satu chokepoint tunggal (`AnalyzerService` yang dulu jadi semi-chokepoint untuk titik 6 & 7 sudah dihapus) — tiap titik inject `NineRouterService` langsung lewat constructor (tersedia global via `NineRouterModule`).

## Arsitektur Final

Per titik, tidak ada lagi percabangan try/fallback — semua langsung:

```
Caller (processor/helper)
  → NineRouterService.analyzeImage(...)   [vision, titik 1/2/3/7]
      atau
  → NineRouterService.chatCompletion(...) [text-only, titik 4/5/6]
      ↓ sukses → return hasil
      ↓ gagal → throw (propagate ke BullMQ retry untuk titik queue-based,
                 atau ke catch block lokal untuk Titik 3 & 7 yang punya
                 fallback non-AI/toleransi null, lihat di bawah)
```

Return shape ke caller **tidak berubah** dari sebelum migrasi — tetap `{ text: string }` yang di-`JSON.parse` di tempat lama, supaya logic downstream (parsing, simpan DB, dll) tidak perlu disentuh.

### Pengecualian: fallback non-AI yang tetap dipertahankan

Dua titik punya fallback, tapi **bukan fallback antar-provider AI** — melainkan fallback ke sumber data non-AI yang sudah ada sebelum migrasi 9Router dimulai, dan tidak terkait dengan keputusan "full replace" ini:

- **Titik 3 (Extract Datetime)**: kalau 9Router gagal mengekstrak jam dari gambar (`tryNineRouter` return `null`), sistem fallback ke parsing nama file (regex `YYYY-MM-DD_HH-mm-ss`). Ini sudah ada sejak awal, dipertahankan karena alasan robustness UX (tips nama file), bukan jaring pengaman provider.
- **Titik 7 (Image Validation)**: kalau 9Router gagal atau response tidak bisa di-parse, `extractDateTime` return `{date: null, time: null}` (bukan throw) — downstream validator (`isReadableHour`/`isReadableDate`) akan menganggap gambar tidak valid dan menolaknya secara normal, bukan crash.

### Komponen Bersama

- **`NineRouterService`** (`apps/server/src/services/nine-router/nine-router.service.ts`)
  - POST ke `https://9router.gass.web.id/v1/chat/completions`
  - Auth: header `Authorization: Bearer ${process.env.NINEROUTER_API_KEY}`
  - Timeout 30s
  - **`analyzeImage(request: NineRouterVisionRequest)`** — vision, menyisipkan `image_url` content part (data URI base64).
  - **`chatCompletion(request: NineRouterTextRequest)`** — text-only, tanpa image part. Ditambahkan sebagai bagian migrasi ini untuk Titik 4, 5, 6.
  - Body format OpenAI chat-completions: `messages`, `response_format: { type: 'json_schema', json_schema: {...} }`.
- **Interface**: `apps/server/src/services/nine-router/nine-router.interface.ts` — `NineRouterVisionRequest`, `NineRouterTextRequest`, `NineRouterChatCompletionResponse`.
- **`NineRouterModule`** (`apps/server/src/services/nine-router/nine-router.module.ts`) — `@Global()`, menggantikan `AnalyzerModule` lama. Didaftarkan di `THIRD_PARTY_REGISTRY` (`third-party-registry.ts`), menggantikan entry `AIGeminiModule` + `AnalyzerModule` yang sudah dihapus.
- **Model**: `ag/gemini-3-flash` (const `NINE_ROUTER_MODEL` di tiap helper — belum dikonsolidasi ke satu tempat, lihat "Hal yang Belum Diputuskan" di bawah).
- **Env var**: `NINEROUTER_API_KEY` — satu-satunya API key AI yang dipakai sekarang. `GEMINI_API_KEY` sudah dihapus dari dokumentasi (`apps/server/README.md`), tapi **perlu dicek manual apakah masih ada di `.env` aktual di server produksi** — tidak masalah kalau masih ada (tidak dibaca lagi oleh kode), tapi bisa dihapus saat sempat untuk kebersihan.

## Housekeeping yang Dilakukan

Sebagai bagian dari full-replace ini (bukan hanya migrasi call-site, tapi juga pembersihan dependency):

- **Dihapus total**: `AnalyzerService` + `analyzer.interface.ts` (pass-through switch ke Gemini, sudah tidak dipakai setelah titik 6 & 7 migrasi), `AnalyzerModule` (diganti `NineRouterModule`), `AIGeminiModule` + provider `GEMINI_AI` (`apps/server/src/services/ai-gemini/`), dependency npm `@google/genai` (`npm uninstall`, ikut membersihkan 51 package transitive).
- **Rename/reorganisasi**: folder `services/analyzer/` (berisi `AnalyzerService` lama + `NineRouterService` nested) diratakan jadi `services/nine-router/` (flat, isinya `nine-router.service.ts`, `nine-router.interface.ts`, `nine-router.module.ts`). File `gemini-analyze.helper.ts` (Titik 1) di-rename jadi `analyze-image.helper.ts` karena sudah tidak ada jejak Gemini di dalamnya.
- **Dihapus logic yang jadi tidak relevan**: array model-tier retry (`['gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-pro-preview']`) di Titik 1 & 2 — sebelumnya dipakai untuk pilih model Gemini berdasarkan `job.attemptsMade`/`job.data.model`, sekarang tidak relevan karena 9Router pakai model fixed per helper. Dikonfirmasi tidak ada caller yang mengirim `job.data.model` secara eksternal sebelum dihapus.
- **README** (`apps/server/README.md`): baris `GEMINI_API_KEY` dihapus dari tabel env vars, dead link `src/services/ai-z/` (sisa housekeeping Zhipu/GLM sebelumnya, sudah tidak ada di filesystem) juga dibersihkan, `src/services/ai-gemini/` diganti `src/services/nine-router/`.

## Hal yang Belum Diputuskan / Perlu Ditindaklanjuti

- **Konsolidasi `NINE_ROUTER_MODEL`**: const ini sekarang terduplikasi di 6 file helper berbeda (satu per titik). Belum dipindah ke satu tempat (misal `src/constants/` atau jadi default parameter di `NineRouterService`) — kalau model perlu diganti di masa depan, harus diubah di 6 tempat manual.
- **Observasi latensi pasca full rollout**: belum ada data latensi 9Router untuk titik 2-7 di traffic nyata (hanya Titik 1 yang pernah diobservasi, ~25 detik/vision call, sebelum full-replace ini). Titik 7 (Image Validation) paling kritis untuk dipantau karena berjalan synchronous dalam request HTTP (blocking, minimal 8x vision call per slot upload) — risiko timeout/UX lambat kalau latensi 9Router konsisten tinggi.
- **`GEMINI_API_KEY` di `.env` produksi**: sudah tidak dibaca kode, tapi belum dikonfirmasi apakah sudah dihapus dari environment variable server produksi/staging. Tidak mendesak (tidak berbahaya kalau dibiarkan), tapi perlu housekeeping saat sempat.

## Riwayat

### Pilot Awal — Normal Analyze (sebelum full-replace)

Migrasi awal dimulai dengan pendekatan bertahap: pilot Titik 1 dengan pola fallback (9Router → Gemini native kalau gagal), terverifikasi sukses di traffic nyata 2026-10-01 (log `[PROVIDER=9ROUTER]` tanpa fallback, job completed normal). Setelah itu migrasi ke titik lain **ditahan** atas keputusan user, sampai akhirnya titik Daily Summary mulai gagal di produksi dan mendorong keputusan full-replace langsung ke semua titik sisa (lihat "Latar Belakang" di atas).

### Pembersihan Zhipu AI/GLM (sebelum migrasi 9Router dimulai)

Sebagai housekeeping sebelum migrasi 9Router dimulai, jalur **Zhipu AI/GLM** (provider lama yang tidak pernah punya live caller) sudah dihapus dari codebase atas permintaan user. Detail lengkap ada di `llm-call-sites.md` bagian "Riwayat".

## Status

✅ **Selesai** — semua 7 titik panggilan LLM sudah pindah ke 9Router sebagai satu-satunya provider, Gemini dihapus total dari codebase (kode & dependency). Sisa pekerjaan hanya observasi latensi pasca rollout dan housekeeping kecil (konsolidasi const model, cek env var produksi) — lihat "Hal yang Belum Diputuskan" di atas.
