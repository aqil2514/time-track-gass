# TimeTrack

Personal time tracking app with AI-powered screenshot analysis and supervisor sharing capabilities.

## Architecture

- **Desktop App**: Tauri + React + shadcn (screenshot capture + local dashboard)
- **Backend API**: Go + Gin (auth, activity, sharing, AI proxy)
- **Web Dashboard**: React + shadcn (supervisor view)
- **Database**: PostgreSQL + TimescaleDB (time-series optimized)

## Development

### Prerequisites

- Go 1.21+
- Rust 1.70+ (with Cargo) - Required for Tauri desktop app
- **Visual Studio Build Tools 2019+** (Windows only) - Required for Rust compilation
  - Install from: https://visualstudio.microsoft.com/downloads/
  - Select "Desktop development with C++" workload
- Node.js 18+
- pnpm
- Docker (for PostgreSQL)

### Setup

1. Start database:
```bash
cd docker && docker-compose up -d
```

2. Run migrations (from project root):

**Bash/Linux/Mac:**
```bash
docker exec -i timetrack-db psql -U timetrack -d timetrack < backend/migrations/001_init.up.sql
```

**PowerShell (Windows):**
```powershell
Get-Content backend/migrations/001_init.up.sql | docker exec -i timetrack-db psql -U timetrack -d timetrack
```

**Note:** If running from the `docker` directory, use `../backend/migrations/001_init.up.sql` instead.

3. Start backend (di terminal terpisah):
```bash
pnpm dev:backend
```
Backend akan berjalan di `http://localhost:8080`

4. Start desktop app (di terminal terpisah):
```bash
# Dari root project:
pnpm dev:desktop

# Atau dari folder desktop:
cd desktop
pnpm tauri
```

**⚠️ PENTING:**
- **Tauri window akan terbuka OTOMATIS** setelah menjalankan perintah di atas
- **JANGAN buka http://localhost:1420 di browser secara manual!**
- Gunakan aplikasi di **Tauri window** yang terbuka otomatis
- Jika Anda melihat warning "Aplikasi Dibuka di Browser", berarti Anda membuka browser secara manual - tutup browser dan jalankan `pnpm dev:desktop` lagi
- Pastikan backend sudah running sebelum membuka desktop app

### Menjalankan Semua Komponen

Untuk development, Anda perlu menjalankan 3 komponen secara bersamaan (di terminal terpisah):

**Terminal 1 - Database:**
```bash
cd docker && docker-compose up
```

**Terminal 2 - Backend:**
```bash
pnpm dev:backend
```

**Terminal 3 - Desktop App:**
```bash
pnpm dev:desktop
```

### Build Production

**Build Desktop App:**
```bash
cd desktop
pnpm build
```
Output akan berada di `desktop/src-tauri/target/release/`

**Build Backend:**
```bash
pnpm build:backend
```
Binary akan berada di `backend/bin/api`

### Troubleshooting

**Rust Build Errors on Windows:**
- If you get metadata errors or linker errors, try cleaning the build cache:
  ```powershell
  cd desktop/src-tauri
  cargo clean
  ```
- Ensure Visual Studio Build Tools are properly installed with C++ workload
- If linker errors persist, try rebuilding with single thread:
  ```powershell
  $env:CARGO_BUILD_JOBS = "1"
  cargo build
  ```

**Port Already in Use:**
- The dev server automatically kills processes on port 1420 before starting
- If issues persist, manually kill the port:
  ```powershell
  cd desktop
  pnpm run kill-port
  ```

## Tech Stack

- Tauri 2.0
- React 18
- shadcn/ui
- Go 1.21+
- Gin
- PostgreSQL 16
- TimescaleDB
