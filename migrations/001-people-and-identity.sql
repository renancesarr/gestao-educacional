CREATE SCHEMA institution;
CREATE SCHEMA identity;
CREATE SCHEMA people;
CREATE SCHEMA audit;

CREATE TABLE institution.tenants (
  id uuid PRIMARY KEY,
  code varchar(100) NOT NULL UNIQUE CHECK (code ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  name varchar(200) NOT NULL CHECK (length(trim(name)) > 0),
  created_at timestamptz NOT NULL
);
CREATE TABLE identity.accounts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  username varchar(100) NOT NULL CHECK (length(trim(username)) > 0),
  account_context text NOT NULL CHECK (account_context IN ('professional', 'student', 'guardian')),
  role text NOT NULL CHECK (role IN ('TENANT_ADMIN', 'ACADEMIC_SECRETARY', 'VIEWER')),
  password_hash text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  UNIQUE (tenant_id, id),
  UNIQUE (tenant_id, account_context, username)
);
CREATE TABLE identity.sessions (
  token_hash char(64) PRIMARY KEY,
  tenant_id uuid NOT NULL,
  account_id uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  FOREIGN KEY (tenant_id, account_id) REFERENCES identity.accounts(tenant_id, id) ON DELETE CASCADE
);
CREATE INDEX sessions_expiry ON identity.sessions(expires_at);

CREATE TABLE people.people (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  name varchar(200) NOT NULL CHECK (length(trim(name)) > 0),
  cpf varchar(11) CHECK (cpf ~ '^[0-9]{11}$'),
  institutional_id varchar(100) CHECK (length(trim(institutional_id)) > 0),
  created_at timestamptz NOT NULL,
  CHECK (cpf IS NOT NULL OR institutional_id IS NOT NULL),
  UNIQUE (tenant_id, id),
  CONSTRAINT people_tenant_cpf_key UNIQUE (tenant_id, cpf),
  CONSTRAINT people_tenant_institutional_key UNIQUE (tenant_id, institutional_id)
);
CREATE TABLE audit.events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  actor_id uuid,
  system_actor text,
  person_id uuid,
  action text NOT NULL CHECK (action IN ('person.created', 'institution.created', 'account.created')),
  occurred_at timestamptz NOT NULL,
  CHECK ((action = 'person.created') = (person_id IS NOT NULL)),
  CHECK ((actor_id IS NOT NULL) <> (system_actor IS NOT NULL)),
  CHECK (action <> 'person.created' OR actor_id IS NOT NULL),
  FOREIGN KEY (tenant_id, actor_id) REFERENCES identity.accounts(tenant_id, id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES people.people(tenant_id, id)
);
CREATE INDEX events_person ON audit.events(tenant_id, person_id, occurred_at);
