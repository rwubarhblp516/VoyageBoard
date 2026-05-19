create table if not exists timeline_entry_comments (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  day_id uuid references trip_days(id) on delete cascade not null,
  timeline_entry_id uuid references timeline_entries(id) on delete cascade not null,
  content text not null check (length(trim(content)) > 0),
  created_by_member_id uuid references trip_members(id) on delete set null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

alter table timeline_entry_comments enable row level security;

create index if not exists idx_timeline_entry_comments_entry_time
  on timeline_entry_comments(timeline_entry_id, created_at);

create index if not exists idx_timeline_entry_comments_trip_id
  on timeline_entry_comments(trip_id);

drop policy if exists "Select timeline comments" on timeline_entry_comments;
create policy "Select timeline comments" on timeline_entry_comments for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_comments.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Insert timeline comments" on timeline_entry_comments;
create policy "Insert timeline comments" on timeline_entry_comments for insert with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_comments.trip_id
    and trip_members.user_id = auth.uid()
    and trip_members.id = timeline_entry_comments.created_by_member_id
  )
);

drop policy if exists "Update own timeline comments" on timeline_entry_comments;
create policy "Update own timeline comments" on timeline_entry_comments for update using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_comments.trip_id
    and trip_members.user_id = auth.uid()
    and trip_members.id = timeline_entry_comments.created_by_member_id
  )
) with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_comments.trip_id
    and trip_members.user_id = auth.uid()
    and trip_members.id = timeline_entry_comments.created_by_member_id
  )
);

drop policy if exists "Delete timeline comments" on timeline_entry_comments;
create policy "Delete timeline comments" on timeline_entry_comments for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entry_comments.trip_id
    and trip_members.user_id = auth.uid()
    and (
      trip_members.id = timeline_entry_comments.created_by_member_id
      or trip_members.role = 'owner'
    )
  )
);
