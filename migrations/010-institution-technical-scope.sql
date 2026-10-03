ALTER TABLE institution.education_scope_items
  DROP CONSTRAINT education_scope_items_scope_code_check;

ALTER TABLE institution.education_scope_items
  ADD CONSTRAINT education_scope_items_scope_code_check CHECK (scope_code IN (
    'BASIC_FUNDAMENTAL',
    'BASIC_FUNDAMENTAL_EJA',
    'BASIC_MEDIO',
    'BASIC_MEDIO_EJA',
    'TECHNICAL_MIDDLE',
    'HIGHER_GRADUATION'
  ));
