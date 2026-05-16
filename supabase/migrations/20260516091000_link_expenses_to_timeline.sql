alter table expenses
  add column if not exists timeline_entry_id uuid references timeline_entries(id) on delete set null;

create index if not exists idx_expenses_timeline_entry_id
  on expenses(timeline_entry_id)
  where timeline_entry_id is not null;
