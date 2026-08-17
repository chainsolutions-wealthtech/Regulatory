begin;

create table regulatory.prospectus_import_batches (
  id uuid primary key,
  organization_id uuid not null references regulatory.organizations(id),
  project_id uuid not null references regulatory.projects(id) on delete cascade,
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  evidence_object_id uuid not null references regulatory.evidence_objects(id),
  evidence_sha256 char(64) not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  source_filename text not null check (length(trim(source_filename)) > 0),
  source_media_type text not null check (source_media_type in (
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )),
  extractor_id text not null check (length(trim(extractor_id)) > 0),
  extractor_version text not null check (length(trim(extractor_version)) > 0),
  status text not null default 'EXTRACTED_UNVERIFIED'
    check (status in ('EXTRACTED_UNVERIFIED', 'HUMAN_REVIEW_IN_PROGRESS', 'REVIEWED')),
  canonical_write_allowed boolean not null default false check (canonical_write_allowed = false),
  ready_for_submission boolean not null default false check (ready_for_submission = false),
  created_by uuid not null references regulatory.app_users(id),
  created_at timestamptz not null default now()
);

create index prospectus_import_batches_project_idx
  on regulatory.prospectus_import_batches (organization_id, project_id, project_version_id, created_at desc);

create index prospectus_import_batches_evidence_idx
  on regulatory.prospectus_import_batches (organization_id, evidence_object_id, created_at desc);

create table regulatory.prospectus_import_values (
  id uuid primary key,
  organization_id uuid not null references regulatory.organizations(id),
  import_batch_id uuid not null references regulatory.prospectus_import_batches(id) on delete cascade,
  proposed_canonical_field_path text not null check (length(trim(proposed_canonical_field_path)) > 0),
  extracted_value jsonb not null,
  confidence numeric(7,6) check (confidence is null or confidence between 0 and 1),
  source_location jsonb not null default '{}'::jsonb,
  evidence_object_id uuid not null references regulatory.evidence_objects(id),
  evidence_sha256 char(64) not null check (evidence_sha256 ~ '^[0-9a-f]{64}$'),
  review_status text not null default 'EXTRACTED_UNVERIFIED'
    check (review_status in ('EXTRACTED_UNVERIFIED', 'CONFIRMED_BY_HUMAN', 'REJECTED_BY_HUMAN')),
  reviewed_by uuid references regulatory.app_users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (review_status = 'EXTRACTED_UNVERIFIED' and reviewed_by is null and reviewed_at is null)
    or
    (review_status in ('CONFIRMED_BY_HUMAN', 'REJECTED_BY_HUMAN') and reviewed_by is not null and reviewed_at is not null)
  )
);

create index prospectus_import_values_batch_idx
  on regulatory.prospectus_import_values (organization_id, import_batch_id, created_at, id);

create or replace function regulatory.validate_prospectus_import_batch_scope()
returns trigger
language plpgsql
as $$
declare
  project_version_record regulatory.project_versions%rowtype;
  evidence_record regulatory.evidence_objects%rowtype;
begin
  select * into project_version_record
  from regulatory.project_versions
  where id = new.project_version_id;

  if not found
    or project_version_record.organization_id <> new.organization_id
    or project_version_record.project_id <> new.project_id then
    raise exception 'IMPORT_PROJECT_SCOPE_MISMATCH';
  end if;

  select * into evidence_record
  from regulatory.evidence_objects
  where id = new.evidence_object_id;

  if not found
    or evidence_record.organization_id <> new.organization_id
    or evidence_record.project_version_id <> new.project_version_id
    or evidence_record.sha256 <> new.evidence_sha256 then
    raise exception 'IMPORT_EVIDENCE_SCOPE_MISMATCH';
  end if;

  if evidence_record.state <> 'CLEAN' or evidence_record.scan_status <> 'CLEAN' then
    raise exception 'IMPORT_CLEAN_EVIDENCE_REQUIRED';
  end if;

  if evidence_record.detected_media_type is distinct from new.source_media_type then
    raise exception 'IMPORT_MEDIA_TYPE_MISMATCH';
  end if;

  return new;
end;
$$;

create trigger prospectus_import_batches_validate_scope
before insert or update on regulatory.prospectus_import_batches
for each row execute function regulatory.validate_prospectus_import_batch_scope();

create or replace function regulatory.prevent_prospectus_import_batch_source_mutation()
returns trigger
language plpgsql
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.project_id is distinct from old.project_id
    or new.project_version_id is distinct from old.project_version_id
    or new.evidence_object_id is distinct from old.evidence_object_id
    or new.evidence_sha256 is distinct from old.evidence_sha256
    or new.source_filename is distinct from old.source_filename
    or new.source_media_type is distinct from old.source_media_type
    or new.extractor_id is distinct from old.extractor_id
    or new.extractor_version is distinct from old.extractor_version
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at then
    raise exception 'IMPORT_BATCH_SOURCE_IMMUTABLE';
  end if;
  return new;
end;
$$;

create trigger prospectus_import_batches_prevent_source_mutation
before update on regulatory.prospectus_import_batches
for each row execute function regulatory.prevent_prospectus_import_batch_source_mutation();

create or replace function regulatory.validate_prospectus_import_value_scope()
returns trigger
language plpgsql
as $$
declare
  batch_record regulatory.prospectus_import_batches%rowtype;
begin
  select * into batch_record
  from regulatory.prospectus_import_batches
  where id = new.import_batch_id;

  if not found
    or batch_record.organization_id <> new.organization_id
    or batch_record.evidence_object_id <> new.evidence_object_id
    or batch_record.evidence_sha256 <> new.evidence_sha256 then
    raise exception 'IMPORT_VALUE_SCOPE_MISMATCH';
  end if;

  return new;
end;
$$;

create trigger prospectus_import_values_validate_scope
before insert or update on regulatory.prospectus_import_values
for each row execute function regulatory.validate_prospectus_import_value_scope();

create or replace function regulatory.prevent_prospectus_import_value_source_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.review_status <> 'EXTRACTED_UNVERIFIED' then
    raise exception 'IMPORT_VALUE_ALREADY_REVIEWED';
  end if;

  if new.organization_id is distinct from old.organization_id
    or new.import_batch_id is distinct from old.import_batch_id
    or new.proposed_canonical_field_path is distinct from old.proposed_canonical_field_path
    or new.extracted_value is distinct from old.extracted_value
    or new.confidence is distinct from old.confidence
    or new.source_location is distinct from old.source_location
    or new.evidence_object_id is distinct from old.evidence_object_id
    or new.evidence_sha256 is distinct from old.evidence_sha256
    or new.created_at is distinct from old.created_at then
    raise exception 'IMPORT_VALUE_SOURCE_IMMUTABLE';
  end if;
  return new;
end;
$$;

create trigger prospectus_import_values_prevent_source_mutation
before update on regulatory.prospectus_import_values
for each row execute function regulatory.prevent_prospectus_import_value_source_mutation();

alter table regulatory.prospectus_import_batches enable row level security;
alter table regulatory.prospectus_import_values enable row level security;

create policy prospectus_import_batches_tenant_policy on regulatory.prospectus_import_batches
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy prospectus_import_values_tenant_policy on regulatory.prospectus_import_values
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

comment on table regulatory.prospectus_import_batches is
  'Tenant-scoped staging for prospectus extraction. Staged imports can be human-reviewed but can never directly write canonical data or unlock regulatory submission.';
comment on table regulatory.prospectus_import_values is
  'Immutable extraction proposals with auditable human review decisions. Confirmation is not a canonical project write.';

commit;
