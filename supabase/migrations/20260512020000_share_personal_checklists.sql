-- Allow members to share their personal checklist with selected trip companions.
create table if not exists trip_personal_checklist_shares (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  owner_member_id uuid references trip_members(id) on delete cascade not null,
  shared_member_id uuid references trip_members(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  constraint trip_personal_checklist_shares_no_self check (owner_member_id <> shared_member_id),
  constraint trip_personal_checklist_shares_unique unique (owner_member_id, shared_member_id)
);

alter table trip_personal_checklist_shares enable row level security;

create index if not exists idx_trip_personal_checklist_shares_trip_id on trip_personal_checklist_shares(trip_id);
create index if not exists idx_trip_personal_checklist_shares_owner on trip_personal_checklist_shares(owner_member_id);
create index if not exists idx_trip_personal_checklist_shares_shared on trip_personal_checklist_shares(shared_member_id);

drop policy if exists "Select personal checklist shares" on trip_personal_checklist_shares;
create policy "Select personal checklist shares" on trip_personal_checklist_shares for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_personal_checklist_shares.trip_id
    and trip_members.user_id = auth.uid()
    and (
      trip_members.id = trip_personal_checklist_shares.owner_member_id
      or trip_members.id = trip_personal_checklist_shares.shared_member_id
    )
  )
);

drop policy if exists "Insert personal checklist shares" on trip_personal_checklist_shares;
create policy "Insert personal checklist shares" on trip_personal_checklist_shares for insert with check (
  exists (
    select 1 from trip_members owner_member
    where owner_member.id = trip_personal_checklist_shares.owner_member_id
    and owner_member.trip_id = trip_personal_checklist_shares.trip_id
    and owner_member.user_id = auth.uid()
  )
  and exists (
    select 1 from trip_members shared_member
    where shared_member.id = trip_personal_checklist_shares.shared_member_id
    and shared_member.trip_id = trip_personal_checklist_shares.trip_id
  )
);

drop policy if exists "Delete personal checklist shares" on trip_personal_checklist_shares;
create policy "Delete personal checklist shares" on trip_personal_checklist_shares for delete using (
  exists (
    select 1 from trip_members
    where trip_members.id = trip_personal_checklist_shares.owner_member_id
    and trip_members.trip_id = trip_personal_checklist_shares.trip_id
    and trip_members.user_id = auth.uid()
  )
);

drop policy if exists "Select checklists" on trip_checklists;
create policy "Select checklists" on trip_checklists for select using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklists.trip_id
    and trip_members.user_id = auth.uid()
    and (
      trip_checklists.category = 'public'
      or trip_checklists.created_by_member_id = trip_members.id
      or exists (
        select 1 from trip_personal_checklist_shares
        where trip_personal_checklist_shares.trip_id = trip_checklists.trip_id
        and trip_personal_checklist_shares.owner_member_id = trip_checklists.created_by_member_id
        and trip_personal_checklist_shares.shared_member_id = trip_members.id
      )
    )
  )
);

drop policy if exists "Update checklists" on trip_checklists;
create policy "Update checklists" on trip_checklists for update using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklists.trip_id
    and trip_members.user_id = auth.uid()
    and (
      trip_checklists.category = 'public'
      or trip_checklists.created_by_member_id = trip_members.id
      or exists (
        select 1 from trip_personal_checklist_shares
        where trip_personal_checklist_shares.trip_id = trip_checklists.trip_id
        and trip_personal_checklist_shares.owner_member_id = trip_checklists.created_by_member_id
        and trip_personal_checklist_shares.shared_member_id = trip_members.id
      )
    )
  )
);

drop policy if exists "Delete checklists" on trip_checklists;
create policy "Delete checklists" on trip_checklists for delete using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklists.trip_id
    and trip_members.user_id = auth.uid()
    and (
      trip_checklists.category = 'public'
      or trip_checklists.created_by_member_id = trip_members.id
    )
  )
);
