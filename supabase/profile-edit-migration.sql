-- Campus Marketplace: profile editing migration
-- Run once in Supabase Dashboard > SQL Editor for an existing project.
-- The existing profiles table and owner-only UPDATE policy are retained.

alter table public.profiles
    add column if not exists bio text;

-- Keep updated_at current on profile edits, including edits made outside this website.
create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

revoke all on function public.set_profile_updated_at() from public, anon, authenticated;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
    before update on public.profiles
    for each row execute function public.set_profile_updated_at();

-- Reassert the existing owner-only write policy. Each student can update only their own row.
alter table public.profiles enable row level security;
drop policy if exists "Students can update their own profile" on public.profiles;
create policy "Students can update their own profile"
    on public.profiles
    for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

grant select, update on public.profiles to authenticated;
revoke all on public.profiles from anon;
