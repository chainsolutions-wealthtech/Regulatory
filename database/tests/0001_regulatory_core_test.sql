\set ON_ERROR_STOP on

begin;

insert into regulatory.organizations (id, slug, legal_name, country_code)
values
  ('10000000-0000-0000-0000-000000000001', 'tenant-alpha', 'Tenant Alpha', 'CI'),
  ('10000000-0000-0000-0000-000000000002', 'tenant-beta', 'Tenant Beta', 'SN');

insert into regulatory.app_users (id, external_subject, email, display_name)
values
  ('20000000-0000-0000-0000-000000000001', 'subject-alpha', 'alpha@example.test', 'Alpha User'),
  ('20000000-0000-0000-0000-000000000002', 'subject-beta', 'beta@example.test', 'Beta User');

insert into regulatory.organization_memberships (
  organization_id,
  user_id,
  role,
  is_administrator
)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'PRODUCT', true),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'PRODUCT', true);

insert into regulatory.projects (
  id,
  organization_id,
  canonical_slug,
  legal_name,
  category,
  operation,
  created_by
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'alpha-fund',
    'Alpha Fund',
    'BOND',
    'CREATE',
    '20000000-0000-0000-0000-000000000001'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'beta-fund',
    'Beta Fund',
    'DIVERSIFIED',
    'CREATE',
    '20000000-0000-0000-0000-000000000002'
  );

insert into regulatory.project_versions (
  id,
  organization_id,
  project_id,
  version_number,
  schema_version,
  catalog_digest,
  created_by
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    1,
    'PROSPECTUS_CANONICAL_MODEL_V1',
    repeat('a', 64),
    '20000000-0000-0000-0000-000000000001'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000002',
    1,
    'PROSPECTUS_CANONICAL_MODEL_V1',
    repeat('b', 64),
    '20000000-0000-0000-0000-000000000002'
  );

-- Les contraintes des fourchettes doivent être appliquées par PostgreSQL.
do $$
begin
  begin
    insert into regulatory.project_asset_ranges (
      organization_id,
      project_version_id,
      range_id,
      asset_class,
      minimum_percent,
      target_percent,
      maximum_percent
    ) values (
      '10000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      'RANGE-INVALID',
      'GOVERNMENT_BONDS',
      60,
      40,
      80
    );
    raise exception 'EXPECTED_ASSET_RANGE_CHECK_VIOLATION';
  exception
    when check_violation then null;
  end;
end;
$$;

insert into regulatory.project_asset_ranges (
  organization_id,
  project_version_id,
  range_id,
  asset_class,
  minimum_percent,
  target_percent,
  maximum_percent
) values (
  '10000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  'RANGE-VALID',
  'GOVERNMENT_BONDS',
  40,
  60,
  100
);

-- Un seul État d'établissement est autorisé par version.
insert into regulatory.project_country_arrangements (
  organization_id,
  project_version_id,
  arrangement_id,
  country_code,
  is_home_state,
  marketing_authorization_reference,
  paying_agents,
  redemption_locations,
  information_locations
) values (
  '10000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  'COUNTRY-CI',
  'CI',
  true,
  'AUTH-CI',
  'Paying agent CI',
  'Redemption location CI',
  'Information location CI'
);

do $$
begin
  begin
    insert into regulatory.project_country_arrangements (
      organization_id,
      project_version_id,
      arrangement_id,
      country_code,
      is_home_state,
      marketing_authorization_reference,
      paying_agents,
      redemption_locations,
      information_locations
    ) values (
      '10000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      'COUNTRY-SN',
      'SN',
      true,
      'AUTH-SN',
      'Paying agent SN',
      'Redemption location SN',
      'Information location SN'
    );
    raise exception 'EXPECTED_SINGLE_HOME_STATE_VIOLATION';
  exception
    when unique_violation then null;
  end;
end;
$$;

-- Le verrou ready_for_submission=false doit être assuré par la base.
do $$
begin
  begin
    insert into regulatory.canonical_snapshots (
      organization_id,
      project_version_id,
      schema_version,
      snapshot_sha256,
      canonical_data,
      coverage,
      ready_for_submission
    ) values (
      '10000000-0000-0000-0000-000000000001',
      '40000000-0000-0000-0000-000000000001',
      'PROSPECTUS_CANONICAL_MODEL_V1',
      repeat('c', 64),
      '{}'::jsonb,
      '{}'::jsonb,
      true
    );
    raise exception 'EXPECTED_SUBMISSION_FLAG_VIOLATION';
  exception
    when check_violation then null;
  end;
end;
$$;

-- Une version gelée devient immuable.
update regulatory.project_versions
set frozen_at = now(), frozen_by = '20000000-0000-0000-0000-000000000001'
where id = '40000000-0000-0000-0000-000000000001';

do $$
begin
  begin
    update regulatory.project_versions
    set change_summary = 'Mutation interdite'
    where id = '40000000-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_FROZEN_VERSION_VIOLATION';
  exception
    when raise_exception then
      if sqlerrm <> 'PROJECT_VERSION_FROZEN' then
        raise;
      end if;
  end;
end;
$$;

-- L'audit est append-only.
insert into regulatory.audit_events (
  id,
  organization_id,
  project_id,
  project_version_id,
  actor_id,
  event_type,
  entity_type,
  entity_id,
  event_hash
) values (
  '50000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  'PROJECT_VERSION_FROZEN',
  'project_version',
  '40000000-0000-0000-0000-000000000001',
  repeat('d', 64)
);

do $$
begin
  begin
    update regulatory.audit_events
    set event_type = 'MUTATED'
    where id = '50000000-0000-0000-0000-000000000001';
    raise exception 'EXPECTED_AUDIT_APPEND_ONLY_VIOLATION';
  exception
    when raise_exception then
      if sqlerrm <> 'AUDIT_EVENTS_ARE_APPEND_ONLY' then
        raise;
      end if;
  end;
end;
$$;

-- Tester la RLS avec un rôle qui ne possède pas les tables et ne contourne pas la RLS.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'regulatory_app_test') then
    create role regulatory_app_test noinherit nologin;
  end if;
end;
$$;

grant usage on schema regulatory to regulatory_app_test;
grant select on regulatory.organizations to regulatory_app_test;
grant select on regulatory.projects to regulatory_app_test;
grant select on regulatory.project_versions to regulatory_app_test;

set role regulatory_app_test;
select set_config('app.current_organization_id', '10000000-0000-0000-0000-000000000001', true);

do $$
declare
  visible_projects integer;
  visible_versions integer;
begin
  select count(*) into visible_projects from regulatory.projects;
  select count(*) into visible_versions from regulatory.project_versions;
  if visible_projects <> 1 then
    raise exception 'RLS_PROJECT_ISOLATION_FAILED:%', visible_projects;
  end if;
  if visible_versions <> 1 then
    raise exception 'RLS_VERSION_ISOLATION_FAILED:%', visible_versions;
  end if;
end;
$$;

select set_config('app.current_organization_id', '10000000-0000-0000-0000-000000000002', true);

do $$
declare
  visible_project_name text;
begin
  select legal_name into visible_project_name from regulatory.projects;
  if visible_project_name <> 'Beta Fund' then
    raise exception 'RLS_TENANT_SWITCH_FAILED:%', coalesce(visible_project_name, '<null>');
  end if;
end;
$$;

reset role;

rollback;

\echo 'POSTGRESQL_REGULATORY_CORE_TESTS_PASS'
