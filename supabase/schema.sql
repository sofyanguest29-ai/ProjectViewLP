-- ============================================================
-- SCHEMA BARU - Project Monitor v2
-- Jalankan ini di Supabase SQL Editor.
-- Kalau kamu masih punya tabel "projects" versi lama (simple),
-- HAPUS TANDA KOMENTAR (--) di 2 baris drop table di bawah ini
-- kalau mau reset total ke schema baru:
-- drop table if exists public.development_logs cascade;
-- drop table if exists public.projects cascade;
-- ============================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  project_code text unique not null,
  title text not null,
  objective text,
  expected_result text,
  requestor text not null,
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

alter table public.projects enable row level security;
alter table public.development_logs enable row level security;

-- Semua user yang login (termasuk guest/anonymous) boleh LIHAT semua data
drop policy if exists "view all projects" on public.projects;
create policy "view all projects" on public.projects
  for select using (auth.role() = 'authenticated');

drop policy if exists "view all logs" on public.development_logs;
create policy "view all logs" on public.development_logs
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
