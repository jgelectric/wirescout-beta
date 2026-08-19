-- WireScout Supabase setup / migration
-- Safe to run on the project even if the basic profiles/jobs tables already exist.

create extension if not exists pgcrypto;

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists company_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

-- Jobs. Existing detailed columns can stay; WireScout cloud sync stores the complete job in payload.
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.jobs add column if not exists payload jsonb not null default '{}'::jsonb;
create index if not exists jobs_user_id_idx on public.jobs(user_id);

-- File metadata for photos / voice notes
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

-- Profile policies
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING ((select auth.uid()) = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = id);
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- Job policies
DROP POLICY IF EXISTS "jobs_select_own" ON public.jobs;
CREATE POLICY "jobs_select_own" ON public.jobs FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "jobs_insert_own" ON public.jobs;
CREATE POLICY "jobs_insert_own" ON public.jobs FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "jobs_update_own" ON public.jobs;
CREATE POLICY "jobs_update_own" ON public.jobs FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "jobs_delete_own" ON public.jobs;
CREATE POLICY "jobs_delete_own" ON public.jobs FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- File metadata policies
DROP POLICY IF EXISTS "job_files_select_own" ON public.job_files;
CREATE POLICY "job_files_select_own" ON public.job_files FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "job_files_insert_own" ON public.job_files;
CREATE POLICY "job_files_insert_own" ON public.job_files FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "job_files_update_own" ON public.job_files;
CREATE POLICY "job_files_update_own" ON public.job_files FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
DROP POLICY IF EXISTS "job_files_delete_own" ON public.job_files;
CREATE POLICY "job_files_delete_own" ON public.job_files FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

-- Private bucket for job photos / voice notes
insert into storage.buckets (id,name,public)
values ('job-files','job-files',false)
on conflict (id) do update set public=false;

DROP POLICY IF EXISTS "job_files_storage_select_own" ON storage.objects;
CREATE POLICY "job_files_storage_select_own" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
DROP POLICY IF EXISTS "job_files_storage_insert_own" ON storage.objects;
CREATE POLICY "job_files_storage_insert_own" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
DROP POLICY IF EXISTS "job_files_storage_update_own" ON storage.objects;
CREATE POLICY "job_files_storage_update_own" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text)
WITH CHECK (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
DROP POLICY IF EXISTS "job_files_storage_delete_own" ON storage.objects;
CREATE POLICY "job_files_storage_delete_own" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id='job-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
