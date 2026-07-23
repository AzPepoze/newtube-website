-- LEGACY BRIDGE: apply this file exactly once, and only after checking that
-- PRAGMA table_info(Users) does not list `is_admin`. It is intentionally not
-- idempotent: D1/SQLite cannot conditionally ALTER TABLE ADD COLUMN.
--
-- Do not apply this file to a fresh database. Fresh databases get this column
-- from schema.sql. See backend/README.md for the safe operator runbook.
ALTER TABLE Users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;
