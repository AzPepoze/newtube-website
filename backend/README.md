# Backend database operations

## Marketplace migration for an existing D1 database

The backend has a schema-aware migration command. It inspects `Users`, adds
the legacy `is_admin` column only when it is missing, then runs the rerunnable
bootstrap schema for tables and indexes.

Run this before local development:

```bash
bun run db:migrate:local
```

Production deployment runs the remote migration automatically before the
Worker deploy. It can also be run on its own:

```bash
bun run db:migrate:remote
```

The command is safe to rerun. It does not grant administrator access.

## Manual verification

From `backend/`, first inspect the remote database:

```bash
npx wrangler d1 execute DB --remote --command "PRAGMA table_info(Users);"
```

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
