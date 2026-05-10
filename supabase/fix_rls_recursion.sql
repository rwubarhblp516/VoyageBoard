-- 修复 trip_members 表的 RLS 递归问题导致的 500 错误

-- 1. 删除旧的递归策略
drop policy if exists "Users can view members of trips they belong to" on trip_members;

-- 2. 重新定义非递归策略

-- 允许用户查看自己的成员记录
create policy "Users can view own membership" 
on trip_members for select 
using (auth.uid() = user_id);

-- 允许旅程所有者查看该旅程的所有成员
create policy "Trip owners can view all members" 
on trip_members for select 
using (
  exists (
    select 1 from trips 
    where trips.id = trip_members.trip_id 
    and trips.owner_id = auth.uid()
  )
);

-- 允许旅程参与者查看同一旅程的其他成员 (使用安全定义函数打破递归)
-- 注意：如果是在线数据库，需要确保函数已创建
create or replace function is_trip_participant(t_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from trip_members
    where trip_id = t_id
    and user_id = auth.uid()
  );
$$;

create policy "Participants can view group members" 
on trip_members for select 
using (is_trip_participant(trip_id));
