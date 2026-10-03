CREATE TABLE institution.education_scope_items (
  tenant_id uuid NOT NULL REFERENCES institution.tenants(id) ON DELETE CASCADE,
  scope_code text NOT NULL CHECK (scope_code IN (
    'BASIC_FUNDAMENTAL',
    'BASIC_FUNDAMENTAL_EJA',
    'BASIC_MEDIO',
    'BASIC_MEDIO_EJA',
    'HIGHER_GRADUATION'
  )),
  PRIMARY KEY (tenant_id, scope_code)
);
