-- 修复 RLS 递归问题
drop policy if exists "Users can view members of trips they belong to" on trip_members;
create policy "Users can view own membership" on trip_members for select using (auth.uid() = user_id);
create policy "Trip owners can view all members" on trip_members for select using (exists (select 1 from trips where trips.id = trip_members.trip_id and trips.owner_id = auth.uid()));
create or replace function is_trip_participant(t_id uuid) returns boolean language sql security definer set search_path = public as $$ select exists (select 1 from trip_members where trip_id = t_id and user_id = auth.uid()); $$;
create policy "Participants can view group members" on trip_members for select using (is_trip_participant(trip_id));
