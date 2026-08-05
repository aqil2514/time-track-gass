# Todo: Activity — Server-side Pagination + From/To Date Range

## Latar Belakang
Halaman activity saat ini hanya support single date (`date` param) dan load semua data sekaligus tanpa pagination. Untuk mendukung filter range (`from`/`to`), perlu ditambahkan pagination agar data multi-hari tidak overwhelming.

## Yang Perlu Dilakukan

### Backend
- [x] Tambah param `page` dan `limit` ke `SupervisorQueryDto` atau helper terkait
- [x] Ubah query `getSessionActivity` / `getRawActivities` untuk pakai `skip`/`take`
- [x] Response include metadata: `total`, `page`, `limit`, `totalPages`
- [x] Fix `buildDateRange` — `new Date(filter.from)` off-by-one di server UTC+8, gunakan `.slice(0, 10)` seperti fix di `getWorkSession`
- [x] Support `from`/`to` range di `getTrackerActivity` helper

### Frontend
- [x] Hook `use-user-actitivity-tracker.ts` — tambah baca `from`, `to`, `page`, `limit` dari query params
- [x] Tambah komponen `ActivityTablePagination` dengan prev/next/first/last, input page, dropdown rows, total records
- [x] `activity-table.tsx` — pasang pagination props
- [x] Proxy route `/api/user-activity-tracker/route.ts` forward `from`/`to`, `page`, `limit`

## Referensi
- Pagination component: `D:\Programming\Pribadi\retail-multitenant\apps\web\src\_shared\tables\data-table\data-table-pagination.tsx`
- Fix timezone serupa: `apps/server/src/helpers/supervisor/tracker/matrix/getWorkSession.helper.ts` (gunakan `date.slice(0, 10)`)
