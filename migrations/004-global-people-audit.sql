ALTER TABLE audit.events DROP CONSTRAINT events_check2;
ALTER TABLE audit.events ADD CONSTRAINT events_person_created_actor_check
  CHECK (action <> 'person.created' OR actor_id IS NOT NULL OR system_actor ~ '^platform-admin:.+$');

ALTER TABLE audit.platform_events DROP CONSTRAINT platform_events_action_check;
ALTER TABLE audit.platform_events ADD CONSTRAINT platform_events_action_check
  CHECK (action IN (
    'platform_admin.provisioned', 'platform_admin.activated', 'platform_admin.authenticated',
    'platform_admin.recovered', 'institution.created', 'person.created'
  ));
