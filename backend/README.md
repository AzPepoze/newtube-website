# Backend database operations

## Marketplace migration for an existing D1 database

`schema.sql` is rerunnable for tables and indexes, but SQLite/D1 cannot make
`ALTER TABLE ... ADD COLUMN` idempotent. Therefore the legacy `is_admin`
bridge must be run manually and exactly once. It is not part of an automatic
application startup path.

From `backend/`, first inspect the remote database:

```bash
npx wrangler d1 execute DB --remote --command "PRAGMA table_info(Users);"
```

If the output already contains `is_admin`, do **not** run the legacy file.
Instead deploy the safe bootstrap schema to add the marketplace tables:

```bash
npx wrangler d1 execute DB --remote --file=schema.sql
```

If `is_admin` is absent, take a backup according to the project's D1 backup
procedure, then apply the bridge once, followed by the bootstrap schema:

```bash
npx wrangler d1 execute DB --remote --file=migrations/0001_add_users_is_admin.sql
npx wrangler d1 execute DB --remote --file=schema.sql
```

Verify the new column before proceeding:

```bash
npx wrangler d1 execute DB --remote --command "PRAGMA table_info(Users);"
```

New databases must run only `schema.sql`; they must not run the legacy bridge.

Until the column exists, normal requests continue to treat every session as a
non-admin. Administrator-only actions remain unavailable rather than granting
access accidentally.

## Administrator bootstrap

There is deliberately no HTTP endpoint for granting administrator rights.
After the migration, an operator should first identify the exact Google subject
ID for the intended account:

```bash
npx wrangler d1 execute DB --remote --command "SELECT id, email, is_admin FROM Users ORDER BY created_at DESC;"
```

Copy the intended `id` from that output and substitute it as one quoted literal
in this command (do not use an email address):

```bash
npx wrangler d1 execute DB --remote --command "UPDATE Users SET is_admin = TRUE WHERE id = 'GOOGLE_SUBJECT_ID_FROM_PREVIOUS_COMMAND';"
```

Finally, verify only that account was changed:

```bash
npx wrangler d1 execute DB --remote --command "SELECT id, email, is_admin FROM Users WHERE id = 'GOOGLE_SUBJECT_ID_FROM_PREVIOUS_COMMAND';"
```
