# Log Endpoints

## Core (`/log`)

### POST /log
Menyimpan log aktivitas aplikasi dari sisi client ke database.
- **Guard:** JwtAuthGuard
- **Body:** `AppLogInsertClient` (level, os?, message, context, metadata)
- **Response:** `{ success: true }`
