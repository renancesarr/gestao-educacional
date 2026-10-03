CREATE TABLE identity.platform_admins (
  id uuid PRIMARY KEY,
  username varchar(100) NOT NULL UNIQUE CHECK (length(trim(username)) > 0),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL
);

CREATE TABLE identity.platform_activation_codes (
  admin_id uuid PRIMARY KEY REFERENCES identity.platform_admins(id) ON DELETE CASCADE,
  code_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);

CREATE TABLE identity.platform_passkeys (
  credential_id text PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES identity.platform_admins(id) ON DELETE CASCADE,
  public_key bytea NOT NULL,
  counter bigint NOT NULL CHECK (counter >= 0),
  transports text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL,
  UNIQUE (admin_id, credential_id)
);

CREATE TABLE identity.platform_registration_challenges (
  token_hash char(64) PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES identity.platform_admins(id) ON DELETE CASCADE,
  activation_code_hash char(64) NOT NULL,
  challenge text NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE identity.platform_login_challenges (
  token_hash char(64) PRIMARY KEY,
  username varchar(100) NOT NULL,
  challenge text NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE TABLE identity.platform_sessions (
  token_hash char(64) PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES identity.platform_admins(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX platform_sessions_expiry ON identity.platform_sessions(expires_at);

CREATE TABLE audit.platform_events (
  id uuid PRIMARY KEY,
  actor_admin_id uuid REFERENCES identity.platform_admins(id),
  system_actor text,
  target_admin_id uuid REFERENCES identity.platform_admins(id),
  target_tenant_id uuid REFERENCES institution.tenants(id),
  action text NOT NULL CHECK (action IN ('platform_admin.provisioned', 'platform_admin.activated', 'platform_admin.authenticated', 'platform_admin.recovered', 'institution.created')),
  occurred_at timestamptz NOT NULL,
  CHECK ((actor_admin_id IS NOT NULL) <> (system_actor IS NOT NULL))
);
CREATE INDEX platform_events_target_tenant ON audit.platform_events(target_tenant_id, occurred_at);
