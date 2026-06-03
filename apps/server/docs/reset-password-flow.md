# Reset Password Flow

Dokumen ini menjelaskan update alur reset password untuk aplikasi internal perusahaan.

## Ringkasan perubahan

Sebelumnya reset password dipahami sebagai menghapus password user. Sekarang alur diubah agar status reset dipisahkan dari nilai password.

Kolom database yang dipakai:

- `must_reset_password boolean not null default false`

Dengan pendekatan ini:

- password lama tidak perlu dihapus saat supervisor melakukan reset
- login normal diblok selama `must_reset_password = true`
- user harus membuat password baru untuk mengaktifkan akun kembali

## Alur end-to-end

### 1. Supervisor reset password user

Endpoint supervisor:

- `PATCH /supervisor/user/:id/reset-password`

Flow:

- supervisor memicu reset password user
- backend mengubah `must_reset_password` menjadi `true`
- password lama tidak diubah

Tujuan:

- menandai akun bahwa user wajib membuat password baru
- memisahkan status reset dari field `password`

## 2. Login normal diblok

Saat user mencoba login biasa:

- backend membaca data user berdasarkan email atau username
- jika `must_reset_password = true`, login langsung ditolak
- proses tidak lanjut ke validasi password normal

Artinya user yang sedang dalam status reset tidak bisa masuk sebelum menyelesaikan reset password.

## 3. User cek status reset password

Endpoint auth:

- `POST /auth/check-reset-password`

Request body:

```json
{
  "identifier": "username-atau-email"
}
```

Flow:

- backend mencari user berdasarkan `identifier`
- backend memastikan akun memang sedang dalam status reset
- jika valid, backend mengembalikan response sukses

Tujuan endpoint ini adalah memberi langkah awal pada frontend sebelum user mengirim password baru.

## 4. User set password baru

Endpoint auth:

- `POST /auth/set-reset-password`

Request body:

```json
{
  "identifier": "username-atau-email",
  "password": "NewPassword123"
}
```

Flow:

- backend mencari user berdasarkan `identifier`
- backend memastikan `must_reset_password = true`
- backend melakukan hash password baru
- backend menyimpan password hash baru
- backend mengubah `must_reset_password` menjadi `false`

Setelah langkah ini selesai, akun kembali bisa dipakai login normal.

## Prinsip desain yang dipakai

1. Endpoint supervisor tetap memakai intent bisnis `reset-password`
2. Status reset disimpan di kolom khusus `must_reset_password`
3. `AuthService` bertindak sebagai orkestrator
4. Detail flow reset password dipisahkan ke helper kecil di `src/helpers/auth-reset-password/`

## File terkait

- `src/app/supervisor/controllers/supervisor-user.controller.ts`
- `src/app/supervisor/services/supervisor-user.service.ts`
- `src/app/auth/auth.controller.ts`
- `src/app/auth/services/auth.service.ts`
- `src/app/auth/dto/check-reset-password.dto.ts`
- `src/app/auth/dto/set-reset-password.dto.ts`
- `src/helpers/auth-reset-password/check-reset-password-service.ts`
- `src/helpers/auth-reset-password/set-reset-password-service.ts`

## Catatan

Flow ini dirancang untuk konteks aplikasi internal perusahaan dengan jumlah pengguna terbatas. Karena itu, alur reset tidak memakai email token publik, tetapi tetap menjaga pemisahan yang jelas antara status reset akun dan credential password user.
