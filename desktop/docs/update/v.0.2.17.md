- Tambah logging khusus macOS untuk flow timer, capture, dan upload otomatis
- Tambah drift detection untuk mendeteksi kemungkinan timer tertunda karena sleep/suspend
- Tambah popup saat auto upload berjalan tanpa session aktif

## Observability macOS
- Desktop mencatat lifecycle auto screenshot khusus macOS agar masalah tracker lebih mudah ditelusuri
- Event yang dicatat mencakup timer start, jadwal capture berikutnya, trigger capture, hasil upload, retry, dan error final
- Flow capture macOS juga mencatat pengecekan permission, native capture start, capture sukses, dan capture gagal
- Log tidak menyimpan token dan tidak menyimpan data screenshot/base64

## Drift Detection
- Saat auto capture berjalan, desktop melakukan heartbeat ringan setiap beberapa detik untuk mendeteksi gap waktu yang tidak normal
- Jika heartbeat terlambat jauh, desktop mencatat event `mac_timer_drift_detected`
- Event ini membantu mengidentifikasi kemungkinan app sempat sleep, suspend, atau tertahan oleh lifecycle macOS
- Drift detection hanya mencatat log dan tidak menampilkan popup agar tidak mengganggu user

## Penanganan Session Tidak Aktif
- Jika server menolak auto upload karena tidak ada work session aktif, desktop akan menghentikan timer lokal
- Window aplikasi akan dibawa ke depan agar user melihat kondisi tracker
- Desktop menampilkan popup agar user memulai session kembali
- Error ini tidak di-retry karena membutuhkan aksi user
