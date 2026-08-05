# Todo: Matrix — Multi-Day View (GitHub-style)

## Latar Belakang
Matrix saat ini hanya support single date (grid 24 jam × user). Ingin ditambahkan mode multi-day mirip GitHub contribution graph: kolom = tanggal, baris = user, cell intensity berdasarkan total aktivitas hari itu.

## Target Tampilan

### Single date (tetap seperti sekarang)
- Kolom = jam (0–23)
- Tooltip = breakdown per jam

### Multi-day (baru)
- Kolom = tanggal (dari `from` s/d `to`)
- Baris = user
- Cell intensity = total aktivitas/menit hari itu
- Tooltip per cell:
  ```
  📅 2026-08-04
  📊 12 laporan · 60 menit

  [Lihat Aktivitas] [Lihat Matrix]
  ```
- Deep link "Lihat Aktivitas" → halaman aktivitas user di tanggal tersebut (sudah tersedia)
- Deep link "Lihat Matrix" → matrix single-day di tanggal tersebut (sudah tersedia)

## Keputusan yang Sudah Ditetapkan
- **Pisah endpoint** — single date dan multi-day pakai endpoint berbeda
- **Multi-day tidak bawa `workSession` / `workAdjustment`** — tidak relevan untuk overview, lebih ringan
- Filter pakai `from` & `to` (DTO `DateFilterDto` sudah punya field ini)
- **Maksimal rentang 1 tahun** — alasan UX (grid 365 kolom susah dibaca), bukan performance
- **Query pakai GROUP BY** di DB level (`GROUP BY user_id, DATE(created_at)`) — tidak tarik raw record, langsung agregat

## Yang Perlu Dilakukan

### Backend
- [x] Buat helper `getDateRangeActivity.helper.ts` — query `ai_screen_report` dari `from` ke `to`, agregat per user per hari (count + total minutes), exclude unclassified/idle
- [x] Buat helper `mapToMultiDayMatrix.helper.ts` — map hasil query ke struktur `dailyActivity[]`
- [x] Tambah endpoint baru di `tracker.controller.ts`: `GET /supervisor/tracker/matrix/range?from=...&to=...`
- [x] Tambah method di `tracker.service.ts` untuk handle endpoint baru

**Response structure multi-day (per user):**
```ts
{
  userId: string;
  fullName: string;
  division: string;
  userName: string;
  dailyActivity: {
    date: string;          // "2026-08-01"
    totalActivity: number; // jumlah laporan valid
    totalMinutes: number;  // total menit
  }[];
}
```

### Frontend
- [x] Buat API route baru `apps/web/src/app/api/user-activity-matrix-range/route.ts` — forward `from` & `to` ke BE
- [x] Tambah type `MatrixRangeResponse` di `matrix.types.ts`
- [x] Update `MatrixProvider` — detect mode: jika ada `from` & `to` → fetch endpoint range, jika ada `date` → fetch endpoint single
- [x] Buat komponen grid multi-day (kolom dinamis berdasarkan jumlah hari)
- [x] Tooltip cell dengan 2 deep link (Lihat Aktivitas, Lihat Matrix)
- [x] Filter UI — tambah opsi range date picker (sudah ada `DashboardDateFilter` yang support range)
- [x] Intensity warna tetap hanya dari aktivitas valid (bukan unclassified/idle)

## Referensi
- Endpoint single: `GET /supervisor/tracker/matrix?date=...`
- Controller: `apps/server/src/app/supervisor/tracker/tracker.controller.ts`
- Service: `apps/server/src/app/supervisor/tracker/tracker.service.ts`
- Helper single: `apps/server/src/helpers/supervisor/tracker/matrix/getOneDayActivity.helper.ts`
- FE provider: `apps/web/src/features/matrix/provider/matrix.provider.tsx`
- FE types: `apps/web/src/features/matrix/types/matrix.types.ts`
- FE API route: `apps/web/src/app/api/user-activity-matrix/route.ts`
