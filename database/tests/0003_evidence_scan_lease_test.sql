\set ON_ERROR_STOP on

begin;

insert into regulatory.organizations (id, slug, legal_name, country_code)
values ('12000000-0000-0000-0000-000000000001', 'scan-lease-tenant', 'Scan Lease Tenant', 'CI');

insert into regulatory.app_users (id, external_subject, email, display_name)
values
  ('22000000-0000-0000-0000-000000000001', 'scan-lease-uploader', 'scan-uploader@example.test', 'Scan Uploader'),
  ('22000000-0000-0000-0000-000000000002', 'scan-lease-security', 'scan-security@example.test', 'Scan Security');

insert into regulatory.organization_memberships (organization_id, user_id, role)
values
  ('12000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000001', 'PRODUCT'),
  ('12000000-0000-0000-0000-000000000001', '22000000-0000-0000-0000-000000000002', 'SECURITY');

insert into regulatory.projects (
  id, organization_id, canonical_slug, legal_name, category, operation, created_by
) values (
  '32000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  'scan-lease-project',
  'Scan Lease Project',
  'BOND',
  'CREATE',
  '22000000-0000-0000-0000-000000000001'
);

insert into regulatory.project_versions (
  id, organization_id, project_id, version_number, schema_version, catalog_digest, created_by
) values (
  '42000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  '32000000-0000-0000-0000-000000000001',
  1,
  'TEST',
  repeat('a', 64),
  '22000000-0000-0000-0000-000000000001'
);

insert into regulatory.evidence_objects (
  id, organization_id, project_version_id, storage_provider, storage_object_key,
  storage_reference, original_filename, safe_filename, declared_media_type,
  sha256, byte_size, encryption_algorithm, encryption_key_reference, uploaded_by
) values (
  '52000000-0000-0000-0000-000000000001',
  '12000000-0000-0000-0000-000000000001',
  '42000000-0000-0000-0000-000000000001',
  'TEST_PRIVATE_STORE',
  'evidence/scan-lease/quarantine/object-0001',
  'private:scan-lease:object-0001',
  'scan.pdf',
  'scan.pdf',
  'application/pdf',
  repeat('b', 64),
  256,
  'TEST_ONLY',
  'test-key',
  '22000000-0000-0000-0000-000000000001'
);

-- SCANNING sans lease complet est interdit pour toute nouvelle écriture.
do $$
begin
  begin
    update regulatory.evidence_objects
       set state = 'SCANNING', scan_started_at = now()
     where id = '52000000-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_INCOMPLETE_SCAN_LEASE_REJECTION';
  exception
    when check_violation then null;
  end;
end;
$$;

-- Un claim complet et serveur peut entrer en SCANNING/PENDING.
update regulatory.evidence_objects
set state = 'SCANNING',
    scan_started_at = now(),
    scan_claimed_by = '22000000-0000-0000-0000-000000000002',
    scan_lease_expires_at = now() + interval '60 seconds',
    scan_attempt_count = scan_attempt_count + 1
where id = '52000000-0000-0000-0000-000000000001';

do $$
declare
  row_record regulatory.evidence_objects%rowtype;
begin
  select * into row_record from regulatory.evidence_objects
   where id = '52000000-0000-0000-0000-000000000001';
  if row_record.state <> 'SCANNING' or row_record.scan_status <> 'PENDING' then
    raise exception 'SCAN_CLAIM_STATE_INVALID';
  end if;
  if row_record.scan_claimed_by <> '22000000-0000-0000-0000-000000000002'::uuid
     or row_record.scan_lease_expires_at is null
     or row_record.scan_attempt_count <> 1 then
    raise exception 'SCAN_CLAIM_AUDIT_INVALID';
  end if;
end;
$$;

-- Quitter SCANNING nettoie automatiquement l'ownership du lease.
update regulatory.evidence_objects
set state = 'QUARANTINED'
where id = '52000000-0000-0000-0000-000000000001';

do $$
declare
  row_record regulatory.evidence_objects%rowtype;
begin
  select * into row_record from regulatory.evidence_objects
   where id = '52000000-0000-0000-0000-000000000001';
  if row_record.scan_claimed_by is not null or row_record.scan_lease_expires_at is not null then
    raise exception 'SCAN_LEASE_NOT_CLEARED_AFTER_EXIT';
  end if;
  if row_record.scan_attempt_count <> 1 then
    raise exception 'SCAN_ATTEMPT_HISTORY_MUST_REMAIN';
  end if;
end;
$$;

-- Un lease ne constitue jamais un verdict antivirus ni une release.
do $$
begin
  begin
    update regulatory.evidence_objects
       set state = 'CLEAN',
           released_at = now(),
           released_by = '22000000-0000-0000-0000-000000000002'
     where id = '52000000-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_CLEAN_SCAN_CONTROLS_REJECTION';
  exception
    when raise_exception then
      if sqlerrm <> 'EVIDENCE_CLEAN_RELEASE_CONTROLS_REQUIRED' then raise; end if;
  end;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conname = 'evidence_scan_lease_consistency'
       and conrelid = 'regulatory.evidence_objects'::regclass
  ) then
    raise exception 'SCAN_LEASE_CONSTRAINT_MISSING';
  end if;
  if not exists (
    select 1 from pg_trigger
     where tgname = 'evidence_objects_normalize_scan_lease'
       and tgrelid = 'regulatory.evidence_objects'::regclass
       and not tgisinternal
  ) then
    raise exception 'SCAN_LEASE_NORMALIZER_TRIGGER_MISSING';
  end if;
end;
$$;

rollback;

\echo EVIDENCE_SCAN_LEASE_TESTS_PASS
