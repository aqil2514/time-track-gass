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

## Keputusan yang Diperlukan
- Opsi mana yang dipilih?
- Jika Opsi B: bagaimana handle status threshold untuk range bebas?

## Keputusan Bisnis yang Sudah Ditetapkan
- **Minggu lintas bulan dihitung satu periode penuh** — misal Senin 31 Agustus s/d Minggu 6 September tetap dihitung sebagai satu minggu dengan threshold penuh (`min_hours_weekly`), tidak dipecah per bulan.

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
