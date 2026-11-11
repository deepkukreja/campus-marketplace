-- Campus Marketplace: Supabase authentication setup
-- Run this in Supabase Dashboard > SQL Editor.
-- This creates student profile rows and a server-side BMU email-domain hook.

-- 1) Minimal public profile table. Do not store passwords in this table.
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null default '',
    department text,
    academic_year text,
    avatar_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- A signed-in campus user may view profile cards; each user can update only their own profile.
drop policy if exists "Authenticated students can view profiles" on public.profiles;
create policy "Authenticated students can view profiles"
    on public.profiles for select
    to authenticated
    using ((select auth.uid()) is not null);

drop policy if exists "Students can update their own profile" on public.profiles;
create policy "Students can update their own profile"
    on public.profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

grant select, update on public.profiles to authenticated;
revoke all on public.profiles from anon;

-- Create a profile row whenever Supabase Auth creates a user.
create or replace function public.handle_new_campus_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, department, academic_year)
    values (
        new.id,
        coalesce(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'department', ''),
        nullif(new.raw_user_meta_data ->> 'academic_year', '')
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

revoke all on function public.handle_new_campus_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
    after insert on auth.users
    for each row execute procedure public.handle_new_campus_user();

-- 2) Server-side signup restriction. Configure this function as the
-- Authentication > Hooks > Before User Created hook in the Supabase Dashboard.
-- Do not rely only on the browser's domain check: the Auth hook blocks direct API requests too.
create or replace function public.bmu_only_signup_hook(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
    signup_email text;
begin
    signup_email := lower(trim(coalesce(event -> 'user' ->> 'email', '')));

    if signup_email !~ '^[^@[:space:]]+@bmu\.edu\.in$' then
        return jsonb_build_object(
            'error', jsonb_build_object(
                'http_code', 403,
                'message', 'Registration is restricted to official @bmu.edu.in email addresses.'
            )
        );
    end if;

    return '{}'::jsonb;
end;
$$;

grant usage on schema public to supabase_auth_admin;
revoke all on function public.bmu_only_signup_hook(jsonb) from public, anon, authenticated;
grant execute on function public.bmu_only_signup_hook(jsonb) to supabase_auth_admin;
