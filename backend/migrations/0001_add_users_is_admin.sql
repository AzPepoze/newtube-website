-- Apply once to an existing D1 database that was bootstrapped before the
-- marketplace schema. Wrangler records successful migrations, so it will not
-- run this ALTER again:
--   cd backend && npx wrangler d1 migrations apply DB --remote
--
-- New databases should be bootstrapped from ../schema.sql, which already has
-- this column, and should not apply this legacy bridge migration.
ALTER TABLE Users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
