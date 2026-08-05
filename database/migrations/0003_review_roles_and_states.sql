alter type regulatory.review_role add value if not exists 'ADMIN';
alter type regulatory.review_role add value if not exists 'READER';

alter type regulatory.project_status add value if not exists 'RISK_REVIEW';
alter type regulatory.project_status add value if not exists 'OPERATIONS_REVIEW';
alter type regulatory.project_status add value if not exists 'TAX_REVIEW';
alter type regulatory.project_status add value if not exists 'CHANGES_REQUESTED';
alter type regulatory.project_status add value if not exists 'INTERNALLY_FROZEN';
