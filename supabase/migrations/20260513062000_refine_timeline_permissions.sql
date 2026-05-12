-- Refine itinerary collaboration: keep records shared, track guide inclusion,
-- and restrict deletion to the author or trip owner.

alter table timeline_entries
  add column if not exists include_in_guide boolean not null default true;

create index if not exists idx_timeline_entries_guide
  on timeline_entries(trip_id, include_in_guide);

drop policy if exists "Delete timeline entries" on timeline_entries;
create policy "Delete timeline entries" on timeline_entries for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = timeline_entries.trip_id
    and trip_members.user_id = auth.uid()
    and (
      trip_members.id = timeline_entries.created_by_member_id
      or trip_members.role = 'owner'
    )
  )
);
