# Todo: Attendance — Weekly Mode Date Filter Redesign

## Latar Belakang
Weekly mode saat ini pakai `DashboardDateFilter` (komponen `from`/`to` range), tapi BE hanya butuh satu tanggal untuk compute `startOfWeek`/`endOfWeek`. Ada diskusi untuk mengganti ke full DateFilter (`from`/`to`) agar user bisa pilih range bebas.

## Opsi yang Didiskusikan

### Opsi A: Ganti ke date picker sederhana (rekomendasi)
- Ganti `DashboardDateFilter` dengan input date tunggal
- BE tetap compute Senin–Minggu dari tanggal yang dipilih
- Konsisten dengan alur monthly (pilih parameter → BE compute range)
- Tidak ada perubahan logika status (`min_hours_weekly`)

### Opsi B: Full DateFilter (`from`/`to` bebas)
- User pilih range bebas, BE pakai range tersebut langsung
- Perlu hapus logic `startOfWeek`/`endOfWeek` di BE
- Perlu fix timezone bug di `buildDateRange` (`new Date(filter.from)` off-by-one di UTC+8 server)
- **Masalah:** Status (Complete/Incomplete) dibandingkan `min_hours_weekly` (misal 40 jam) — threshold jadi ambigu kalau user pilih range 3 hari
- Perlu keputusan: apakah status tetap ditampilkan, atau hanya total jam?

## Keputusan yang Sudah Ditetapkan
- **Opsi A dipilih** — ganti `DashboardDateFilter` dengan 3 Select komponen: Tahun, Bulan, Minggu
- **Minggu lintas bulan dihitung satu periode penuh** — misal Senin 31 Agustus s/d Minggu 6 September tetap dihitung sebagai satu minggu dengan threshold penuh (`min_hours_weekly`), tidak dipecah per bulan

## Implementasi Weekly Filter (3 Select)

Ganti `DashboardDateFilter` di weekly mode dengan 3 komponen `Select` dari shadcn, konsisten dengan monthly mode.

### UI
```
Tahun: [2026]   Bulan: [Agustus]   Minggu: [Minggu ke-2 (3 Agu – 9 Agu)]
```

### Logika Generate List Minggu (FE, `date-fns`)
- Dari bulan yang dipilih, hitung semua minggu (Senin–Minggu) yang overlap dengan bulan tersebut
- Termasuk minggu lintas bulan (awal dan akhir bulan)
- Label: `"Minggu ke-N (DD Mon – DD Mon)"`
- Contoh Agustus 2026:
  - Minggu ke-1 (27 Jul – 2 Agu)
  - Minggu ke-2 (3 Agu – 9 Agu)
  - Minggu ke-3 (10 Agu – 16 Agu)
  - Minggu ke-4 (17 Agu – 23 Agu)
  - Minggu ke-5 (24 Agu – 30 Agu)
  - Minggu ke-6 (31 Agu – 6 Sep)

### Yang Dikirim ke BE
- Kirim tanggal Senin dari minggu yang dipilih sebagai `date` param
- BE tetap pakai logic `startOfWeek`/`endOfWeek` yang sudah ada — tidak perlu ubah BE

### File yang Perlu Diubah
- `apps/web/src/features/attendance/components/contents/summary/controller/work-summary-filter.tsx` — ganti `DashboardDateFilter` dengan 3 Select, tambah helper `getWeeksInMonth(year, month)`

## Kolom Selisih (Difference Column)

Tambah kolom baru di tabel yang menampilkan selisih antara total jam aktual vs target jam:
- Positif → **+2j 30m** (lebih dari target)
- Negatif → **-5j 15m** (kurang dari target)

### Yang Perlu Dicek
- Apakah `AttendanceSummary` response sudah include target jam (`min_hours_weekly` / `min_hours_monthly`), atau hanya `totalWorkTime`?
  - Jika sudah ada: cukup tambah kolom computed di `columns.tsx` (FE only)
  - Jika belum: perlu BE kirim field tambahan (misal `targetMinutes` atau `diffMinutes`)

### Referensi Kolom
- Tabel kolom: `apps/web/src/features/attendance/components/contents/summary/table/columns.tsx`
- Interface: cari `AttendanceSummary` di `apps/web/src/features/attendance/`

## Referensi
- Filter UI: `apps/web/src/features/attendance/components/contents/summary/controller/work-summary-filter.tsx`
- BE query DTO: `apps/server/src/app/supervisor/_dto/attendance/attendance-logs-query.dto.ts`
- Timezone bug: `apps/server/src/shared/helpers/build-date-range.helper.ts` (`new Date(filter.from)` perlu diganti `filter.from.slice(0, 10)`)
