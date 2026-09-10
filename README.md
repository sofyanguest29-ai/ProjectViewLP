# Project Monitor v3

Aplikasi internal untuk monitoring project. Stack: Next.js (App Router) + Supabase (Auth + Database), deploy ke Vercel.

## Fitur Lengkap

- Login, Guest mode (view-only, ditegakkan lewat database RLS), show/hide password (icon mata)
- Forgot password via email -> halaman New Password + Confirm New Password (min 8 karakter)
- List project: No, ID Project (4 digit unik), Nama Project, Requestor (tags + tooltip kalau >3), Divisi, Status, **SLA Status** (durasi hari dari satu status ke status lain di development log, bisa dipilih statusnya lewat filter)
- Filter Divisi/Requestor/Status yang bisa **diketik** (searchable), plus filter SLA (dari status -> ke status)
- Search ID/nama project
- **Import dari Word/PDF**: upload dokumen dengan struktur header (Objective, Expected Result, Impact Measurement, Requirements, Development Log) -> otomatis mengisi form Add Project untuk direview sebelum submit
- Add/Edit Project popup: Judul, Objective, Expected Result, Requestor (multi-select + bisa nambah/hapus nama dari daftar tersimpan), Divisi (multi-select), Impact (Cost/Accuracy/Speed + detail), Requirements (rich text + tag ke project lain), Development Log (tanggal + judul + status + **detail rich text** yang bisa di-show/hide), Status Project, **4 pertanyaan Impact Assessment** yang otomatis menghasilkan **Impact Measurement** (High/Medium/Low)
- Titik tiga per baris project (di layer paling atas, tidak akan ketutup elemen lain): Edit / Delete / Ubah Status
- Double-click baris -> halaman detail: semua field + development log (filter status & tanggal, sort terbaru/terlama, tombol tambah log langsung, **auto counter** per status misal "Identify 1", "Identify 2", dst)
- Kanban view: filter sama seperti halaman utama, drag & drop antar status
- Calendar view: filter sama seperti halaman utama + filter rentang tanggal (dari - sampai)

## 1. Setup Supabase

1. Buat project baru di https://supabase.com (gratis).
2. Buka **SQL Editor**, copy-paste isi `supabase/schema.sql`, Run. Script ini aman dijalankan baik untuk install baru maupun upgrade dari versi sebelumnya (ada migrasi otomatis untuk kolom requestor).
3. Aktifkan **Guest Mode**: **Authentication -> Sign In / Providers -> Anonymous Sign-Ins** -> aktifkan.
4. **Authentication -> URL Configuration**: isi Site URL dan tambahkan Redirect URL `.../update-password` (localhost & domain production).
5. **Project Settings -> API**: catat `Project URL` dan `anon public` key.

## 2. Buat User Pertama

**Authentication -> Users -> Add user** — isi email + password, centang "Auto Confirm User".

## 3. Deploy ke Vercel

1. Push semua file ke repo GitHub.
2. Import repo di vercel.com.
3. Tambahkan Environment Variables: `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy.

## Panduan Format Dokumen untuk Fitur Import

Supaya "Import dari Word/PDF" bisa membaca dokumen dengan benar, susun dokumen seperti ini:

```
Judul Project Kamu Di Sini
(baris ini harus jadi baris PERTAMA / paling atas di dokumen)

Objective
Tulis objective di sini, bisa beberapa baris.

Expected Result
Tulis expected result di sini.

Impact Measurement
Cost: penjelasan dampak ke cost
Accuracy: penjelasan dampak ke accuracy
Speed: penjelasan dampak ke speed

Requirements
Tulis requirements di sini.

Development Log
21 September 2026 - MoM Product x Ops
22 September 2026 - Follow up dengan tim Ops
```

Catatan penting:
- Kata header (**Objective**, **Expected Result**, **Impact Measurement**, **Requirements**, **Development Log**) harus persis di baris tersendiri (case tidak masalah, huruf besar/kecil bebas).
- Semua teks di bawah satu header akan otomatis masuk ke field itu, sampai ketemu header berikutnya.
- Baris Development Log harus diawali tanggal (format "21 September 2026" atau "21/09/2026") diikuti tanda pemisah lalu judul.
- Status development log dari hasil import otomatis di-set "Identify" — silakan diubah manual di form sebelum submit.
- Setelah upload, hasil ekstraksi akan mengisi form Add Project secara otomatis, dan kamu **tetap bisa review/edit** sebelum benar-benar disimpan ke database — jadi kalau ada bagian yang salah baca, tinggal dikoreksi manual di form.

## Struktur Halaman

- `/login`, `/forgot-password`, `/update-password`
- `/dashboard` — list, filter, search, SLA, add/edit modal, import modal
- `/dashboard/project/[id]` — detail + development log + quick add
- `/dashboard/kanban` — board drag & drop + filter
- `/dashboard/calendar` — kalender + filter + date range

## Catatan

- Guest hanya bisa **lihat**, tidak bisa create/edit/delete apapun — dibatasi di level database (RLS), bukan cuma UI.
- Nama requestor yang pernah diketik otomatis tersimpan ke daftar global (tabel `requestors`) supaya bisa dipakai lagi lewat dropdown di project berikutnya.
- SLA Status dihitung dari selisih hari antara kemunculan PERTAMA status "dari" dan kemunculan PERTAMA status "ke" (yang terjadi sesudahnya) di development log masing-masing project.
