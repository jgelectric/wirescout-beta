-- WireScout Supabase setup
-- Run this entire file in Supabase > SQL Editor once.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  company_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists jobs_user_id_idx on public.jobs(user_id);

create table if not exists public.job_files (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  job_id uuid not null,
  scope_id text,
  name text,
  mime_type text,
  kind text default 'photo',
  storage_path text not null,
  created_at timestamptz not null default now()
);
create index if not exists job_files_user_job_idx on public.job_files(user_id,job_id);

alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.job_files enable row level security;

-- Each signed-in user can only access their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Jobs are private to their owner.
drop policy if exists "jobs_select_own" on public.jobs;
create policy "jobs_select_own" on public.jobs for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "jobs_insert_own" on public.jobs;
create policy "jobs_insert_own" on public.jobs for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "jobs_update_own" on public.jobs;
create policy "jobs_update_own" on public.jobs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "jobs_delete_own" on public.jobs;
create policy "jobs_delete_own" on public.jobs for delete to authenticated using ((select auth.uid()) = user_id);

-- File metadata is also private.
drop policy if exists "job_files_select_own" on public.job_files;
create policy "job_files_select_own" on public.job_files for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "job_files_insert_own" on public.job_files;
create policy "job_files_insert_own" on public.job_files for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "job_files_update_own" on public.job_files;
create policy "job_files_update_own" on public.job_files for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "job_files_delete_own" on public.job_files;
create policy "job_files_delete_own" on public.job_files for delete to authenticated using ((select auth.uid()) = user_id);

-- Private storage bucket for job photos and voice notes.
insert into storage.buckets (id,name,public) values ('job-files','job-files',false)
on conflict (id) do update set public=false;

drop policy if exists "job_files_storage_select_own" on storage.objects;
create policy "job_files_storage_select_own" on storage.objects for select to authenticated
using (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "job_files_storage_insert_own" on storage.objects;
create policy "job_files_storage_insert_own" on storage.objects for insert to authenticated
with check (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "job_files_storage_update_own" on storage.objects;
create policy "job_files_storage_update_own" on storage.objects for update to authenticated
using (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text)
with check (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
drop policy if exists "job_files_storage_delete_own" on storage.objects;
create policy "job_files_storage_delete_own" on storage.objects for delete to authenticated
using (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
