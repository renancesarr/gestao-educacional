ALTER TABLE people.people
  ADD COLUMN birth_municipality varchar(120),
  ADD COLUMN birth_uf char(2);

ALTER TABLE people.people
  ADD CONSTRAINT people_birthplace_pair_check CHECK (
    (birth_municipality IS NULL AND birth_uf IS NULL) OR
    (length(trim(birth_municipality)) > 0 AND birth_uf ~ '^[A-Z]{2}$')
  );
