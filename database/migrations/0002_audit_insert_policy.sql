begin;

create policy audit_events_tenant_insert_policy
  on regulatory.audit_events
  for insert
  with check (organization_id = regulatory.current_organization_id());

comment on policy audit_events_tenant_insert_policy on regulatory.audit_events is
  'Allows tenant-scoped application inserts while update and delete remain blocked by the append-only trigger.';

commit;
