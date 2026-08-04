# Todo: Matrix — Tooltip Breakdown Aktivitas per Kategori

## Latar Belakang
Saat ini tooltip box matrix hanya menampilkan total laporan valid (idle & unclassified sudah difilter di BE sejak query). Ingin ditambahkan breakdown lengkap: valid, unclassified, dan idle — masing-masing dengan jumlah laporan dan total menit.

## Target Tampilan Tooltip
```
✅ Valid        : 5 laporan (~25 menit)
❓ Unclassified : 2 laporan (~10 menit)
💤 Idle         : 1 laporan (~5 menit)
```

## Yang Perlu Dilakukan

### Backend
- [ ] `getOneDayActivity.helper.ts` — hapus filter `NOT: { category: { in: ['unclassified', 'idle'] } }` atau buat query terpisah yang include semua kategori
- [ ] `mapToMatrixData.helper.ts` — ubah struktur `newActivity` untuk include breakdown per kategori:
  ```ts
  newActivity: {
    totalActivity: number;   // hanya valid
    totalMinutes: number;    // hanya valid
    unclassified: { count: number; minutes: number };
    idle: { count: number; minutes: number };
  }[]
  ```

### Frontend
- [ ] `matrix.types.ts` — update interface `MatrixResponse` sesuai struktur baru
- [ ] `activity.tsx` — update tooltip section "Info Aktivitas" untuk tampilkan tiga baris breakdown
- [ ] Pastikan intensity (warna box) tetap hanya dihitung dari aktivitas valid, bukan unclassified/idle

## Referensi
- Query saat ini: `apps/server/src/helpers/supervisor/tracker/matrix/getOneDayActivity.helper.ts`
- Mapping: `apps/server/src/helpers/supervisor/tracker/matrix/mapToMatrixData.helper.ts`
- Tooltip: `apps/web/src/features/matrix/components/data/user-data/activity.tsx`
