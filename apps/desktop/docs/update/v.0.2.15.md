- Tambah auto resume timer setelah hard refresh
- Tambah indikator session resumed otomatis
- Indikator auto resume akan hilang otomatis setelah beberapa detik

## Fitur Auto Resume Session
- Jika user melakukan hard refresh saat work session masih aktif, desktop akan mendeteksi session aktif dari data home
- Auto capture akan berjalan kembali otomatis tanpa perlu menekan tombol Start Session lagi
- Badge `Session resumed automatically` ditampilkan sebagai indikator bahwa session dipulihkan otomatis
- Badge notifikasi hanya muncul sementara lalu hilang otomatis
- Implementasi ini berbasis state frontend dan tetap kompatibel dengan Windows, macOS, dan Linux
