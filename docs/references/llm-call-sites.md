# Titik Pemanggilan LLM di Codebase

> Dokumen ini adalah hasil scan menyeluruh terhadap seluruh titik pemanggilan LLM (Gemini, dll) di project ini. Tujuannya agar tidak perlu scan ulang codebase setiap kali butuh konteks ini — cukup baca file ini.
>
> Scope: hanya `apps/server` yang memanggil LLM. `apps/web` dan `apps/desktop` tidak ada pemanggilan LLM.
>
> Terakhir di-scan: 2026-10-01.
> Update 2026-10-01: jalur Zhipu AI/GLM (tidak pernah dipakai) telah **dihapus** dari codebase atas permintaan user. Bagian di bawah sudah disesuaikan — riwayat jalur Zhipu dipindah ke bagian "Riwayat" di akhir dokumen untuk konteks historis saja.
> Update 2026-10-01 (lanjutan): mulai integrasi **9Router** (`https://9router.gass.web.id/v1`, model `ag/gemini-3.6-flash-low`) sebagai primary provider dengan fallback ke Gemini native bila gagal. **Pilot pertama**: jalur Normal Analyze (lihat bagian 6). Rencana: setelah pilot terverifikasi, lanjutkan ke 5 titik Gemini lainnya.

## Ringkasan

- **1 provider aktif**: **Google Gemini** (`@google/genai` SDK).
- **Tidak ada** penggunaan OpenAI SDK, Anthropic SDK, atau LangChain.
- Ada lapisan abstraksi nominal (`AnalyzerService`), tapi **tidak konsisten dipakai** — hanya 2 dari 6 titik panggilan Gemini yang lewat situ; 4 sisanya inject `GoogleGenAI` langsung ke processor/helper masing-masing.
- Semua panggilan Gemini bersifat **non-streaming** (`generateContent`), tidak ada streaming/tool-calling/embeddings.
- `OPENROUTER_API_KEY` ada di `.env` / `.env.production.local` / `.env.vps` tapi **tidak pernah dipakai di kode** — dead config.

| # | Provider | SDK / Metode | Gaya Panggilan |
|---|---|---|---|
| 1 | Google Gemini | `@google/genai` (`GoogleGenAI` client) | Native SDK, non-streaming `generateContent`, JSON-schema structured output, vision (inline base64 image) |

---

## 1. Konstruksi Client Provider (DI Providers)

### Gemini
- **File**: `apps/server/src/services/ai-gemini/ai-gemini.module.ts:8-13`
- Provider token NestJS global: `'GEMINI_AI'`
- Konstruksi: `new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })`
- Tidak ada override `baseUrl`/`httpOptions` di manapun — selalu ke endpoint default Google.

---

## 2. Lapisan Abstraksi — `AnalyzerService`

**File**: `apps/server/src/services/analyzer/services/analyzer.service.ts`

Method `callAnalyzerProvider(body)` switch berdasarkan `body.provider`:
- `'gemini-ai'` → `this.geminiAI.models.generateContent(body)`
- provider lain → throw `Error('Provider tidak valid')`

### Caller yang lewat abstraksi ini (hanya 2 titik):

1. **`apps/server/src/helpers/activities/processor/summarySession.helper.ts:125-133`**
   - Model: `'gemini-flash-latest'`
   - Text-only, JSON-schema structured output (judul/deskripsi sesi)

2. **`apps/server/src/app/image-upload/services/image-validation/image-validation.processor.ts:50-67`**
   - Model: `'gemini-flash-latest'`
   - Vision call (inline base64 PNG) — ekstrak tanggal/waktu dari screenshot taskbar

---

## 3. Panggilan Gemini yang Bypass `AnalyzerService` (Inject Langsung)

Titik-titik ini inject `'GEMINI_AI'` langsung via `@Inject('GEMINI_AI') gemini: GoogleGenAI` dan panggil `gemini.models.generateContent(...)` sendiri — **tidak lewat `AnalyzerService`**.

### 3.1 Normal Analyze (image-upload)
- **Processor**: `apps/server/src/app/image-upload/processor/normal-analyze.processor.ts:32-33,72`
- **Helper**: `apps/server/src/helpers/image-upload/normal-analyze-processor/gemini-analyze.helper.ts:59-66` (fungsi `analyzeImage`)
- Vision call (fetch image dari URL, base64-encode), JSON-schema structured output
- Model **dinamis**, dipilih dari array retry-tier di `normal-analyze.processor.ts:26`:
  ```
  ['gemini-flash-latest', 'gemini-3.7-flash', 'gemini-3.1-pro-preview']
  ```
  diindeks pakai `job.attemptsMade`

### 3.2 Manual Analyze (image-upload)
- **Processor**: `apps/server/src/app/image-upload/processor/manual-analyze.processor.ts:33-34,109`
- **Helper**: `apps/server/src/helpers/image-upload/manual-analyze-processor/analyze-manual-image.helper.ts:43-50` (fungsi `analyzeManualImage`)
- Vision + JSON-schema, pola sama dengan Normal Analyze
- Model-tier array di baris 18 (file processor), atau pakai `job.data.model` kalau disuplai caller

- **Helper tambahan**: `apps/server/src/helpers/image-upload/manual-analyze-processor/extract-datetime.helper.ts:46-63` (fungsi `tryGemini`)
  - Vision call lain, client yang sama, model diteruskan dari processor

### 3.3 Daily Summary
- **Processor**: `apps/server/src/app/activities/processor/daily-summary.processor.ts:22,59-63`
- **Helper**: `apps/server/src/helpers/activities/processor/dailySummary.helper.ts:163-178` (fungsi `analyzeSummaryByAi`, dipanggil dari `mapToDailySummaryDbInsert`)
- Text-only, model hardcoded `'gemini-flash-latest'`, JSON-schema (`responseSchema`) structured output

### 3.4 Daily Summary per Category
- **Processor**: `apps/server/src/app/activities/processor/daily-summary-category.processor.ts:21,56-62`
- **Helper**: `apps/server/src/helpers/activities/processor/dailySummaryPerCategory.helper.ts:143-167` (fungsi `getDailyAiSummary`)
- Text-only, model hardcoded `'gemini-flash-latest'`, JSON-schema structured output, kategorisasi activity log

---

## 4. Rincian Jenis Panggilan

- Semua **6 titik panggilan Gemini** pakai `generateContent` non-streaming — tidak ada streaming, tool/function calling, atau embeddings.
- **4 dari 6** adalah panggilan **vision** (inline base64 image + text prompt):
  - `image-validation.processor.ts`
  - `gemini-analyze.helper.ts`
  - `analyze-manual-image.helper.ts`
  - `extract-datetime.helper.ts`
- **3 dari 6** adalah panggilan **text-only**: `summarySession.helper.ts`, `dailySummary.helper.ts`, `dailySummaryPerCategory.helper.ts`
- Semua panggilan Gemini pakai `config.responseMimeType: 'application/json'` + `responseJsonSchema`/`responseSchema` untuk structured JSON output.

---

## 5. Implikasi untuk Migrasi Proxy (mis. 9Router / OpenRouter)

- **Jalur Gemini** adalah satu-satunya traffic nyata, tapi pakai bentuk request/response native SDK `@google/genai` (`contents`/`parts`/`inlineData`, `responseJsonSchema`, accessor `.text`) — **bukan** format wire OpenAI. Mengarahkan client `GoogleGenAI` ke base URL proxy lain **tidak akan membuatnya bicara format OpenAI** — perlu rewrite semua 6 titik panggilan (minimal konstruksi client + bentuk tiap panggilan `generateContent`) ke format OpenAI chat-completions.
- **Tidak ada satu chokepoint** — `AnalyzerService` hanya mencegat 2 dari 6 titik; 4 sisanya inject `'GEMINI_AI'` langsung ke processor/helper. Migrasi provider idealnya didahului konsolidasi semua 6 titik ke satu service/module bersama, supaya migrasi provider ke depannya tidak perlu sentuh banyak file lagi (pola serupa dengan "route everything through one helper" yang sudah dipakai di `auth.service.ts`).
- `OPENROUTER_API_KEY` di file env adalah konfigurasi mati — bukan masalah migrasi langsung, tapi mengindikasikan OpenRouter (sama-sama OpenAI-compatible, satu kategori dengan 9Router) mungkin pernah dicoba lalu ditinggalkan di tengah jalan.

---

## 6. Integrasi 9Router (Sedang Berjalan)

**Status**: pilot di satu titik (Normal Analyze), belum di-rollout ke titik lain.

### Komponen baru
- **Service**: `apps/server/src/services/analyzer/services/nine-router/nine-router.service.ts` (`NineRouterService.analyzeImage`)
  - POST ke `https://9router.gass.web.id/v1/chat/completions`
  - Auth: header `Authorization: Bearer ${process.env.NINEROUTER_API_KEY}`
  - Request body format OpenAI chat-completions (messages + `image_url` content part untuk vision, `response_format: json_schema`)
  - Timeout 30s
  - Didaftarkan & diexport dari `AnalyzerModule` (`@Global()`, jadi otomatis tersedia di semua module tanpa import eksplisit)
- **Interface**: `apps/server/src/services/analyzer/interfaces/nine-router.interface.ts` (`NineRouterVisionRequest`, `NineRouterChatCompletionResponse`)
- **Model dipakai**: `ag/gemini-3.6-flash-low` (konstanta `NINE_ROUTER_MODEL` di `gemini-analyze.helper.ts`)
- **Env var baru**: `NINEROUTER_API_KEY` (lihat `apps/server/README.md`)

### Pilot: Normal Analyze
- **File diubah**:
  - `apps/server/src/helpers/image-upload/normal-analyze-processor/gemini-analyze.helper.ts` — tambah fungsi `analyzeImageViaGateway(nineRouter, gemini, model, prompt, imageUrl)`. Fungsi lama `analyzeImage` (native Gemini) **tetap dipertahankan** sebagai fallback internal, dipanggil di blok `catch` kalau 9Router gagal (timeout/error/non-2xx). Logic fetch+base64 image diekstrak ke helper lokal `fetchImageAsBase64` supaya tidak duplikasi antara jalur 9Router dan jalur fallback Gemini.
  - `apps/server/src/app/image-upload/processor/normal-analyze.processor.ts` — inject `NineRouterService`, ganti panggilan `analyzeImage(...)` jadi `analyzeImageViaGateway(this.nineRouter, this.gemini, model, prompt, imageUrl)`. Return shape tetap `{ text: string }` jadi tidak ada perubahan di logic `JSON.parse(res.text)` setelahnya.
- **Perilaku fallback**: kalau request ke 9Router throw error apapun, di-catch dan log `Logger.warn`, lalu otomatis retry pakai Gemini native dengan model yang sama seperti sebelumnya (dari array retry-tier `models[job.attemptsMade]`). Tidak ada perubahan pada mekanisme retry BullMQ yang sudah ada di processor.
- **Yang TIDAK diubah**: 5 titik Gemini lain (Manual Analyze, Extract Datetime, Daily Summary, Daily Summary per Category, Summary Session via `AnalyzerService`) — masih 100% native Gemini, belum disentuh.

### Langkah berikutnya (belum dikerjakan)
Setelah pilot Normal Analyze terverifikasi jalan (termasuk skenario fallback-nya), rencana lanjutan: terapkan pola `analyzeImageViaGateway`/`callViaGateway` yang sama ke 5 titik lainnya, idealnya dikonsolidasi lewat `AnalyzerService` agar tidak ada lagi 4 titik yang inject `GEMINI_AI` langsung.

---

## 7. Riwayat (Historical) — Jalur Zhipu AI (Dihapus)

Sebelumnya ada jalur kedua ke **Zhipu AI / GLM** (`open.bigmodel.cn`) via raw HTTP (`@nestjs/axios`), dengan body format mirip OpenAI chat-completions (`model`/`messages`/`temperature`/`response_format`). Jalur ini **tidak pernah punya live caller** di kode aplikasi (wired tapi tidak tereksekusi) dan **dihapus pada 2026-10-01** atas permintaan user karena memang tidak dipakai.

File/kode yang dihapus saat itu:
- `apps/server/src/services/analyzer/services/zhipu-ai/zhipu-ai.service.ts` (fungsi `callZApi`)
- `apps/server/src/services/analyzer/interfaces/zhipu-ai.interface.ts`
- Referensi `ZhipuAiService` di `analyzer.service.ts` dan `analyzer.module.ts`
- Enum `AnalyzerProvider.ZHIPU_AI` dan tipe `ZhipuAiProvider` di `analyzer.interface.ts`
- Baris `Z_AI_API_KEY` di `apps/server/README.md` (tabel env vars)

Catatan: variabel `Z_AI_API_KEY` mungkin masih tersisa di file `.env`/`.env.production.local`/`.env.vps` (tidak dihapus otomatis karena berisi kredensial) — aman diabaikan/dibersihkan manual kalau perlu.
