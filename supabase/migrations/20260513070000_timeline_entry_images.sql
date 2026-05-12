-- Store compressed WebP images attached to itinerary timeline entries.

insert into storage.buckets (id, name, public)
values ('trip-images', 'trip-images', true)
on conflict (id) do nothing;

create table if not exists timeline_entry_images (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  day_id uuid references trip_days(id) on delete cascade not null,
  timeline_entry_id uuid references timeline_entries(id) on delete cascade not null,
  storage_path text not null,
  original_name text,
  mime_type text not null default 'image/webp',
  width integer,
  height integer,
  size_bytes integer,
  sort_order integer not null default 0,
  created_by_member_id uuid references trip_members(id) on delete set null,
  created_at timestamp with time zone default now(),
  constraint timeline_entry_images_storage_path_unique unique (storage_path)
);

alter table timeline_entry_images enable row level security;

create index if not exists idx_timeline_entry_images_entry_order
  on timeline_entry_images(timeline_entry_id, sort_order);
create index if not exists idx_timeline_entry_images_trip_id
  on timeline_entry_images(trip_id);

drop policy if exists "Select timeline images" on timeline_entry_images;
create policy "Select timeline images" on timeline_entry_images for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_images.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Insert timeline images" on timeline_entry_images;
create policy "Insert timeline images" on timeline_entry_images for insert with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_images.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Delete timeline images" on timeline_entry_images;
create policy "Delete timeline images" on timeline_entry_images for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_images.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Trip images are publicly readable" on storage.objects;
create policy "Trip images are publicly readable"
on storage.objects for select
using (bucket_id = 'trip-images');

drop policy if exists "Trip members can upload trip images" on storage.objects;
create policy "Trip members can upload trip images"
on storage.objects for insert
with check (
  bucket_id = 'trip-images'
  and exists (
    select 1 from trip_members
    where trip_members.trip_id::text = (storage.foldername(name))[1]
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Trip members can delete trip images" on storage.objects;
create policy "Trip members can delete trip images"
on storage.objects for delete
using (
  bucket_id = 'trip-images'
  and exists (
    select 1 from trip_members
    where trip_members.trip_id::text = (storage.foldername(name))[1]
    and trip_members.user_id = auth.uid()
  )
);
