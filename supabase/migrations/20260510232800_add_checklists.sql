-- 创建清单表
create table trip_checklists (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  completed_by_member_id uuid references trip_members(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- 开启 RLS
alter table trip_checklists enable row level security;

-- 权限策略：成员可读写自己所在的旅行的清单
create policy "Users can manage checklists of their trips" on trip_checklists for all using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklists.trip_id and trip_members.user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = trip_checklists.trip_id and trip_members.user_id = auth.uid()
  )
);

create index idx_trip_checklists_trip_id on trip_checklists(trip_id);
