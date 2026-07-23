# Backend database operations

`src/db/schema.ts` is the schema source of truth. Drizzle generates versioned
SQL files in `drizzle/`; Wrangler applies those files and records their state
in D1's `d1_migrations` table.

## Create and apply migrations

```bash
# Generate a migration after changing src/db/schema.ts.
bun run db:generate

# Apply unapplied migrations to the local D1 database before development.
bun run db:migrate:local

# Apply unapplied migrations to production before deployment.
bun run db:migrate:remote
```

`dev`, `start`, and `deploy` run the appropriate apply command
automatically. Never edit an already-applied migration; create a new one.

## Clean-slate production setup

After resetting an empty production D1 database, apply the initial migration:

```bash
bun run db:migrate:remote
npx wrangler d1 migrations list DB --remote
```

The migration creates the application schema and starter theme classifications.
destructive only when paired with a database reset, so never reset production
after it contains data.

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
