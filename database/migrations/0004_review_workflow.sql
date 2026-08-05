begin;

create table regulatory.review_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  review_request_id uuid references regulatory.review_requests(id) on delete cascade,
  parent_comment_id uuid references regulatory.review_comments(id) on delete cascade,
  author_id uuid not null references regulatory.app_users(id),
  body text not null check (length(trim(body)) > 0),
  visibility text not null default 'PROJECT_REVIEWERS'
    check (visibility in ('PROJECT_REVIEWERS', 'ROLE_ONLY', 'AUDIT_ONLY')),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references regulatory.app_users(id),
  check ((resolved_at is null and resolved_by is null) or (resolved_at is not null and resolved_by is not null))
);

create index review_comments_project_created_idx
  on regulatory.review_comments (organization_id, project_version_id, created_at);
create index review_comments_request_created_idx
  on regulatory.review_comments (review_request_id, created_at)
  where review_request_id is not null;

create table regulatory.internal_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  role regulatory.review_role not null,
  approved_by uuid not null references regulatory.app_users(id),
  approval_type text not null
    check (approval_type in ('PRODUCT', 'RISK', 'OPERATIONS', 'COMPLIANCE', 'LEGAL', 'TAX', 'SECURITY', 'INTERNAL_FREEZE')),
  rationale text not null check (length(trim(rationale)) > 0),
  approved_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_by uuid references regulatory.app_users(id),
  revocation_rationale text,
  unique (project_version_id, approval_type, approved_by),
  check (
    (revoked_at is null and revoked_by is null and revocation_rationale is null) or
    (revoked_at is not null and revoked_by is not null and length(trim(revocation_rationale)) > 0)
  )
);

create unique index internal_approvals_active_role_idx
  on regulatory.internal_approvals (project_version_id, approval_type)
  where revoked_at is null;

create table regulatory.project_transition_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references regulatory.organizations(id),
  project_id uuid not null references regulatory.projects(id) on delete cascade,
  project_version_id uuid not null references regulatory.project_versions(id) on delete cascade,
  transition_code text not null,
  from_status regulatory.project_status not null,
  to_status regulatory.project_status not null,
  actor_id uuid not null references regulatory.app_users(id),
  actor_roles regulatory.review_role[] not null,
  mode text not null default 'HUMAN' check (mode in ('HUMAN', 'AUTOMATIC')),
  rationale text,
  policy_version text not null,
  evaluation jsonb not null,
  occurred_at timestamptz not null default now(),
  check (from_status <> to_status)
);

create index project_transition_events_project_time_idx
  on regulatory.project_transition_events (organization_id, project_id, occurred_at desc);

create or replace function regulatory.prevent_transition_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'PROJECT_TRANSITION_EVENTS_ARE_APPEND_ONLY';
end;
$$;

create trigger project_transition_events_prevent_mutation
before update or delete on regulatory.project_transition_events
for each row execute function regulatory.prevent_transition_event_mutation();

alter table regulatory.review_comments enable row level security;
alter table regulatory.internal_approvals enable row level security;
alter table regulatory.project_transition_events enable row level security;

create policy review_comments_tenant_policy on regulatory.review_comments
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy internal_approvals_tenant_policy on regulatory.internal_approvals
  using (organization_id = regulatory.current_organization_id())
  with check (organization_id = regulatory.current_organization_id());

create policy project_transition_events_tenant_select_policy on regulatory.project_transition_events
  for select
  using (organization_id = regulatory.current_organization_id());

create policy project_transition_events_tenant_insert_policy on regulatory.project_transition_events
  for insert
  with check (organization_id = regulatory.current_organization_id());

comment on table regulatory.internal_approvals is
  'Human internal decisions only. No row represents approval, visa or authorization by the regulator.';
comment on table regulatory.project_transition_events is
  'Append-only evaluation log for human and permitted technical workflow transitions.';

commit;
