# Rule Refactor Server (Supabase → Prisma)

## 1. Helper File

- Letakkan semua logika di helper file, bukan di service
- Nama file = nama method + `.helper.ts` (contoh: `getAllDivisions.helper.ts`)
- Jika helper hanya dipakai satu flow, boleh digabung dalam satu file (contoh: `login.helper.ts`)
- Urutan fungsi dalam file mengikuti urutan pemanggilan di orkestrator
- Dependency seperti `PrismaService` dipass sebagai parameter fungsi, bukan di-inject

## 2. Service (Orkestrator)

- Service hanya memanggil helper berurutan, tidak ada logika sendiri
- Setiap pemanggilan helper diberi komentar `// Step N: keterangan`
- Boleh menggunakan `Promise.all` untuk step yang independen (tidak saling bergantung), tetapi tetap diberi komentar per step di dalam array

## 3. Interface

- Jangan ubah interface yang sudah ada
- Type mismatch dari Prisma (misal `bigint` vs `number`, `JsonValue` vs custom type) diselesaikan dengan `as unknown as Type` di helper

## 4. File Lama

- Jangan hapus file lama sampai semua fitur dalam module selesai direfactor
- File lama tetap berjalan untuk fitur yang belum direfactor

## 5. Scope

- Jangan sentuh file di luar scope fitur yang sedang dikerjakan
- Refactor dilakukan per fitur (per endpoint), tidak sekaligus
