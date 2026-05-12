-- Add nested checklist groups so a checklist can contain collapsible custom categories.
alter table trip_checklists
  add column if not exists item_kind text not null default 'item'
    check (item_kind in ('item', 'group'));

alter table trip_checklists
  add column if not exists parent_id uuid references trip_checklists(id) on delete cascade;

create index if not exists idx_trip_checklists_parent_id on trip_checklists(parent_id);
create index if not exists idx_trip_checklists_trip_category_kind on trip_checklists(trip_id, category, item_kind);
