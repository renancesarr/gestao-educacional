CREATE TABLE academic.collaborators (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  person_id uuid NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, person_id),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES people.people(tenant_id, id)
);
