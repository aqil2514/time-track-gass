# Todo: Activity — Server-side Pagination + From/To Date Range

## Latar Belakang
Halaman activity saat ini hanya support single date (`date` param) dan load semua data sekaligus tanpa pagination. Untuk mendukung filter range (`from`/`to`), perlu ditambahkan pagination agar data multi-hari tidak overwhelming.

## Yang Perlu Dilakukan

### Backend
- [ ] Tambah param `page` dan `limit` ke `SupervisorQueryDto` atau helper terkait
- [ ] Ubah query `getSessionActivity` / `getRawActivities` untuk pakai `skip`/`take`
- [ ] Response include metadata: `total`, `page`, `limit`, `totalPages`
- [ ] Fix `buildDateRange` — `new Date(filter.from)` off-by-one di server UTC+8, gunakan `.slice(0, 10)` seperti fix di `getWorkSession`

### Frontend
- [ ] Hook `use-user-actitivity-tracker.ts` — tambah baca `from`, `to`, `page`, `limit` dari query params
- [ ] Tambah komponen pagination ke `DataTable` (referensi: `DataTablePagination` di retail-multitenant `apps/web/src/_shared/tables/data-table/data-table-pagination.tsx`)
- [ ] `activity-table.tsx` — pasang pagination props
- [ ] Proxy route `/api/user-activity/route.ts` sudah forward `from`/`to`, tidak perlu diubah

## Referensi
- Pagination component: `D:\Programming\Pribadi\retail-multitenant\apps\web\src\_shared\tables\data-table\data-table-pagination.tsx`
- Fix timezone serupa: `apps/server/src/helpers/supervisor/tracker/matrix/getWorkSession.helper.ts` (gunakan `date.slice(0, 10)`)
