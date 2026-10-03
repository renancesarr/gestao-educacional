CREATE UNIQUE INDEX courses_tenant_id_id_key ON academic.courses(tenant_id, id);

CREATE TABLE academic.subjects (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  course_id uuid NOT NULL,
  name varchar(200) NOT NULL CHECK (length(trim(name)) > 0),
  code varchar(100) NOT NULL CHECK (code ~ '^[a-z0-9][a-z0-9-]{1,99}$'),
  workload_hours integer NOT NULL CHECK (workload_hours > 0),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL,
  UNIQUE (course_id, code),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, course_id) REFERENCES academic.courses(tenant_id, id)
);

CREATE TABLE academic.subject_collaborators (
  tenant_id uuid NOT NULL,
  subject_id uuid NOT NULL,
  collaborator_id uuid NOT NULL,
  PRIMARY KEY (tenant_id, subject_id, collaborator_id),
  FOREIGN KEY (tenant_id, subject_id) REFERENCES academic.subjects(tenant_id, id),
  FOREIGN KEY (tenant_id, collaborator_id) REFERENCES academic.collaborators(tenant_id, id)
);
