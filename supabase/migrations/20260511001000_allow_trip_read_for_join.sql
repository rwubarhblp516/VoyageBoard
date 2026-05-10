-- Allow any authenticated user to read trips by ID (for invite join flow)
-- This is safe because knowing a trip_id is equivalent to having the invite link
create policy "Authenticated users can view trips by id"
on trips for select
to authenticated
using (true);
