begin;

create extension if not exists pgcrypto;

create schema if not exists regulatory;

comment on schema regulatory is
  'Prospectus Composer transactional model. Technical schema only; it does not establish legal or regulatory compliance.';

create type regulatory.project_status as enum (
  'DRAFT',
  'QUESTIONNAIRE_IN_PROGRESS',
  'PRE_COMPLIANCE_REVIEW',
  'COMPLIANCE_REVIEW',
  'LEGAL_REVIEW',
  'READY_FOR_INTERNAL_APPROVAL',
  'ARCHIVED'
);

create type regulatory.review_status as enum (
  'UNREVIEWED',
  'PENDING_REVIEW',
  'CONFIRMED'
);

create type regulatory.verification_status as enum (
  'USER_PROVIDED_PENDING_REVIEW',
  'PREFILLED_PENDING_CONFIRMATION',
  'VERIFIED',
  'REJECTED'
);

create type regulatory.review_role as enum (
  'PRODUCT',
  'RISK',
  'COMPLIANCE',
  'LEGAL',
  'TAX',
  'SECURITY',
  'OPERATIONS',
  'AUDIT'
);

create type regulatory.review_decision_status as enum (
  'REQUESTED',
  'IN_PROGRESS',
  'CHANGES_REQUESTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

create type regulatory.evidence_verification_status as enum (
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

create table regulatory.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  legal_name text not null check (length(trim(legal_name)) > 0),
  country_code char(2),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table regulatory.app_users (
  id uuid primary key default gen_random_uuid(),
  external_subject text not null unique,
  email text,
  display_name text not null,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table regulatory.organization_memberships (
  organization_id uuid not null references regulatory.organizations(id) on delete cascade,
  user_id uuid not null references regulatory.app_users(id) on delete cascade,
  role regulatory.review_role not null,
  is_administrator boolean not null default false,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (organization_id, user_id, role)
);

create index organization_memberships_user_idx
  on regulatory.organization_memberships (user_id, organization_id)
  where revoked_at is null;

create table regulatory.regulatory_sources (
  id uuid primary key default gen_random_uuid(),
  source_code text not null unique,
  jurisdiction text not null,
  authority text not null,
  title text not null,
  official_url text,
  sha256 char(64) check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  byte_size bigint check (byte_size is null or byte_size >= 0),
  signed_on date,
  effective_on date,
  status text not null default 'PENDING_VERIFICATION',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table regulatory.requirements (
  id uuid primary key default gen_random_uuid(),
  requirement_code text not null unique,
  source_id uuid not null references regulatory.regulatory_sources(id),
  parent_requirement_id uuid references regulatory.requirements(id),
  sequence_number numeric(12,4),
  title text not null,
  requirement_text text,
  applicability_expression jsonb not null default '{}'::jsonb,
  default_coverage_status text not null default 'PENDING_REVIEW',
  severity text not null default 'WARNING' check (severity in ('INFO', 'WARNING', 'BLOCKER')),
  evidence_types text[] not null default '{}',
  review_roles regulatory.review_role[] not null default '{}',
  effective_from date,
  effective_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create index requirements_source_sequence_idx
  on regulatory.requirements (source_id, sequence_number);

create table regulatory.clauses (
  id uuid primary key default gen_random_uuid(),
  clause_code text not null unique,
  title text not null,
  category text not null,
  jurisdiction text not null,
  product_types text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table regulatory.clause_versions (
  id uuid primary key default gen_random_uuid(),
  clause_id uuid not null references regulatory.clauses(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  wording text not null,
  activation_conditions jsonb not null default '{}'::jsonb,
  required_field_paths text[] not null default '{}',
  status text not null default 'DRAFT_LEGAL_REVIEW_REQUIRED'
    check (status in ('DRAFT', 'DRAFT_LEGAL_REVIEW_REQUIRED', 'APPROVED', 'ACTIVE', 'RETIRED')),
  effective_from date,
  effective_to date,
  approved_by uuid references regulatory.app_users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (clause_id, version_number),
  check ((status not in ('APPROVED', 'ACTIVE')) or (approved_by is not null and approved_at is not null)),
  check (effective_to is null or effective_from is null or effective_to >= effective_from)
);

create unique index clause_versions_single_active_idx
  on regulatory.clause_versions (clause_id)
  where status = 'ACTIVE';

create table regulatory.clause_requirement_links (
  clause_version_id uuid not null references regulatory.clause_versions(id) on delete cascade,
  requirement_id uuid not null references regulatory.requirements(id) on delete cascade,
  coverage_mode text not null default 'IN_PROSPECTUS',
  primary key (clause_version_id, requirement_id)
);

create table regulatory.rules (
  id uuid primary key default gen_random_uuid(),
  rule_code text not null unique,
  version_number integer not null default 1 check (version_number > 0),
  title text not null,
  severity text not null check (severity in ('INFO', 'WARNING', 'BLOCKER')),
  condition_expression jsonb not null,
  remediation text,
  requirement_codes text[] not null default '{}',
  status text not null default 'DRAFT' check (status in ('DRAFT', 'ACTIVE', 'RETIRED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table regulatory.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  canonical_slug text not null check (canonical_slug ~ '^[a-z0-9][a-z0-9-]{1,79}$'),
  legal_name text not null,
  legal_form text not null default 'FCP' check (legal_form = 'FCP'),
  category text not null check (category in ('MONETARY', 'BOND', 'EQUITY', 'DIVERSIFIED', 'FUND_OF_FUNDS')),
  jurisdiction text not null default 'UMOA' check (jurisdiction = 'UMOA'),
  authority text not null default 'AMF-UMOA' check (authority = 'AMF-UMOA'),
  operation text not null check (operation in ('CREATE', 'UPDATE')),
  status regulatory.project_status not null default 'DRAFT',
  created_by uuid not null references regulatory.app_users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  unique (organization_id, canonical_slug)
);

create index projects_org_status_updated_idx
  on regulatory.projects (organization_id, status, updated_at desc)
  where archived_at is null;

create table regulatory.project_versions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_id uuid not null references regulatory.projects(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  schema_version text not null,
  catalog_digest char(64) not null check (catalog_digest ~ '^[0-9a-f]{64}$'),
  source_version_id uuid references regulatory.project_versions(id),
  change_summary text,
  created_by uuid not null references regulatory.app_users(id),
  created_at timestamptz not null default now(),
  frozen_at timestamptz,
  frozen_by uuid references regulatory.app_users(id),
  unique (project_id, version_number),
  check ((frozen_at is null and frozen_by is null) or (frozen_at is not null and frozen_by is not null))
);

create index project_versions_org_project_idx
  on regulatory.project_versions (organization_id, project_id, version_number desc);

create table regulatory.project_answers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  question_id text not null,
  value jsonb not null,
  source text not null check (source in ('USER', 'PREFILLED', 'DERIVED', 'EXTRACTED_UNVERIFIED')),
  review_status regulatory.review_status not null default 'UNREVIEWED',
  requirement_codes text[] not null default '{}',
  canonical_field_paths text[] not null default '{}',
  updated_by uuid not null references regulatory.app_users(id),
  updated_at timestamptz not null default now(),
  unique (project_version_id, question_id)
);

create index project_answers_question_idx
  on regulatory.project_answers (organization_id, question_id, project_version_id);

create table regulatory.canonical_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  schema_version text not null,
  snapshot_sha256 char(64) not null check (snapshot_sha256 ~ '^[0-9a-f]{64}$'),
  canonical_data jsonb not null,
  coverage jsonb not null,
  findings jsonb not null default '[]'::jsonb,
  ready_for_submission boolean not null default false check (ready_for_submission = false),
  created_at timestamptz not null default now(),
  unique (project_version_id, snapshot_sha256)
);

create index canonical_snapshots_project_created_idx
  on regulatory.canonical_snapshots (organization_id, project_version_id, created_at desc);

create table regulatory.project_share_classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  class_id text not null check (class_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  currency char(3) not null check (currency ~ '^[A-Z]{3}$'),
  income_policy text not null check (income_policy in ('CAPITALIZED', 'DISTRIBUTED')),
  initial_nav numeric(24,8) not null check (initial_nav > 0),
  initial_subscription_minimum jsonb not null,
  decimalization jsonb not null,
  review_status regulatory.review_status not null default 'UNREVIEWED',
  unique (project_version_id, class_id)
);

create table regulatory.project_asset_ranges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  range_id text not null check (range_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  asset_class text not null,
  minimum_percent numeric(7,4) not null,
  target_percent numeric(7,4) not null,
  maximum_percent numeric(7,4) not null,
  review_status regulatory.review_status not null default 'UNREVIEWED',
  unique (project_version_id, range_id),
  unique (project_version_id, asset_class),
  check (minimum_percent between 0 and 100),
  check (target_percent between 0 and 100),
  check (maximum_percent between 0 and 100),
  check (minimum_percent <= target_percent and target_percent <= maximum_percent)
);

create table regulatory.project_fees (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  fee_id text not null check (fee_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  collection_kind text not null check (collection_kind in ('TRANSACTION_FEE', 'REMUNERATION')),
  fee_type text not null,
  label text not null,
  payer_type text not null check (payer_type in ('HOLDER', 'FUND_ASSETS')),
  beneficiary text not null,
  basis text not null,
  rate_type text not null check (rate_type in ('PERCENTAGE', 'PER_MILLE', 'FIXED', 'NONE', 'OTHER')),
  rate_percent numeric(9,6),
  rate_per_mille numeric(9,6),
  amount numeric(24,8),
  currency char(3),
  frequency text not null,
  cap text,
  tax_display text,
  review_status regulatory.review_status not null default 'UNREVIEWED',
  unique (project_version_id, fee_id),
  check (rate_percent is null or rate_percent between 0 and 100),
  check (rate_per_mille is null or rate_per_mille between 0 and 1000),
  check (amount is null or amount >= 0),
  check (currency is null or currency ~ '^[A-Z]{3}$'),
  check (
    (rate_type = 'PERCENTAGE' and rate_percent is not null) or
    (rate_type = 'PER_MILLE' and rate_per_mille is not null) or
    (rate_type = 'FIXED' and amount is not null and currency is not null) or
    (rate_type in ('NONE', 'OTHER'))
  )
);

create table regulatory.project_valuation_methods (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  method_id text not null check (method_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  asset_class text not null,
  primary_method text not null,
  price_source text not null,
  fallback_method text not null,
  frequency text not null,
  exception_process text not null,
  review_status regulatory.review_status not null default 'UNREVIEWED',
  unique (project_version_id, method_id),
  unique (project_version_id, asset_class)
);

create table regulatory.project_parties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  party_id text not null check (party_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  collection_kind text not null check (collection_kind in ('GOVERNANCE', 'SERVICE_PROVIDER')),
  role text not null,
  legal_name text not null default '',
  person_name text,
  legal_form text,
  approval_number text,
  registered_office text,
  main_activity text,
  function_title text,
  significant_external_activities text,
  conflicts text,
  verification_status regulatory.verification_status not null default 'USER_PROVIDED_PENDING_REVIEW',
  unique (project_version_id, party_id),
  check (
    (role = 'GOVERNANCE_MEMBER' and person_name is not null and function_title is not null) or
    (role <> 'GOVERNANCE_MEMBER' and length(trim(legal_name)) > 0)
  )
);

create index project_parties_role_idx
  on regulatory.project_parties (organization_id, project_version_id, role);

create table regulatory.project_risks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  risk_id text not null check (risk_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  category text not null,
  label text not null,
  description text not null,
  source text not null check (source in ('DERIVED', 'USER', 'REGULATORY_REFERENCE')),
  review_status regulatory.review_status not null default 'UNREVIEWED',
  unique (project_version_id, risk_id)
);

create table regulatory.project_country_arrangements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  arrangement_id text not null check (arrangement_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  country_code char(2) not null check (country_code in ('BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'SN', 'TG')),
  is_home_state boolean not null default false,
  marketing_authorization_reference text not null,
  paying_agents text not null,
  redemption_locations text not null,
  information_locations text not null,
  review_status regulatory.review_status not null default 'UNREVIEWED',
  unique (project_version_id, arrangement_id),
  unique (project_version_id, country_code)
);

create unique index project_country_single_home_state_idx
  on regulatory.project_country_arrangements (project_version_id)
  where is_home_state;

create table regulatory.evidence_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  evidence_id text not null check (evidence_id ~ '^[A-Z0-9][A-Z0-9_-]{0,47}$'),
  evidence_type text not null,
  title text not null,
  reference text not null,
  issuer text not null,
  issue_date date,
  file_reference text not null,
  file_sha256 char(64) check (file_sha256 is null or file_sha256 ~ '^[0-9a-f]{64}$'),
  verification_status regulatory.evidence_verification_status not null default 'PENDING',
  verified_by uuid references regulatory.app_users(id),
  verified_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (project_version_id, evidence_id),
  check (
    (verification_status = 'VERIFIED' and verified_by is not null and verified_at is not null) or
    verification_status <> 'VERIFIED'
  )
);

create table regulatory.review_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  role regulatory.review_role not null,
  status regulatory.review_decision_status not null default 'REQUESTED',
  assigned_to uuid references regulatory.app_users(id),
  requested_by uuid not null references regulatory.app_users(id),
  requested_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  scope jsonb not null default '{}'::jsonb,
  unique (project_version_id, role, status)
);

create index review_requests_assignee_status_idx
  on regulatory.review_requests (organization_id, assigned_to, status, due_at)
  where status in ('REQUESTED', 'IN_PROGRESS', 'CHANGES_REQUESTED');

create table regulatory.review_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  review_request_id uuid not null references regulatory.review_requests(id) on delete cascade,
  decision regulatory.review_decision_status not null,
  rationale text not null,
  decided_by uuid not null references regulatory.app_users(id),
  decided_at timestamptz not null default now(),
  finding_ids text[] not null default '{}',
  evidence_ids text[] not null default '{}'
);

create table regulatory.generated_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  canonical_snapshot_id uuid not null references regulatory.canonical_snapshots(id),
  generation_id text not null,
  document_type text not null,
  media_type text not null,
  storage_reference text not null,
  sha256 char(64) not null check (sha256 ~ '^[0-9a-f]{64}$'),
  byte_size bigint not null check (byte_size >= 0),
  document_status text not null default 'DRAFT_PRE_COMPLIANCE_REVIEW',
  ready_for_submission boolean not null default false check (ready_for_submission = false),
  generation_manifest jsonb not null,
  created_by uuid not null references regulatory.app_users(id),
  created_at timestamptz not null default now(),
  unique (project_version_id, generation_id, document_type)
);

create index generated_documents_project_created_idx
  on regulatory.generated_documents (organization_id, project_version_id, created_at desc);

create table regulatory.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_id uuid references regulatory.projects(id),
  project_version_id uuid references regulatory.project_versions(id),
  actor_id uuid references regulatory.app_users(id),
  event_type text not null,
  entity_type text not null,
  entity_id text,
  correlation_id uuid not null default gen_random_uuid(),
  occurred_at timestamptz not null default clock_timestamp(),
  payload jsonb not null default '{}'::jsonb,
  previous_hash char(64),
  event_hash char(64) not null check (event_hash ~ '^[0-9a-f]{64}$')
);

create index audit_events_org_time_idx
  on regulatory.audit_events (organization_id, occurred_at desc);
create index audit_events_project_time_idx
  on regulatory.audit_events (project_id, occurred_at desc)
  where project_id is not null;

create or replace function regulatory.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
before update on regulatory.organizations
for each row execute function regulatory.set_updated_at();

create trigger app_users_set_updated_at
before update on regulatory.app_users
for each row execute function regulatory.set_updated_at();

create trigger regulatory_sources_set_updated_at
before update on regulatory.regulatory_sources
for each row execute function regulatory.set_updated_at();

create trigger requirements_set_updated_at
before update on regulatory.requirements
for each row execute function regulatory.set_updated_at();

create trigger clauses_set_updated_at
before update on regulatory.clauses
for each row execute function regulatory.set_updated_at();

create trigger rules_set_updated_at
before update on regulatory.rules
for each row execute function regulatory.set_updated_at();

create trigger projects_set_updated_at
before update on regulatory.projects
for each row execute function regulatory.set_updated_at();

create or replace function regulatory.prevent_frozen_version_mutation()
returns trigger
language plpgsql
as $$
begin
  if old.frozen_at is not null then
    raise exception 'PROJECT_VERSION_FROZEN';
  end if;
  return new;
end;
$$;

create trigger project_versions_prevent_frozen_update
before update on regulatory.project_versions
for each row execute function regulatory.prevent_frozen_version_mutation();

create or replace function regulatory.prevent_audit_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'AUDIT_EVENTS_ARE_APPEND_ONLY';
end;
$$;

create trigger audit_events_prevent_update
before update or delete on regulatory.audit_events
for each row execute function regulatory.prevent_audit_mutation();

create or replace function regulatory.current_organization_id()
returns uuid
language sql
stable
set search_path = pg_catalog
as $$
  select nullif(current_setting('app.current_organization_id', true), '')::uuid
$$;

alter table regulatory.organizations enable row level security;
alter table regulatory.organization_memberships enable row level security;
alter table regulatory.projects enable row level security;
alter table regulatory.project_versions enable row level security;
alter table regulatory.project_answers enable row level security;
alter table regulatory.canonical_snapshots enable row level security;
alter table regulatory.project_share_classes enable row level security;
alter table regulatory.project_asset_ranges enable row level security;
alter table regulatory.project_fees enable row level security;
alter table regulatory.project_valuation_methods enable row level security;
alter table regulatory.project_parties enable row level security;
alter table regulatory.project_risks enable row level security;
alter table regulatory.project_country_arrangements enable row level security;
alter table regulatory.evidence_items enable row level security;
alter table regulatory.review_requests enable row level security;
alter table regulatory.review_decisions enable row level security;
alter table regulatory.generated_documents enable row level security;
alter table regulatory.audit_events enable row level security;

create policy organizations_tenant_policy on regulatory.organizations
  using (id = regulatory.current_organization_id())
  with check (id = regulatory.current_organization_id());

create policy organization_memberships_tenant_policy on regulatory.organization_memberships
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy projects_tenant_policy on regulatory.projects
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_versions_tenant_policy on regulatory.project_versions
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_answers_tenant_policy on regulatory.project_answers
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy canonical_snapshots_tenant_policy on regulatory.canonical_snapshots
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_share_classes_tenant_policy on regulatory.project_share_classes
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_asset_ranges_tenant_policy on regulatory.project_asset_ranges
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_fees_tenant_policy on regulatory.project_fees
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_valuation_methods_tenant_policy on regulatory.project_valuation_methods
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_parties_tenant_policy on regulatory.project_parties
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_risks_tenant_policy on regulatory.project_risks
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_country_arrangements_tenant_policy on regulatory.project_country_arrangements
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy evidence_items_tenant_policy on regulatory.evidence_items
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy review_requests_tenant_policy on regulatory.review_requests
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy review_decisions_tenant_policy on regulatory.review_decisions
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy generated_documents_tenant_policy on regulatory.generated_documents
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy audit_events_tenant_policy on regulatory.audit_events
  for select
  using (organization_id = regulatory.current_organization_id());

comment on column regulatory.canonical_snapshots.ready_for_submission is
  'Hard-locked to false in V1. A future controlled migration may change this only after governance approval.';
comment on column regulatory.generated_documents.ready_for_submission is
  'Hard-locked to false in V1. Generated documents remain pre-compliance artifacts.';
comment on table regulatory.audit_events is
  'Append-only audit log. Production use requires cryptographic chain generation in the application transaction.';

commit;
