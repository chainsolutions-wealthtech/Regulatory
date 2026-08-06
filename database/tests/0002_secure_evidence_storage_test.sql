\set ON_ERROR_STOP on

begin;

insert into regulatory.organizations (id, slug, legal_name, country_code)
values ('11000000-0000-0000-0000-000000000001', 'evidence-tenant', 'Evidence Tenant', 'CI');

insert into regulatory.app_users (id, external_subject, email, display_name)
values
  ('21000000-0000-0000-0000-000000000001', 'evidence-uploader', 'uploader@example.test', 'Evidence Uploader'),
  ('21000000-0000-0000-0000-000000000002', 'evidence-verifier', 'verifier@example.test', 'Evidence Verifier');

insert into regulatory.organization_memberships (organization_id, user_id, role)
values
  ('11000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000001', 'PRODUCT'),
  ('11000000-0000-0000-0000-000000000001', '21000000-0000-0000-0000-000000000002', 'COMPLIANCE');

insert into regulatory.projects (
  id, organization_id, canonical_slug, legal_name, category, operation, created_by
) values (
  '31000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  'evidence-fund',
  'Evidence Fund',
  'BOND',
  'CREATE',
  '21000000-0000-0000-0000-000000000001'
);

insert into regulatory.project_versions (
  id, organization_id, project_id, version_number, schema_version, catalog_digest, created_by
) values (
  '41000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '31000000-0000-0000-0000-000000000001',
  1,
  'PROSPECTUS_CANONICAL_MODEL_V1',
  repeat('e', 64),
  '21000000-0000-0000-0000-000000000001'
);

-- Une référence publique est interdite.
do $$
begin
  begin
    insert into regulatory.evidence_objects (
      organization_id, project_version_id, storage_provider, storage_object_key,
      storage_reference, original_filename, safe_filename, declared_media_type,
      sha256, byte_size, encryption_algorithm, encryption_key_reference, uploaded_by
    ) values (
      '11000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000001',
      'TEST_PRIVATE_STORE',
      'evidence/tenant-a/public-reference-0001',
      'https://public.example.test/evidence.pdf',
      'evidence.pdf',
      'evidence.pdf',
      'application/pdf',
      repeat('a', 64),
      128,
      'PROVIDER_MANAGED_AES_256',
      'kms:test/evidence',
      '21000000-0000-0000-0000-000000000001'
    );
    raise exception 'EXPECTED_PUBLIC_REFERENCE_REJECTION';
  exception
    when check_violation then null;
  end;
end;
$$;

-- Un objet ne peut pas devenir CLEAN sans détection, scan et décision de libération.
do $$
begin
  begin
    insert into regulatory.evidence_objects (
      organization_id, project_version_id, storage_provider, storage_object_key,
      storage_reference, original_filename, safe_filename, declared_media_type,
      sha256, byte_size, encryption_algorithm, encryption_key_reference,
      state, scan_status, uploaded_by
    ) values (
      '11000000-0000-0000-0000-000000000001',
      '41000000-0000-0000-0000-000000000001',
      'TEST_PRIVATE_STORE',
      'evidence/tenant-a/unscanned-clean-0001',
      'private:evidence/tenant-a/unscanned-clean-0001',
      'unscanned.pdf',
      'unscanned.pdf',
      'application/pdf',
      repeat('b', 64),
      128,
      'PROVIDER_MANAGED_AES_256',
      'kms:test/evidence',
      'CLEAN',
      'CLEAN',
      '21000000-0000-0000-0000-000000000001'
    );
    raise exception 'EXPECTED_CLEAN_CONTROL_REJECTION';
  exception
    when raise_exception then
      if sqlerrm <> 'EVIDENCE_CLEAN_RELEASE_CONTROLS_REQUIRED' then raise; end if;
  end;
end;
$$;

insert into regulatory.evidence_objects (
  id, organization_id, project_version_id, storage_provider, storage_object_key,
  storage_reference, original_filename, safe_filename, declared_media_type,
  sha256, byte_size, encryption_algorithm, encryption_key_reference, uploaded_by
) values (
  '51000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000001',
  'TEST_PRIVATE_STORE',
  'evidence/tenant-a/clean-object-0001',
  'private:evidence/tenant-a/clean-object-0001',
  'official-approval.pdf',
  'official-approval.pdf',
  'application/pdf',
  repeat('c', 64),
  4096,
  'PROVIDER_MANAGED_AES_256',
  'kms:test/evidence',
  '21000000-0000-0000-0000-000000000001'
);

update regulatory.evidence_objects
set
  state = 'CLEAN',
  scan_status = 'CLEAN',
  detected_media_type = 'application/pdf',
  scan_provider = 'TEST_SCANNER',
  scan_engine_version = '1.0.0',
  scan_signature_version = '2026-08-06',
  scan_started_at = now() - interval '1 minute',
  scan_completed_at = now(),
  released_at = now(),
  released_by = '21000000-0000-0000-0000-000000000002'
where id = '51000000-0000-0000-0000-000000000001';

insert into regulatory.evidence_items (
  id, organization_id, project_version_id, evidence_id, evidence_type,
  title, reference, issuer, file_reference, verification_status,
  verified_by, verified_at, primary_object_id
) values (
  '61000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000001',
  'EVIDENCE-APPROVAL-001',
  'APPROVAL',
  'Décision officielle',
  'REF-001',
  'Autorité de test',
  'private:evidence/tenant-a/clean-object-0001',
  'VERIFIED',
  '21000000-0000-0000-0000-000000000002',
  now(),
  '51000000-0000-0000-0000-000000000001'
);

do $$
declare
  frozen_digest text;
begin
  select verified_object_sha256 into frozen_digest
  from regulatory.evidence_items
  where id = '61000000-0000-0000-0000-000000000001';
  if frozen_digest <> repeat('c', 64) then
    raise exception 'VERIFIED_DIGEST_NOT_FROZEN';
  end if;
end;
$$;

-- Le contenu d'un objet libéré est immuable.
do $$
begin
  begin
    update regulatory.evidence_objects
    set sha256 = repeat('d', 64)
    where id = '51000000-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_CONTENT_IMMUTABILITY_REJECTION';
  exception
    when raise_exception then
      if sqlerrm <> 'EVIDENCE_OBJECT_CONTENT_IMMUTABLE' then raise; end if;
  end;
end;
$$;

-- Un objet portant une preuve vérifiée ne peut plus perdre son état CLEAN.
do $$
begin
  begin
    update regulatory.evidence_objects
    set state = 'REJECTED'
    where id = '51000000-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_VERIFIED_RELEASE_PRESERVATION';
  exception
    when raise_exception then
      if sqlerrm <> 'VERIFIED_EVIDENCE_OBJECT_MUST_REMAIN_CLEAN' then raise; end if;
  end;
end;
$$;

insert into regulatory.evidence_objects (
  id, organization_id, project_version_id, storage_provider, storage_object_key,
  storage_reference, original_filename, safe_filename, sha256, byte_size,
  encryption_algorithm, encryption_key_reference, uploaded_by, legal_hold
) values (
  '51000000-0000-0000-0000-000000000002',
  '11000000-0000-0000-0000-000000000001',
  '41000000-0000-0000-0000-000000000001',
  'TEST_PRIVATE_STORE',
  'evidence/tenant-a/legal-hold-object-0002',
  'private:evidence/tenant-a/legal-hold-object-0002',
  'legal-hold.pdf',
  'legal-hold.pdf',
  repeat('f', 64),
  512,
  'PROVIDER_MANAGED_AES_256',
  'kms:test/evidence',
  '21000000-0000-0000-0000-000000000001',
  true
);

do $$
begin
  begin
    update regulatory.evidence_objects
    set
      state = 'DELETION_PENDING',
      deletion_requested_at = now(),
      deletion_requested_by = '21000000-0000-0000-0000-000000000002'
    where id = '51000000-0000-0000-0000-000000000002';
    raise exception 'EXPECTED_LEGAL_HOLD_REJECTION';
  exception
    when raise_exception then
      if sqlerrm <> 'EVIDENCE_LEGAL_HOLD_PREVENTS_DELETION' then raise; end if;
  end;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'regulatory'
      and tablename = 'evidence_objects'
      and policyname = 'evidence_objects_tenant_policy'
  ) then
    raise exception 'EVIDENCE_OBJECT_RLS_POLICY_MISSING';
  end if;
end;
$$;

rollback;

\echo SECURE_EVIDENCE_STORAGE_TESTS_PASS
