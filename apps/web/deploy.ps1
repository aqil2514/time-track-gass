# Konfigurasi Server
$SERVER_USER = "aqil"
$SERVER_IP = "172.232.249.173"
$REMOTE_PATH = "/home/aqil/timetrack/web"

Write-Host "--- 1. Memulai Build Lokal (Standalone Mode) ---" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build Gagal!" -ForegroundColor Red
    exit
}

Write-Host "--- 2. Menyiapkan Aset Statis & Bundle ---" -ForegroundColor Cyan
# Standalone tidak menyertakan folder public dan static secara otomatis
# Kita perlu menyalinnya ke dalam folder standalone sebelum dikompres
Copy-Item -Path "public" -Destination ".next/standalone/public" -Recurse -Force
New-Item -ItemType Directory -Force -Path ".next/standalone/.next/static"
Copy-Item -Path ".next/static\*" -Destination ".next/standalone/.next/static" -Recurse -Force

# Kompres isi folder standalone (ini adalah paket siap jalan)
Set-Location ".next/standalone"
Compress-Archive -Path * -DestinationPath "..\..\deploy.zip" -Force
Set-Location "..\..\"

Write-Host "--- 3. Mengirim Bundle ke Server ---" -ForegroundColor Cyan
# Kirim zip dan env produksi
scp deploy.zip "$($SERVER_USER)@$($SERVER_IP):$($REMOTE_PATH)/"
scp .env.production "$($SERVER_USER)@$($SERVER_IP):$($REMOTE_PATH)/.env"

Write-Host "--- 4. Ekstrak & Restart PM2 di Server ---" -ForegroundColor Cyan
# Catatan: Kita menjalankan 'server.js', bukan 'npm start'
# Tidak perlu 'npm install' lagi di server
ssh "$($SERVER_USER)@$($SERVER_IP)" "cd $($REMOTE_PATH) && unzip -o deploy.zip && rm deploy.zip && pm2 restart timetrack-web || pm2 start server.js --name timetrack-web"

Write-Host "--- SELESAI! Silakan cek supervisortime.gass.co.id ---" -ForegroundColor Green