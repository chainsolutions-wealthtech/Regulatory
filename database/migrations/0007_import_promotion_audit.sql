begin;

create table regulatory.import_value_promotions (
  id uuid primary key,
  organization_id uuid not null references regulatory.organizations(id),
  project_id uuid not null references regulatory.projects(id) on delete cascade,
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  import_batch_id uuid not null references regulatory.prospectus_import_batches(id) on delete restrict,
  import_value_id uuid not null unique references regulatory.prospectus_import_values(id) on delete restrict,
  question_id text not null check (length(trim(question_id)) > 0),
  source_evidence_object_id uuid not null references regulatory.evidence_objects(id) on delete restrict,
  source_sha256 char(64) not null check (source_sha256 ~ '^[0-9a-f]{64}$'),
  promoted_value jsonb not null,
  reviewed_by_user_id uuid not null references regulatory.app_users(id),
  promoted_by_user_id uuid not null references regulatory.app_users(id),
  promoted_at timestamptz not null default now(),
  ready_for_submission boolean not null default false check (ready_for_submission = false)
);

create index import_value_promotions_project_idx
  on regulatory.import_value_promotions (organization_id, project_id, promoted_at desc, id);

create or replace function regulatory.validate_import_value_promotion_scope()
returns trigger
language plpgsql
as $$
declare
  batch_record regulatory.prospectus_import_batches%rowtype;
  value_record regulatory.prospectus_import_values%rowtype;
  version_record regulatory.project_versions%rowtype;
begin
  select * into batch_record
    from regulatory.prospectus_import_batches
   where id = new.import_batch_id;
  if batch_record.id is null then
    raise exception 'IMPORT_PROMOTION_SCOPE_MISMATCH';
  end if;

  select * into value_record
    from regulatory.prospectus_import_values
   where id = new.import_value_id;
  if value_record.id is null then
    raise exception 'IMPORT_PROMOTION_SCOPE_MISMATCH';
  end if;

  select * into version_record
    from regulatory.project_versions
   where id = new.project_version_id;
  if version_record.id is null then
    raise exception 'IMPORT_PROMOTION_SCOPE_MISMATCH';
  end if;

  if batch_record.organization_id <> new.organization_id
    or batch_record.project_id <> new.project_id
    or batch_record.canonical_write_allowed <> false
    or batch_record.ready_for_submission <> false
    or value_record.organization_id <> new.organization_id
    or value_record.import_batch_id <> new.import_batch_id
    or value_record.review_status <> 'CONFIRMED_BY_HUMAN'
    or value_record.reviewed_by is distinct from new.reviewed_by_user_id
    or value_record.evidence_object_id <> new.source_evidence_object_id
    or value_record.evidence_sha256 <> new.source_sha256
    or value_record.extracted_value is distinct from new.promoted_value
    or version_record.organization_id <> new.organization_id
    or version_record.project_id <> new.project_id then
    raise exception 'IMPORT_PROMOTION_SCOPE_MISMATCH';
  end if;

  return new;
end;
$$;

create trigger import_value_promotions_validate_scope
before insert on regulatory.import_value_promotions
for each row execute function regulatory.validate_import_value_promotion_scope();

create or replace function regulatory.prevent_import_value_promotion_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'IMPORT_PROMOTION_APPEND_ONLY';
end;
$$;

create trigger import_value_promotions_prevent_update
before update on regulatory.import_value_promotions
for each row execute function regulatory.prevent_import_value_promotion_mutation();

create trigger import_value_promotions_prevent_delete
before delete on regulatory.import_value_promotions
for each row execute function regulatory.prevent_import_value_promotion_mutation();

alter table regulatory.import_value_promotions enable row level security;

create policy import_value_promotions_tenant_policy on regulatory.import_value_promotions
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

comment on table regulatory.import_value_promotions is
  'Append-only receipts for explicit human promotion of a confirmed staged import value into one questionnaire answer. Promotion never enables regulatory submission.';

commit;
