-- Allow idempotent upsert updates for a member's own checklist confirmations.

drop policy if exists "Update checklist confirmations" on trip_checklist_confirmations;
create policy "Update checklist confirmations" on trip_checklist_confirmations for update using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklist_confirmations.trip_id
    and trip_members.id = trip_checklist_confirmations.member_id
    and trip_members.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklist_confirmations.trip_id
    and trip_members.id = trip_checklist_confirmations.member_id
    and trip_members.user_id = auth.uid()
  )
);
