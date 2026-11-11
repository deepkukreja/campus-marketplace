-- Campus Marketplace: shared marketplace listings
-- Run this AFTER setup.sql and profile-edit-migration.sql.
-- Uses PostgreSQL + Supabase Storage. No service-role key is used in the browser.

create extension if not exists pgcrypto;

create table if not exists public.listings (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references public.profiles(id) on delete set null,
    legacy_id text,
    title text not null check (char_length(title) between 1 and 100),
    category text not null,
    transaction_type text not null check (transaction_type in ('sell', 'rent', 'swap', 'free')),
    price numeric(12, 2) not null default 0 check (price >= 0),
    condition text not null,
    location text not null,
    description text not null check (char_length(description) <= 2000),
    seller_name text not null default 'BMU Student',
    image_url text,
    image_path text,
    status text not null default 'Available' check (status in ('Available', 'Reserved', 'Sold')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Add fields safely if the table was created during an earlier partial setup.
alter table public.listings add column if not exists owner_id uuid references public.profiles(id) on delete set null;
alter table public.listings add column if not exists legacy_id text;
alter table public.listings add column if not exists transaction_type text not null default 'sell';
alter table public.listings add column if not exists seller_name text not null default 'BMU Student';
alter table public.listings add column if not exists image_url text;
alter table public.listings add column if not exists image_path text;
alter table public.listings add column if not exists status text not null default 'Available';
alter table public.listings add column if not exists created_at timestamptz not null default now();
alter table public.listings add column if not exists updated_at timestamptz not null default now();

create index if not exists listings_status_created_at_idx
    on public.listings (status, created_at desc);
create index if not exists listings_owner_id_idx
    on public.listings (owner_id);
create unique index if not exists listings_owner_legacy_id_uidx
    on public.listings (owner_id, legacy_id)
    where owner_id is not null and legacy_id is not null;

-- Keep updated_at correct for edits from any client.
create or replace function public.set_listing_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at := now();
    return new;
end;
$$;
revoke all on function public.set_listing_updated_at() from public, anon, authenticated;

-- Derive the public seller display name from the owner's profile rather than
-- trusting a name submitted by the browser.
create or replace function public.set_listing_seller_name()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
    profile_name text;
begin
    if new.owner_id is not null then
        select p.full_name into profile_name
        from public.profiles as p
        where p.id = new.owner_id;
        new.seller_name := coalesce(nullif(trim(profile_name), ''), 'BMU Student');
    else
        new.seller_name := coalesce(nullif(trim(new.seller_name), ''), 'Campus Student');
    end if;
    return new;
end;
$$;
revoke all on function public.set_listing_seller_name() from public, anon, authenticated;

drop trigger if exists set_listings_seller_name on public.listings;
create trigger set_listings_seller_name
    before insert or update of owner_id on public.listings
    for each row execute function public.set_listing_seller_name();

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
    before update on public.listings
    for each row execute function public.set_listing_updated_at();

-- Row Level Security: anyone may browse available listings; an owner may also
-- read their own reserved/sold listings. Only the owner can insert/update/delete.
alter table public.listings enable row level security;

drop policy if exists "Anyone can view available listings" on public.listings;
create policy "Anyone can view available listings"
    on public.listings for select
    to anon, authenticated
    using (status = 'Available' or owner_id = (select auth.uid()));

drop policy if exists "Students can create their own listings" on public.listings;
create policy "Students can create their own listings"
    on public.listings for insert
    to authenticated
    with check (owner_id = (select auth.uid()));

drop policy if exists "Students can update their own listings" on public.listings;
create policy "Students can update their own listings"
    on public.listings for update
    to authenticated
    using (owner_id = (select auth.uid()))
    with check (owner_id = (select auth.uid()));

drop policy if exists "Students can delete their own listings" on public.listings;
create policy "Students can delete their own listings"
    on public.listings for delete
    to authenticated
    using (owner_id = (select auth.uid()));

grant usage on schema public to anon, authenticated;
revoke all on table public.listings from anon, authenticated, public;
grant select on table public.listings to anon, authenticated;
grant insert, update, delete on table public.listings to authenticated;

-- Public image bucket; uploads and changes are restricted to each student's
-- own folder: listing-images/<auth-user-id>/<generated-filename>.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'listing-images',
    'listing-images',
    true,
    2097152,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets already serve downloads by public URL. Deliberately do not
-- add a SELECT/list policy on storage.objects, so clients cannot enumerate files.
drop policy if exists "Anyone can view listing images" on storage.objects;

drop policy if exists "Students can upload listing images to their folder" on storage.objects;
create policy "Students can upload listing images to their folder"
    on storage.objects for insert
    to authenticated
    with check (
        bucket_id = 'listing-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Students can update listing images in their folder" on storage.objects;
create policy "Students can update listing images in their folder"
    on storage.objects for update
    to authenticated
    using (
        bucket_id = 'listing-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'listing-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

drop policy if exists "Students can delete listing images in their folder" on storage.objects;
create policy "Students can delete listing images in their folder"
    on storage.objects for delete
    to authenticated
    using (
        bucket_id = 'listing-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );

-- A few starter listings keep the marketplace populated for first-time testing.
-- These are unowned examples: users can view them but cannot edit/delete them.
insert into public.listings
    (id, owner_id, title, category, transaction_type, price, condition, location,
     description, seller_name, image_url, status, created_at)
values
    ('81000000-0000-4000-8000-000000000001', null,
     'Casio Scientific Calculator', 'academic', 'sell', 650, 'good',
     'Library Entrance',
     'A Casio scientific calculator in good working condition. Useful for engineering coursework.',
     'Campus Student', '../assets/images/calculator.svg', 'Available', now() - interval '1 day'),
    ('81000000-0000-4000-8000-000000000002', null,
     'Study Table', 'furniture', 'sell', 1200, 'good',
     'Hostel Common Area',
     'A sturdy study table in good condition. Campus handover preferred.',
     'Campus Student', '../assets/images/study-table.svg', 'Available', now() - interval '2 days'),
    ('81000000-0000-4000-8000-000000000003', null,
     'Engineering Textbook Set', 'books', 'sell', 800, 'like-new',
     'Academic Block Lobby',
     'A set of engineering textbooks in very good condition.',
     'Campus Student', '../assets/images/textbooks.svg', 'Available', now() - interval '3 days'),
    ('81000000-0000-4000-8000-000000000004', null,
     'Bicycle', 'sports', 'rent', 300, 'good',
     'Student Activity Centre',
     'A bicycle available for short-term campus use.',
     'Campus Student', '../assets/images/bicycle.svg', 'Available', now() - interval '4 days')
on conflict (id) do nothing;

-- Final verification result: should show the table and four starter records.
select
    count(*) as total_listings,
    count(*) filter (where status = 'Available') as available_listings,
    count(*) filter (where owner_id is not null) as student_owned_listings
from public.listings;
