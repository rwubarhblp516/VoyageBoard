-- 1. 创建旅行表
create table trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  destination text not null,
  start_date date not null,
  end_date date not null,
  currency text default 'CNY',
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamp with time zone default now()
);

-- 开启 RLS
alter table trips enable row level security;
create policy "Users can manage their own trips" on trips for all using (auth.uid() = owner_id);

-- 2. 创建成员表
create table trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null,
  role text default 'member' check (role in ('owner', 'member', 'guest')),
  joined_at timestamp with time zone default now()
);

alter table trip_members enable row level security;
create policy "Users can view members of trips they belong to" on trip_members for select using (
  exists (
    select 1 from trip_members as tm
    where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid()
  )
);
create index idx_trip_members_trip_id on trip_members(trip_id);

-- 3. 创建消费表
create table expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid references trips(id) on delete cascade not null,
  title text not null,
  amount bigint not null, 
  category text not null,
  payer_member_id uuid references trip_members(id) not null,
  expense_date date default current_date not null,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default now()
);

alter table expenses enable row level security;
create policy "Users can manage expenses of their trips" on expenses for all using (
  exists (
    select 1 from trip_members
    where trip_members.trip_id = expenses.trip_id and trip_members.user_id = auth.uid()
  )
);
create index idx_expenses_trip_id on expenses(trip_id);

-- 4. 创建消费分摊表
create table expense_participants (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id) on delete cascade not null,
  member_id uuid references trip_members(id) on delete cascade not null,
  share_type text default 'equal',
  calculated_amount bigint not null
);

alter table expense_participants enable row level security;
create policy "Users can view participants of their trip expenses" on expense_participants for select using (
  exists (
    select 1 from trip_members
    join expenses on expenses.trip_id = trip_members.trip_id
    where expenses.id = expense_participants.expense_id and trip_members.user_id = auth.uid()
  )
);
