-- Add trip timeline records for in-trip notes and post-trip guide generation.

create table if not exists trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  day_index integer not null check (day_index > 0),
  date date not null,
  city text,
  title text,
  summary text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint trip_days_trip_day_unique unique (trip_id, day_index),
  constraint trip_days_trip_date_unique unique (trip_id, date)
);

alter table trip_days enable row level security;

create index if not exists idx_trip_days_trip_id on trip_days(trip_id);
create index if not exists idx_trip_days_trip_order on trip_days(trip_id, day_index);

drop policy if exists "Select trip days" on trip_days;
create policy "Select trip days" on trip_days for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_days.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Insert trip days" on trip_days;
create policy "Insert trip days" on trip_days for insert with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_days.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Update trip days" on trip_days;
create policy "Update trip days" on trip_days for update using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_days.trip_id
    and trip_members.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_days.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Delete trip days" on trip_days;
create policy "Delete trip days" on trip_days for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_days.trip_id
    and trip_members.user_id = auth.uid()
  )
);

create table if not exists timeline_entries (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  day_id uuid references trip_days(id) on delete cascade not null,
  type text not null check (type in ('transport', 'place', 'meal', 'hotel', 'activity', 'note', 'tip', 'pitfall')),
  title text not null,
  content text,
  start_time time,
  end_time time,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  place_name text,
  address text,
  latitude double precision,
  longitude double precision,
  recommend_level text check (recommend_level is null or recommend_level in ('recommend', 'normal', 'avoid')),
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  tags text[] default '{}',
  sort_order integer not null default 0,
  created_by_member_id uuid references trip_members(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table timeline_entries enable row level security;

create index if not exists idx_timeline_entries_trip_id on timeline_entries(trip_id);
create index if not exists idx_timeline_entries_day_order on timeline_entries(day_id, sort_order, start_time);
create index if not exists idx_timeline_entries_type on timeline_entries(trip_id, type);

drop policy if exists "Select timeline entries" on timeline_entries;
create policy "Select timeline entries" on timeline_entries for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entries.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Insert timeline entries" on timeline_entries;
create policy "Insert timeline entries" on timeline_entries for insert with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entries.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Update timeline entries" on timeline_entries;
create policy "Update timeline entries" on timeline_entries for update using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entries.trip_id
    and trip_members.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entries.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Delete timeline entries" on timeline_entries;
create policy "Delete timeline entries" on timeline_entries for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entries.trip_id
    and trip_members.user_id = auth.uid()
  )
);

create table if not exists travel_segments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  day_id uuid references trip_days(id) on delete cascade not null,
  timeline_entry_id uuid references timeline_entries(id) on delete cascade,
  origin_name text not null,
  destination_name text not null,
  origin_address text,
  destination_address text,
  origin_latitude double precision,
  origin_longitude double precision,
  destination_latitude double precision,
  destination_longitude double precision,
  transport_mode text not null check (transport_mode in ('walk', 'bike', 'car', 'rental_car', 'taxi', 'ride_hailing', 'bus', 'coach', 'metro', 'train', 'high_speed_rail', 'flight', 'ship', 'ferry', 'other')),
  departure_time time,
  arrival_time time,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  distance_km numeric(8, 2) check (distance_km is null or distance_km >= 0),
  distance_source text not null default 'unknown' check (distance_source in ('auto', 'manual', 'unknown')),
  route_polyline text,
  note text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table travel_segments enable row level security;

create index if not exists idx_travel_segments_trip_id on travel_segments(trip_id);
create index if not exists idx_travel_segments_day_order on travel_segments(day_id, sort_order, departure_time);
create index if not exists idx_travel_segments_timeline_entry on travel_segments(timeline_entry_id);

drop policy if exists "Select travel segments" on travel_segments;
create policy "Select travel segments" on travel_segments for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = travel_segments.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Insert travel segments" on travel_segments;
create policy "Insert travel segments" on travel_segments for insert with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = travel_segments.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Update travel segments" on travel_segments;
create policy "Update travel segments" on travel_segments for update using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = travel_segments.trip_id
    and trip_members.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = travel_segments.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Delete travel segments" on travel_segments;
create policy "Delete travel segments" on travel_segments for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = travel_segments.trip_id
    and trip_members.user_id = auth.uid()
  )
);
