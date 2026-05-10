-- 补充 trip_members 表缺失的写入权限策略

-- 1. 允许任何登录用户加入旅行 (插入自己的成员记录)
-- 只要有 trip_id 就可以尝试加入
drop policy if exists "Anyone can join a trip" on trip_members;
create policy "Anyone can join a trip"
on trip_members for insert
with check (auth.uid() = user_id);

-- 2. 允许成员更新自己的记录 (如修改昵称)
drop policy if exists "Members can update own record" on trip_members;
create policy "Members can update own record"
on trip_members for update
using (auth.uid() = user_id);

-- 3. 允许旅程所有者拥有对成员表的全权管理权限
drop policy if exists "Owners can manage members" on trip_members;
create policy "Owners can manage members"
on trip_members for all
using (
  exists (
    select 1 from trips
    where trips.id = trip_members.trip_id
    and trips.owner_id = auth.uid()
  )
);
