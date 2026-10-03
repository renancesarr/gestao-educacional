CREATE SCHEMA academic;
CREATE TABLE academic.courses (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  name varchar(200) NOT NULL CHECK (length(trim(name)) > 0),
  code varchar(100) NOT NULL CHECK (code ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  scope_code text NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, code),
  FOREIGN KEY (tenant_id, scope_code) REFERENCES institution.education_scope_items(tenant_id, scope_code)
);
