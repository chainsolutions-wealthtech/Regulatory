begin;

create type regulatory.evidence_object_state as enum (
  'QUARANTINED',
  'SCANNING',
  'CLEAN',
  'INFECTED',
  'REJECTED',
  'DELETION_PENDING',
  'DELETED'
);

create type regulatory.evidence_scan_status as enum (
  'PENDING',
  'CLEAN',
  'INFECTED',
  'ERROR',
  'NOT_SUPPORTED'
);

create table regulatory.evidence_objects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  storage_provider text not null check (length(trim(storage_provider)) > 0),
  storage_object_key text not null,
  storage_reference text not null,
  original_filename text not null,
  safe_filename text not null,
  declared_media_type text,
  detected_media_type text,
  sha256 char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  byte_size bigint not null check (byte_size between 1 and 52428800),
  encryption_algorithm text not null check (length(trim(encryption_algorithm)) > 0),
  encryption_key_reference text not null check (length(trim(encryption_key_reference)) > 0),
  state regulatory.evidence_object_state not null default 'QUARANTINED',
  scan_status regulatory.evidence_scan_status not null default 'PENDING',
  scan_provider text,
  scan_engine_version text,
  scan_signature_version text,
  scan_started_at timestamptz,
  scan_completed_at timestamptz,
  scan_details jsonb not null default '{}'::jsonb,
  quarantined_at timestamptz not null default now(),
  released_at timestamptz,
  released_by uuid references regulatory.app_users(id),
  uploaded_by uuid not null references regulatory.app_users(id),
  retention_until timestamptz not null default (now() + interval '3650 days'),
  legal_hold boolean not null default false,
  deletion_requested_at timestamptz,
  deletion_requested_by uuid references regulatory.app_users(id),
  deleted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, storage_provider, storage_object_key),
  check (storage_object_key ~ '^[a-z0-9][a-z0-9/_-]{15,255}$'),
  check (position('..' in storage_object_key) = 0),
  check (storage_reference !~* '^https?://'),
  check (position('/' in original_filename) = 0 and position(chr(92) in original_filename) = 0),
  check (safe_filename ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'),
  check (scan_completed_at is null or scan_started_at is null or scan_completed_at >= scan_started_at),
  check (released_at is null or released_at >= quarantined_at),
  check (deleted_at is null or deletion_requested_at is not null),
  check (not legal_hold or deleted_at is null)
);

create unique index evidence_objects_clean_digest_idx
  on regulatory.evidence_objects (organization_id, sha256, byte_size)
  where state = 'CLEAN';

create index evidence_objects_project_state_idx
  on regulatory.evidence_objects (organization_id, project_version_id, state, created_at desc);

create index evidence_objects_retention_idx
  on regulatory.evidence_objects (organization_id, retention_until)
  where state not in ('DELETED', 'INFECTED') and legal_hold = false;

alter table regulatory.evidence_items
  add column primary_object_id uuid references regulatory.evidence_objects(id),
  add column verified_object_sha256 char(64)
    check (verified_object_sha256 is null or verified_object_sha256 ~ '^[0-9a-f]{64}$');

create index evidence_items_primary_object_idx
  on regulatory.evidence_items (organization_id, primary_object_id)
  where primary_object_id is not null;

create or replace function regulatory.validate_evidence_object_lifecycle()
returns trigger
language plpgsql
as $$
begin
  if new.state = 'SCANNING' and new.scan_started_at is null then
    raise exception 'EVIDENCE_SCAN_START_REQUIRED';
  end if;

  if new.state = 'CLEAN' then
    if new.scan_status <> 'CLEAN'
      or new.detected_media_type is null
      or new.scan_provider is null
      or new.scan_engine_version is null
      or new.scan_signature_version is null
      or new.scan_completed_at is null
      or new.released_at is null
      or new.released_by is null then
      raise exception 'EVIDENCE_CLEAN_RELEASE_CONTROLS_REQUIRED';
    end if;
  end if;

  if new.state = 'INFECTED' and new.scan_status <> 'INFECTED' then
    raise exception 'EVIDENCE_INFECTED_SCAN_RESULT_REQUIRED';
  end if;

  if new.state = 'DELETION_PENDING' then
    if new.deletion_requested_at is null or new.deletion_requested_by is null then
      raise exception 'EVIDENCE_DELETION_DECISION_REQUIRED';
    end if;
    if new.legal_hold then
      raise exception 'EVIDENCE_LEGAL_HOLD_PREVENTS_DELETION';
    end if;
  end if;

  if new.state = 'DELETED' then
    if new.deleted_at is null or new.deletion_requested_at is null or new.deletion_requested_by is null then
      raise exception 'EVIDENCE_DELETION_AUDIT_REQUIRED';
    end if;
    if new.legal_hold then
      raise exception 'EVIDENCE_LEGAL_HOLD_PREVENTS_DELETION';
    end if;
  end if;

  return new;
end;
$$;

create trigger evidence_objects_validate_lifecycle
before insert or update on regulatory.evidence_objects
for each row execute function regulatory.validate_evidence_object_lifecycle();

create trigger evidence_objects_set_updated_at
before update on regulatory.evidence_objects
for each row execute function regulatory.set_updated_at();

create or replace function regulatory.prevent_evidence_object_content_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.state in ('CLEAN', 'INFECTED', 'REJECTED', 'DELETED') and (
    new.organization_id is distinct from old.organization_id
    or new.project_version_id is distinct from old.project_version_id
    or new.storage_provider is distinct from old.storage_provider
    or new.storage_object_key is distinct from old.storage_object_key
    or new.storage_reference is distinct from old.storage_reference
    or new.original_filename is distinct from old.original_filename
    or new.safe_filename is distinct from old.safe_filename
    or new.declared_media_type is distinct from old.declared_media_type
    or new.detected_media_type is distinct from old.detected_media_type
    or new.sha256 is distinct from old.sha256
    or new.byte_size is distinct from old.byte_size
    or new.encryption_algorithm is distinct from old.encryption_algorithm
    or new.encryption_key_reference is distinct from old.encryption_key_reference
    or new.scan_provider is distinct from old.scan_provider
    or new.scan_engine_version is distinct from old.scan_engine_version
    or new.scan_signature_version is distinct from old.scan_signature_version
    or new.scan_completed_at is distinct from old.scan_completed_at
  ) then
    raise exception 'EVIDENCE_OBJECT_CONTENT_IMMUTABLE';
  end if;
  return new;
end;
$$;

create trigger evidence_objects_prevent_content_mutation
before update on regulatory.evidence_objects
for each row execute function regulatory.prevent_evidence_object_content_mutation();

create or replace function regulatory.validate_verified_evidence_object()
returns trigger
language plpgsql
as $$
declare
  object_record regulatory.evidence_objects%rowtype;
begin
  if new.verification_status = 'VERIFIED' then
    if new.primary_object_id is null then
      raise exception 'VERIFIED_EVIDENCE_PRIMARY_OBJECT_REQUIRED';
    end if;

    select * into object_record
    from regulatory.evidence_objects
    where id = new.primary_object_id
      and organization_id = new.organization_id
      and project_version_id = new.project_version_id;

    if not found then
      raise exception 'VERIFIED_EVIDENCE_OBJECT_SCOPE_MISMATCH';
    end if;
    if object_record.state <> 'CLEAN' or object_record.scan_status <> 'CLEAN' then
      raise exception 'VERIFIED_EVIDENCE_CLEAN_OBJECT_REQUIRED';
    end if;
    if new.file_sha256 is not null and new.file_sha256 <> object_record.sha256 then
      raise exception 'VERIFIED_EVIDENCE_DIGEST_MISMATCH';
    end if;

    new.file_sha256 := object_record.sha256;
    new.verified_object_sha256 := object_record.sha256;
  end if;
  return new;
end;
$$;

create trigger evidence_items_validate_verified_object
before insert or update on regulatory.evidence_items
for each row execute function regulatory.validate_verified_evidence_object();

create or replace function regulatory.prevent_verified_evidence_object_release_loss()
returns trigger
language plpgsql
as $$
begin
  if old.state = 'CLEAN' and new.state <> 'CLEAN' and exists (
    select 1
    from regulatory.evidence_items item
    where item.primary_object_id = old.id
      and item.verification_status = 'VERIFIED'
  ) then
    raise exception 'VERIFIED_EVIDENCE_OBJECT_MUST_REMAIN_CLEAN';
  end if;
  return new;
end;
$$;

create trigger evidence_objects_preserve_verified_release
before update on regulatory.evidence_objects
for each row execute function regulatory.prevent_verified_evidence_object_release_loss();

alter table regulatory.evidence_objects enable row level security;

create policy evidence_objects_tenant_policy on regulatory.evidence_objects
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

comment on table regulatory.evidence_objects is
  'Metadata for quarantined evidence binaries. No public URL or provider credential is stored. Production object storage, KMS and malware scanner remain external dependencies.';
comment on column regulatory.evidence_objects.storage_reference is
  'Opaque provider reference only. HTTP and HTTPS URLs are forbidden.';
comment on column regulatory.evidence_objects.encryption_key_reference is
  'Opaque KMS/provider key reference. Key material and credentials must never be stored here.';
comment on column regulatory.evidence_items.verified_object_sha256 is
  'Digest frozen when a human verifier confirms an evidence item backed by a CLEAN scanned object.';

commit;
