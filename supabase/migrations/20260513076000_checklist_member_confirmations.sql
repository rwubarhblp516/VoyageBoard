-- Track checklist confirmations per member so everyone can see who has confirmed each item.

create table if not exists trip_checklist_confirmations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  checklist_id uuid references trip_checklists(id) on delete cascade not null,
  member_id uuid references trip_members(id) on delete cascade not null,
  confirmed_at timestamp with time zone default now(),
  constraint trip_checklist_confirmations_unique unique (checklist_id, member_id)
);

alter table trip_checklist_confirmations enable row level security;

create index if not exists idx_trip_checklist_confirmations_trip_id
  on trip_checklist_confirmations(trip_id);
create index if not exists idx_trip_checklist_confirmations_checklist_id
  on trip_checklist_confirmations(checklist_id);
create index if not exists idx_trip_checklist_confirmations_member_id
  on trip_checklist_confirmations(member_id);

insert into trip_checklist_confirmations (
  trip_id,
  checklist_id,
  member_id,
  confirmed_at
)
select
  trip_checklists.trip_id,
  trip_checklists.id,
  trip_checklists.completed_by_member_id,
  coalesce(trip_checklists.created_at, now())
from trip_checklists
where trip_checklists.completed_by_member_id is not null
on conflict (checklist_id, member_id) do nothing;

drop policy if exists "Select checklist confirmations" on trip_checklist_confirmations;
create policy "Select checklist confirmations" on trip_checklist_confirmations for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklist_confirmations.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Insert checklist confirmations" on trip_checklist_confirmations;
create policy "Insert checklist confirmations" on trip_checklist_confirmations for insert with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklist_confirmations.trip_id
    and trip_members.id = trip_checklist_confirmations.member_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Delete checklist confirmations" on trip_checklist_confirmations;
create policy "Delete checklist confirmations" on trip_checklist_confirmations for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklist_confirmations.trip_id
    and trip_members.id = trip_checklist_confirmations.member_id
    and trip_members.user_id = auth.uid()
  )
);
