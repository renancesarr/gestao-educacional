CREATE TABLE academic.student_profiles (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  person_id uuid NOT NULL,
  created_at timestamptz NOT NULL,
  UNIQUE (tenant_id, person_id),
  UNIQUE (tenant_id, id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES people.people(tenant_id, id)
);

CREATE TABLE academic.enrollments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id),
  person_id uuid NOT NULL,
  course_id uuid NOT NULL,
  student_profile_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN ('ativa', 'trancada', 'cancelada', 'jubilada')),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  UNIQUE (tenant_id, person_id, course_id),
  FOREIGN KEY (tenant_id, person_id) REFERENCES people.people(tenant_id, id),
  FOREIGN KEY (tenant_id, course_id) REFERENCES academic.courses(tenant_id, id),
  FOREIGN KEY (tenant_id, student_profile_id) REFERENCES academic.student_profiles(tenant_id, id)
);
