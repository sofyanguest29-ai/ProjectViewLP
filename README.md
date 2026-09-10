# Project Monitor v4

Aplikasi internal untuk monitoring project. Stack: Next.js (App Router) + Supabase (Auth + Database), deploy ke Vercel.

## Fitur

- Login, Guest mode (view-only via database RLS), show/hide password (icon mata)
- Forgot password via email -> New Password + Confirm New Password (min 8 karakter)
- List project: No, ID Project, Nama Project, **Project Type**, Requestor (tags + tooltip), Divisi, Status, **Start Date**, **Finish Date**
- Filter Divisi/Requestor/Status/**Project Type** (bisa diketik/searchable) + tombol hapus semua filter
- Search ID/nama project
- Add/Edit Project popup: Judul, **Project Type**, Objective (rich text), Expected Result (rich text), Requestor (multi-select + kelola daftar tersimpan), Divisi (multi-select), **Impact Measurement** (Cost/Accuracy/Speed, masing-masing rich text), Requirements (rich text + tag project), Development Log (tanggal + judul + status + detail rich text show/hide), Status Project, **Priority Scoring** (4 pertanyaan) -> otomatis hitung **Priority** (High/Medium/Low)
- Titik tiga per baris (layer paling atas): Edit / Delete / Ubah Status
- Double-click baris -> halaman detail: Project Type, Objective, Start Date & Finish Date (dihitung otomatis dari Development Log: Start = tanggal terlama status Identify, Finish = tanggal terbaru status Improve), Expected Result, Requestor, Divisi, Impact Measurement, Requirements, Priority Scoring, Development Log (filter status & tanggal, sort terbaru/terlama, tombol tambah log)
- Kanban view: filter sama seperti halaman utama, drag & drop antar status
- Calendar view: filter sama seperti halaman utama + filter rentang tanggal (dari - sampai)

## 1. Setup Supabase

1. Buat project baru di https://supabase.com (gratis).
2. Buka **SQL Editor**, copy-paste isi `supabase/schema.sql`, Run. Aman dijalankan berkali-kali (idempotent), termasuk untuk upgrade dari versi manapun sebelumnya.
3. Aktifkan **Guest Mode**: **Authentication -> Sign In / Providers -> Anonymous Sign-Ins**.
4. **Authentication -> URL Configuration**: isi Site URL + Redirect URL `.../update-password`.
5. **Project Settings -> API**: catat `Project URL` dan `anon public` key.

## 2. Buat User Pertama

**Authentication -> Users -> Add user** — isi email + password, centang "Auto Confirm User".

## 3. Deploy ke Vercel

1. Push semua file ke repo GitHub.
2. Import repo di vercel.com.
3. Tambahkan Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.

## Struktur Halaman

- `/login`, `/forgot-password`, `/update-password`
- `/dashboard` — list, filter, search, add/edit modal
- `/dashboard/project/[id]` — detail + development log
- `/dashboard/kanban` — board drag & drop + filter
- `/dashboard/calendar` — kalender + filter + date range

## Catatan

- Guest hanya bisa **lihat**, tidak bisa create/edit/delete apapun (dibatasi di level database).
- Nama requestor yang pernah diketik otomatis tersimpan ke daftar global (tabel `requestors`) untuk dipakai lagi.
- Start Date & Finish Date di halaman utama/detail dihitung otomatis dari Development Log, bukan input manual.
- Status pada Development Log ditampilkan apa adanya (tanpa nomor urut).
