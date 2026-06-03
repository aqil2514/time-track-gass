# Auth Endpoints

## Core (`/auth`)

### GET /auth/me
Mengembalikan data user yang sedang login berdasarkan JWT token.
- **Guard:** JwtAuthGuard
- **Response:** Data user dari payload JWT

### GET /auth/divisions
Mengembalikan daftar semua divisi yang tersedia untuk keperluan registrasi.
- **Guard:** -
- **Response:** Array divisi

### GET /auth/me/supervisor
Mengembalikan data supervisor yang sedang login berdasarkan cookie JWT.
- **Guard:** JwtAuthSupervisorGuard
- **Response:** Data supervisor dari payload JWT

### POST /auth/register
Mendaftarkan akun baru. Memvalidasi username/email belum dipakai, lalu membuat profil baru.
- **Guard:** -
- **Body:** `RegisterDto` (username, email, password, divisionId, dll)
- **Response:** Pesan sukses registrasi

### POST /auth/login
Login sebagai user biasa. Mengembalikan JWT token untuk dipakai di header Authorization.
- **Guard:** -
- **Body:** `LoginDto` (email/username, password)
- **Response:** `{ message, token }`

### POST /auth/login/supervisor
Login sebagai supervisor. Token disimpan ke cookie `access_token` (httpOnly).
- **Guard:** -
- **Body:** `LoginDto` (email/username, password)
- **Response:** `{ message, accessToken }`

### POST /auth/logout/supervisor
Logout supervisor dengan menghapus cookie `access_token`.
- **Guard:** -
- **Response:** `{ message }`

### POST /auth/check-reset-password
Memvalidasi apakah identifier (email/username) boleh melakukan reset password. Dipakai sebelum langkah set-reset-password.
- **Guard:** -
- **Body:** `CheckResetPasswordDto` (identifier)
- **Response:** Data partial user (nama, dll) sebagai konfirmasi

### POST /auth/set-reset-password
Mengeset password baru setelah proses check-reset-password berhasil.
- **Guard:** -
- **Body:** `SetResetPasswordDto` (identifier, newPassword)
- **Response:** Pesan sukses

---

## Setting (`/auth/setting`)

### GET /auth/setting
Mengambil data settings milik user yang sedang login (termasuk konfigurasi tracker mode).
- **Guard:** JwtAuthGuard
- **Response:** `UserSettings`

### PATCH /auth/setting/tracker
Mengubah tracker mode user (misalnya: manual / auto).
- **Guard:** JwtAuthGuard
- **Body:** `{ newValue: string }`
- **Response:** `{ success: true }`
