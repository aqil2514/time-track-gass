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
- Node.js 18+
- pnpm
- Docker (for PostgreSQL)

### Setup

1. Start database:
```bash
cd docker && docker-compose up -d
```

2. Run migrations:
```bash
docker exec -i timetrack-db psql -U timetrack -d timetrack < backend/migrations/001_init.up.sql
```

3. Start backend:
```bash
pnpm dev:backend
```

## Tech Stack

- Tauri 2.0
- React 18
- shadcn/ui
- Go 1.21+
- Gin
- PostgreSQL 16
- TimescaleDB
