-- ============================================================
-- SCHEMA - Project Monitor v3
-- Jalankan ini di Supabase SQL Editor.
-- Aman dijalankan berkali-kali, baik untuk install baru maupun
-- upgrade dari versi sebelumnya (v1/v2).
-- ============================================================

create table if not exists public.requestors (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique not null,
  title text not null,
  objective text,
  expected_result text,
  divisions text[] not null default '{}',
  impacts jsonb not null default '{}'::jsonb,
  requirements text,
  status text not null default 'backlog'
    check (status in ('completed', 'in_progress', 'hold', 'cancel', 'backlog')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.development_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  log_date date not null,
  title text not null,
  status text not null check (status in ('Identify', 'Prioritize', 'Improve', 'Impact', 'Maintain')),
  detail text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

-- ============================================================
-- Tambahkan kolom baru kalau tabel di atas sudah ada dari versi
-- sebelumnya (create table if not exists TIDAK menambah kolom
-- ke tabel yang sudah ada, jadi harus eksplisit lewat ALTER TABLE).
-- ============================================================
alter table public.projects add column if not exists requestors text[] not null default '{}';
alter table public.projects add column if not exists q1_score int;
alter table public.projects add column if not exists q2_score int;
alter table public.projects add column if not exists q3_score int;
alter table public.projects add column if not exists q4_score int;
alter table public.development_logs add column if not exists detail text;

alter table public.projects enable row level security;
alter table public.development_logs enable row level security;
alter table public.requestors enable row level security;

-- Semua user yang login (termasuk guest/anonymous) boleh LIHAT semua data
drop policy if exists "view all projects" on public.projects;
create policy "view all projects" on public.projects
  for select using (auth.role() = 'authenticated');

drop policy if exists "view all logs" on public.development_logs;
create policy "view all logs" on public.development_logs
  for select using (auth.role() = 'authenticated');

drop policy if exists "view all requestors" on public.requestors;
create policy "view all requestors" on public.requestors
  for select using (auth.role() = 'authenticated');

-- Hanya user BUKAN guest yang boleh insert/update/delete
drop policy if exists "insert projects non guest" on public.projects;
create policy "insert projects non guest" on public.projects
  for insert with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "update projects non guest" on public.projects;
create policy "update projects non guest" on public.projects
  for update using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "delete projects non guest" on public.projects;
create policy "delete projects non guest" on public.projects
  for delete using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "insert logs non guest" on public.development_logs;
create policy "insert logs non guest" on public.development_logs
  for insert with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "update logs non guest" on public.development_logs;
create policy "update logs non guest" on public.development_logs
  for update using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "delete logs non guest" on public.development_logs;
create policy "delete logs non guest" on public.development_logs
  for delete using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "insert requestors non guest" on public.requestors;
create policy "insert requestors non guest" on public.requestors
  for insert with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "delete requestors non guest" on public.requestors;
create policy "delete requestors non guest" on public.requestors
  for delete using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- ============================================================
-- MIGRASI dari v2 (kolom "requestor" single text -> "requestors" array)
-- Aman dijalankan walau kolom lama sudah tidak ada / install baru.
-- ============================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'projects' and column_name = 'requestor'
  ) then
    execute 'update public.projects set requestors = array[requestor] where requestor is not null and (requestors is null or requestors = ''{}'')';
    execute 'alter table public.projects drop column requestor';
  end if;
end $$;

-- Isi tabel requestors dari nama-nama yang sudah pernah dipakai di project (kalau ada)
insert into public.requestors (name)
select distinct unnest(requestors) from public.projects
on conflict (name) do nothing;
