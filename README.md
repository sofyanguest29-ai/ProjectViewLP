# Project Monitor v2

Aplikasi internal untuk monitoring project. Stack: Next.js (App Router) + Supabase (Auth + Database), deploy ke Vercel.

## Fitur

- Login, Guest mode, show/hide password
- Forgot password via email (reset ke halaman New Password + Confirm New Password, min 8 karakter)
- List project: kolom No, ID Project (4 digit unik), Nama Project, Requestor, Divisi, Status
- Filter (Divisi / Requestor / Status) + Search (ID atau nama project)
- Add/Edit Project via popup: Judul, Objective, Expected Result, Requestor, Divisi (multi-select), Impact (Cost/Accuracy/Speed + detail per item), Requirements (rich text + tag ke project lain), Development Log (tanggal + judul + status)
- Titik tiga per baris project: Edit / Delete / Ubah Status
- Double-click baris -> halaman detail project, termasuk daftar development log (klik log -> popup detail, bisa Edit + Save)
- Kanban view: drag & drop card antar kolom status (Completed / In Progress / Hold / Cancel / Backlog)
- Calendar view: kalender bulan (atas) + list development log pada tanggal yang diklik (bawah)

## 1. Setup Supabase

1. Buat project baru di https://supabase.com (gratis).
2. Buka **SQL Editor**, copy-paste isi `supabase/schema.sql`, Run. Ini membuat tabel `projects`, `development_logs`, dan semua RLS policy-nya (termasuk aturan guest hanya boleh lihat, tidak boleh edit/hapus).
3. Aktifkan **Guest Mode**: buka **Authentication -> Sign In / Providers**, cari **Anonymous Sign-Ins**, aktifkan. Kalau ini tidak diaktifkan, tombol "Masuk sebagai Guest" akan error.
4. Buka **Authentication -> URL Configuration**:
   - **Site URL**: isi domain kamu (`http://localhost:3000` untuk lokal, atau domain Vercel untuk production)
   - **Redirect URLs**: tambahkan `.../update-password` (baik untuk localhost maupun domain production) — wajib supaya link reset password mengarah ke halaman yang benar.
5. Buka **Project Settings -> API**, catat `Project URL` dan `anon public` key.

## 2. Buat User Pertama

**Authentication -> Users -> Add user** — isi email + password, centang "Auto Confirm User". Ulangi untuk tiap anggota tim.

## 3. Deploy ke Vercel

1. Push semua file ini ke repo GitHub (drag & drop lewat github.com kalau tidak mau pakai command line).
2. Import repo di vercel.com.
3. Tambahkan Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Setelah dapat domain, balik ke Supabase -> Authentication -> URL Configuration, update Site URL & Redirect URLs pakai domain production.

## Struktur Halaman

- `/login` — login + guest mode + show/hide password
- `/forgot-password` — kirim email reset
- `/update-password` — set password baru (New Password + Confirm New Password)
- `/dashboard` — list project + filter + search + add/edit modal
- `/dashboard/project/[id]` — detail project + development log
- `/dashboard/kanban` — board drag & drop per status
- `/dashboard/calendar` — kalender + list development log per tanggal

## Catatan

- ID Project (4 digit) dibuat otomatis & unik saat project baru dibuat.
- Guest bisa login dan **lihat semua data**, tapi **tidak bisa** create/edit/delete/ubah status (dibatasi lewat Row Level Security di database, bukan cuma di tampilan — jadi aman meski guest coba akses API langsung).
- Tag project di field Requirements murni referensi teks (bukan link ke halaman lain) — klik tombol "@ Tag Project" di toolbar untuk cari & sisipkan.
- Kalau field development log di form Add/Edit project diisi kosong (tanggal/judul kosong), baris itu otomatis diabaikan saat submit.
