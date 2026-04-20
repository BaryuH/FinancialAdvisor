BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;

UPDATE users
SET email = LOWER(email)
WHERE email IS NOT NULL
  AND email <> LOWER(email);

UPDATE users
SET email = CONCAT('legacy-', id::text, '@local.invalid')
WHERE email IS NULL OR length(btrim(email)) = 0;

UPDATE users
SET password_hash = crypt('legacy-disabled-password-' || id::text, gen_salt('bf'))
WHERE password_hash IS NULL OR length(btrim(password_hash)) = 0;

ALTER TABLE users
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE users
  ALTER COLUMN password_hash SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_categories_user_slug_flow'
      AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories DROP CONSTRAINT uq_categories_user_slug_flow;
  END IF;
END $$;

DROP INDEX IF EXISTS uq_users_email_lower;
CREATE UNIQUE INDEX uq_users_email_lower
  ON users (LOWER(email));

DROP INDEX IF EXISTS uq_categories_system_slug_flow;
CREATE UNIQUE INDEX uq_categories_system_slug_flow
  ON categories(slug, flow_type)
  WHERE user_id IS NULL;

DROP INDEX IF EXISTS uq_categories_user_slug_flow;
CREATE UNIQUE INDEX uq_categories_user_slug_flow
  ON categories(user_id, slug, flow_type)
  WHERE user_id IS NOT NULL;

COMMIT;