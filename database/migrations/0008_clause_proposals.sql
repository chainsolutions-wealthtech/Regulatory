begin;

create table regulatory.clause_proposals (
  id uuid primary key,
  organization_id uuid not null references regulatory.organizations(id) on delete cascade,
  source_clause_id text not null check (length(trim(source_clause_id)) > 0),
  source_catalog_digest char(64) not null check (source_catalog_digest ~ '^[0-9a-f]{64}$'),
  source_wording text not null check (length(trim(source_wording)) > 0),
  created_by uuid not null references regulatory.app_users(id),
  created_at timestamptz not null default now()
);

create index clause_proposals_tenant_created_idx
  on regulatory.clause_proposals (organization_id, created_at desc, id);

create table regulatory.clause_proposal_versions (
  id uuid primary key,
  organization_id uuid not null references regulatory.organizations(id) on delete cascade,
  proposal_id uuid not null references regulatory.clause_proposals(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  prior_version_id uuid references regulatory.clause_proposal_versions(id),
  wording text not null check (length(trim(wording)) > 0),
  status text not null check (status in ('DRAFT', 'DRAFT_LEGAL_REVIEW_REQUIRED', 'APPROVED')),
  transition_event text not null check (transition_event in ('CREATE_DRAFT', 'REQUEST_LEGAL_REVIEW', 'APPROVE')),
  actor_user_id uuid not null references regulatory.app_users(id),
  approved_by uuid references regulatory.app_users(id),
  approved_at timestamptz,
  ready_for_submission boolean not null default false check (ready_for_submission = false),
  created_at timestamptz not null default now(),
  unique (proposal_id, version_number),
  check (
    (status = 'APPROVED' and transition_event = 'APPROVE' and approved_by is not null and approved_at is not null)
    or
    (status <> 'APPROVED' and approved_by is null and approved_at is null)
  )
);

create index clause_proposal_versions_tenant_proposal_idx
  on regulatory.clause_proposal_versions (organization_id, proposal_id, version_number desc);

create or replace function regulatory.validate_clause_proposal_version_insert()
returns trigger
language plpgsql
as $$
declare
  proposal_record regulatory.clause_proposals%rowtype;
  prior_record regulatory.clause_proposal_versions%rowtype;
begin
  select * into proposal_record
    from regulatory.clause_proposals
   where id = new.proposal_id;

  if not found or proposal_record.organization_id <> new.organization_id then
    raise exception 'CLAUSE_PROPOSAL_SCOPE_MISMATCH';
  end if;

  if new.version_number = 1 then
    if new.prior_version_id is not null
      or new.status <> 'DRAFT'
      or new.transition_event <> 'CREATE_DRAFT'
      or new.actor_user_id <> proposal_record.created_by then
      raise exception 'CLAUSE_PROPOSAL_INITIAL_VERSION_INVALID';
    end if;
    return new;
  end if;

  if new.prior_version_id is null then
    raise exception 'CLAUSE_PROPOSAL_PRIOR_VERSION_REQUIRED';
  end if;

  select * into prior_record
    from regulatory.clause_proposal_versions
   where id = new.prior_version_id;

  if not found
    or prior_record.organization_id <> new.organization_id
    or prior_record.proposal_id <> new.proposal_id
    or prior_record.version_number <> new.version_number - 1 then
    raise exception 'CLAUSE_PROPOSAL_PRIOR_VERSION_MISMATCH';
  end if;

  if new.wording is distinct from prior_record.wording then
    raise exception 'CLAUSE_PROPOSAL_TRANSITION_CANNOT_CHANGE_WORDING';
  end if;

  if new.transition_event = 'REQUEST_LEGAL_REVIEW' then
    if prior_record.status <> 'DRAFT'
      or new.status <> 'DRAFT_LEGAL_REVIEW_REQUIRED'
      or new.approved_by is not null
      or new.approved_at is not null then
      raise exception 'CLAUSE_PROPOSAL_REVIEW_TRANSITION_INVALID';
    end if;
  elsif new.transition_event = 'APPROVE' then
    if prior_record.status <> 'DRAFT_LEGAL_REVIEW_REQUIRED'
      or new.status <> 'APPROVED'
      or new.approved_by is distinct from new.actor_user_id
      or new.approved_at is null then
      raise exception 'CLAUSE_PROPOSAL_APPROVAL_TRANSITION_INVALID';
    end if;
    if new.actor_user_id = proposal_record.created_by then
      raise exception 'CLAUSE_PROPOSAL_AUTHOR_CANNOT_APPROVE';
    end if;
  else
    raise exception 'CLAUSE_PROPOSAL_TRANSITION_INVALID';
  end if;

  return new;
end;
$$;

create trigger clause_proposal_versions_validate_insert
before insert on regulatory.clause_proposal_versions
for each row execute function regulatory.validate_clause_proposal_version_insert();

create or replace function regulatory.prevent_clause_proposal_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'CLAUSE_PROPOSAL_APPEND_ONLY';
end;
$$;

create trigger clause_proposals_prevent_mutation
before update or delete on regulatory.clause_proposals
for each row execute function regulatory.prevent_clause_proposal_mutation();

create or replace function regulatory.prevent_clause_proposal_version_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'CLAUSE_PROPOSAL_VERSION_APPEND_ONLY';
end;
$$;

create trigger clause_proposal_versions_prevent_mutation
before update or delete on regulatory.clause_proposal_versions
for each row execute function regulatory.prevent_clause_proposal_version_mutation();

alter table regulatory.clause_proposals enable row level security;
alter table regulatory.clause_proposal_versions enable row level security;

create policy clause_proposals_tenant_policy on regulatory.clause_proposals
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy clause_proposal_versions_tenant_policy on regulatory.clause_proposal_versions
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

comment on table regulatory.clause_proposals is
  'Tenant-scoped candidate clause changes. They never mutate or activate the global generated clause catalog.';
comment on table regulatory.clause_proposal_versions is
  'Append-only human lifecycle history for tenant clause proposals. APPROVED is not ACTIVE and ready_for_submission remains false.';

commit;
