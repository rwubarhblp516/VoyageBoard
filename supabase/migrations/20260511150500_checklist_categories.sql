-- Add category and creator to trip_checklists
alter table trip_checklists add column if not exists created_by_member_id uuid references trip_members(id) on delete cascade;
alter table trip_checklists add column if not exists category text default 'public' check (category in ('public', 'personal'));

-- Update existing items to have a creator if possible (optional but good)
-- For now, existing items will be public and creator will be null, which is fine for RLS.

-- Update RLS
drop policy if exists "Users can manage checklists of their trips" on trip_checklists;

-- Select: Everyone in trip can see public items. Only creator can see personal items.
create policy "Select checklists" on trip_checklists for select using (
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

-- Insert: Any member can insert items for their trip.
create policy "Insert checklists" on trip_checklists for insert with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklists.trip_id 
    and trip_members.user_id = auth.uid()
    and (
      -- If personal, must be the creator
      (trip_checklists.category = 'personal' and trip_checklists.created_by_member_id = trip_members.id)
      -- If public, creator is optional or set to them
      or (trip_checklists.category = 'public')
    )
  )
);

-- Update: Any member can update public items. Only creator can update personal.
create policy "Update checklists" on trip_checklists for update using (
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

-- Delete: Any member can delete public items. Only creator can delete personal.
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
