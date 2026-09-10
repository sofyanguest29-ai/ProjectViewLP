-- Project Monitor v3 schema / migration
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
  impact_measurement jsonb not null default '{}'::jsonb,
  status text not null default 'backlog' check (status in ('completed', 'in_progress', 'hold', 'cancel', 'backlog')),
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects add column if not exists impact_measurement jsonb not null default '{}'::jsonb;

create table if not exists public.development_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  log_date date not null,
  title text not null,
  status text not null check (status in ('Identify', 'Prioritize', 'Improve', 'Impact', 'Maintain')),
  status_count integer not null default 1,
  detail text,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);
alter table public.development_logs add column if not exists status_count integer not null default 1;

create table if not exists public.requestors (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz default now()
);

alter table public.projects enable row level security;
alter table public.development_logs enable row level security;
alter table public.requestors enable row level security;

drop policy if exists "view all projects" on public.projects;
create policy "view all projects" on public.projects for select using (auth.role() = 'authenticated');
drop policy if exists "insert projects non guest" on public.projects;
create policy "insert projects non guest" on public.projects for insert with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
drop policy if exists "update projects non guest" on public.projects;
create policy "update projects non guest" on public.projects for update using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
drop policy if exists "delete projects non guest" on public.projects;
create policy "delete projects non guest" on public.projects for delete using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "view all logs" on public.development_logs;
create policy "view all logs" on public.development_logs for select using (auth.role() = 'authenticated');
drop policy if exists "insert logs non guest" on public.development_logs;
create policy "insert logs non guest" on public.development_logs for insert with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
drop policy if exists "update logs non guest" on public.development_logs;
create policy "update logs non guest" on public.development_logs for update using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
drop policy if exists "delete logs non guest" on public.development_logs;
create policy "delete logs non guest" on public.development_logs for delete using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "view all requestors" on public.requestors;
create policy "view all requestors" on public.requestors for select using (auth.role() = 'authenticated');
drop policy if exists "insert requestors non guest" on public.requestors;
create policy "insert requestors non guest" on public.requestors for insert with check (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);
drop policy if exists "delete requestors non guest" on public.requestors;
create policy "delete requestors non guest" on public.requestors for delete using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

drop policy if exists "update requestors non guest" on public.requestors;
create policy "update requestors non guest" on public.requestors for update using (coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false);

-- Recalculate status_count for existing logs by project + status + chronological order.
with ranked as (
  select id, row_number() over (partition by project_id, status order by log_date asc, created_at asc, id asc) as rn
  from public.development_logs
)
update public.development_logs d set status_count = ranked.rn from ranked where d.id = ranked.id;

-- Seed requestor dropdown from existing projects.
insert into public.requestors (name)
select distinct trim(requestor) from public.projects where nullif(trim(requestor), '') is not null
on conflict (name) do nothing;
