-- Fix RLS policies for expenses and expense_participants to allow insertions and updates

-- 1. Ensure expenses has a proper WITH CHECK policy just in case
DROP POLICY IF EXISTS "Users can manage expenses of their trips" ON expenses;

CREATE POLICY "Users can manage expenses of their trips" 
ON expenses FOR ALL 
USING (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = expenses.trip_id and trip_members.user_id = auth.uid()
  )
)
WITH CHECK (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = expenses.trip_id and trip_members.user_id = auth.uid()
  )
);

-- 2. Grant full access to expense_participants for trip members
DROP POLICY IF EXISTS "Users can view participants of their trip expenses" ON expense_participants;
DROP POLICY IF EXISTS "Users can manage participants of their trip expenses" ON expense_participants;

CREATE POLICY "Users can manage participants of their trip expenses" 
ON expense_participants FOR ALL 
USING (
  exists (
    select 1 from trip_members
    join expenses on expenses.trip_id = trip_members.trip_id
    where expenses.id = expense_participants.expense_id and trip_members.user_id = auth.uid()
  )
)
WITH CHECK (
  exists (
    select 1 from trip_members
    join expenses on expenses.trip_id = trip_members.trip_id
    where expenses.id = expense_participants.expense_id and trip_members.user_id = auth.uid()
  )
);
