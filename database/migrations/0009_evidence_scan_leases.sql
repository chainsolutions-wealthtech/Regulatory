begin;

alter table regulatory.evidence_objects
  add column scan_claimed_by uuid references regulatory.app_users(id),
  add column scan_lease_expires_at timestamptz,
  add column scan_attempt_count integer not null default 0
    check (scan_attempt_count >= 0);

alter table regulatory.evidence_objects
  add constraint evidence_scan_lease_consistency check (
    (state <> 'SCANNING' and scan_lease_expires_at is null and scan_claimed_by is null)
    or
    (state = 'SCANNING' and scan_status = 'PENDING' and scan_started_at is not null
      and scan_lease_expires_at is not null and scan_claimed_by is not null and scan_attempt_count > 0)
  );

create index evidence_objects_scan_queue_idx
  on regulatory.evidence_objects (
    organization_id,
    scan_status,
    state,
    scan_lease_expires_at,
    created_at
  )
  where scan_status = 'PENDING' and state in ('QUARANTINED', 'SCANNING');

comment on column regulatory.evidence_objects.scan_claimed_by is
  'Verified SECURITY/service identity currently holding the server-side malware scan lease.';
comment on column regulatory.evidence_objects.scan_lease_expires_at is
  'Lease expiry used to recover a SCANNING object after worker interruption. It is not a malware verdict.';
comment on column regulatory.evidence_objects.scan_attempt_count is
  'Monotonic count of server-side scan claims. Browser clients cannot mutate this field.';

commit;
