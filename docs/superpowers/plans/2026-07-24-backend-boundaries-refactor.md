# Backend Boundary and Consistency Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the backend's dependency direction and internal naming consistent without changing any endpoint behaviour.

**Architecture:** Preserve the current `api -> controllers -> services -> db` layout. Move theme image-storage orchestration from the database layer into the theme service, then perform a mechanical internal naming pass that makes controller contexts, operation inputs, identifier variables, and outcome variables explicit.

**Tech Stack:** TypeScript 5.9, Elysia, Cloudflare Workers/R2, Drizzle ORM, Bun.

## Global Constraints

- Preserve every HTTP route, method, middleware requirement, status code, response body, validation outcome, database schema, and side-effect order.
- Do not add or rewrite tests.
- Keep the current top-level `api/`, `controllers/`, `services/`, `db/`, `constants/`, `types/`, and `utils/` directories.
- `db/` must not import from `api/`, `controllers/`, `services/`, or Elysia.
- Controller context aliases end in `ControllerContext`; full entity identifier names use `themeId`, `userId`, `ownerId`, and `reportId`.
- Use `list*`, `get*`, `create*`, `update*`, `delete*`, `is*`, and `has*` names according to the operation they perform.
- Validate each task with `bun run check` from `backend/` and `git diff --check`; manually trace every changed endpoint from route to controller, service, and persistence/external-resource call.

---

## File Structure

| Path | Responsibility after the refactor |
| --- | --- |
| `backend/src/api/images.ts` | Registers image endpoints only; contains no image-service re-exports. |
| `backend/src/controllers/themes.ts` | Parses and validates theme HTTP input, then invokes theme services. |
| `backend/src/services/themes.ts` | Owns the theme mutation workflow: R2 uploads/deletes, DB writes, classification, and version snapshots. |
| `backend/src/services/images.ts` | Owns reusable R2 upload/delete operations and image-ownership workflow. |
| `backend/src/db/themes.ts` | Owns theme queries and Drizzle writes only; receives final image URLs and contains no `Env` or R2 dependency. |
| `backend/src/controllers/{auth,themes,images,users,sponsors,marketplace}.ts` | Uses consistently named controller-context aliases and local input/outcome variables. |
| `backend/src/controllers/marketplace/{admin,reports}.ts` | Uses consistently named marketplace request inputs and service outcomes. |
| `backend/src/services/**/*.ts`, `backend/src/db/**/*.ts` | Uses role-specific operation inputs and identifier variables without changing database columns or API fields. |

## Task 1: Move theme image orchestration to the service layer

**Files:**
- Modify: `backend/src/api/images.ts`
- Modify: `backend/src/controllers/themes.ts`
- Modify: `backend/src/services/themes.ts`
- Modify: `backend/src/db/themes.ts`

**Interfaces:**
- Consumes: `uploadImageToR2(env, fileData, mimeType)` and `deleteImageFromR2(env, imageUrl)` from `backend/src/services/images.ts`.
- Produces: `ThemeInput`, `ThemePersistenceInput`, `createThemeRecord`, `updateThemeRecordForOwner`, `deleteThemeRecordForOwner`, and `getThemeByOwner` as the explicit boundary between theme workflow and persistence.
- Preserves: `createThemeForOwner`, `updateThemeForOwner`, and `deleteThemeForOwner`, which remain the controller-facing service functions.

- [ ] **Step 1: Remove the API-layer image re-export**

  In `backend/src/api/images.ts`, leave only the route registration imports and
  `imageRoute` export. Delete the `services/images` import and this re-export:

  ```ts
  export { uploadImageToR2, deleteImageFromR2 };
  ```

  The resulting API module must import only Elysia, `imageController`,
  `authGuard`, and `contextPlugin`.

- [ ] **Step 2: Make the DB theme-write contract persistence-only**

  In `backend/src/db/themes.ts`, delete the import from `../api/images` and
  remove every `Env`, upload, image delete, classification, and version call.
  Introduce these exact inputs and operation names:

  ```ts
export type ThemePersistenceInput = {
      themeName: string;
      description?: string;
      images: string[];
      coverImage?: string;
      settings?: unknown;
    isPublic: boolean;
  };

  export function getThemeByOwner(
      db: Database,
      themeId: string,
      ownerId: string,
  ) {
      return db.query.themes.findFirst({
          where: and(eq(themes.themeId, themeId), eq(themes.ownerId, ownerId)),
      });
  }
  ```

  Replace the current workflow functions with DB-only functions named
  `createThemeRecord`, `updateThemeRecordForOwner`, and
  `deleteThemeRecordForOwner`.

  - `createThemeRecord(db, ownerId, input)` generates `themeId`, inserts
    `input.images` and the other persistence fields, and returns the inserted
    `{ themeId }` record exactly as the current `createTheme` does.
  - `updateThemeRecordForOwner(db, themeId, ownerId, input)` performs the
    current `db.update(themes)` statement, updates `updatedAt`, and returns
    `result.meta.changes > 0`.
  - `deleteThemeRecordForOwner(db, themeId, ownerId)` performs the current
    `db.delete(themes)` statement and returns `result.meta.changes > 0`.

  None of those functions may call R2, `applyThemeClassification`, or
  `createThemeVersion`.

- [ ] **Step 3: Put the complete mutation workflow in the theme service**

  In `backend/src/services/themes.ts`, rename `ThemePayload` to this exported
  controller-to-service contract and import R2 helpers directly from
  `./images`:

  ```ts
  export interface ThemeInput {
      themeName: string;
      description?: string;
      imgs?: string[];
      coverImage?: string;
      pendingImages?: Array<{ data: string; mimeType: string }>;
      pendingCoverImage?: { data: string; mimeType: string };
      settings?: unknown;
      tagNames?: string[];
      categoryId?: string | null;
      isPublic?: boolean;
  }
  ```

  Implement the existing create/update/delete sequences in
  `createThemeForOwner`, `updateThemeForOwner`, and `deleteThemeForOwner`:

  1. Upload each `pendingImages` entry in input order; log and continue on an
     upload failure just as the current code does.
  2. Upload a pending cover image; retain the supplied `coverImage` if it
     fails.
  3. For updates, load the owned theme with `getThemeByOwner` before any R2
     deletion. Return `false` if it is absent.
  4. Preserve the existing R2 deletion conditions and ordering: delete a
     replaced or explicitly emptied cover image only when its URL contains
     `https://pub-`; delete each old gallery image missing from the final image
     list before the DB update; delete all gallery images before the DB delete.
  5. Call the persistence function with final image URLs. Only after a
     successful create or update, call `applyThemeClassification` and
     `createThemeVersion` in that order.

  Build the persistence argument explicitly so no pending base64 fields enter
  the DB layer. Use the create default and update fallback separately so the
  current visibility behaviour is retained:

  ```ts
  const createPersistenceInput: ThemePersistenceInput = {
      themeName: themeInput.themeName,
      description: themeInput.description,
      images: finalImages,
      coverImage: finalCoverImage,
      settings: themeInput.settings ?? {},
      isPublic: themeInput.isPublic ?? true,
  };

  const updatePersistenceInput: ThemePersistenceInput = {
      themeName: themeInput.themeName,
      description: themeInput.description,
      images: finalImages,
      coverImage: finalCoverImage,
      settings: themeInput.settings ?? {},
      isPublic: themeInput.isPublic ?? existingTheme.isPublic ?? true,
  };
  ```

- [ ] **Step 4: Use the renamed theme input from the controller**

  In `backend/src/controllers/themes.ts`, import `ThemeInput` instead of
  `ThemePayload`, rename `validateThemePayload` to `validateThemeInput`, and
  rename its internal `data` variable to `themeInput`.

  Its result remains structurally identical, with only internal names changed:

  ```ts
  type ThemeInputValidation =
      | { input: ThemeInput; message?: never }
      | { input?: never; message: string };
  ```

  Update `create` and `update` to read `validation.input` and pass that value
  to their unchanged controller-facing service functions. Preserve every
  current error string and status assignment.

- [ ] **Step 5: Verify the boundary slice**

  Run from `backend/`: `bun run check`

  Expected: exit code 0 and `$ tsc --noEmit` output.

  Run from the repository root: `git diff --check`

  Expected: exit code 0 with no output.

  Inspect imports with:

  ```bash
  rg -n 'from "\.\./api|from "\.\./\.\./api' backend/src/db --glob '*.ts'
  ```

  Expected: no matches. Trace `POST /themes`, `PUT /themes/:id`, and
  `DELETE /themes/:id` to confirm their HTTP results and external-operation
  order are unchanged.

- [ ] **Step 6: Commit the boundary slice**

  ```bash
  git add backend/src/api/images.ts backend/src/controllers/themes.ts backend/src/services/themes.ts backend/src/db/themes.ts
  git commit -m "refactor: move theme image workflow to service"
  ```

## Task 2: Normalize controller context and request-local names

**Files:**
- Modify: `backend/src/controllers/auth.ts`
- Modify: `backend/src/controllers/themes.ts`
- Modify: `backend/src/controllers/images.ts`
- Modify: `backend/src/controllers/users.ts`
- Modify: `backend/src/controllers/sponsors.ts`
- Modify: `backend/src/controllers/marketplace.ts`
- Modify: `backend/src/controllers/marketplace/admin.ts`
- Modify: `backend/src/controllers/marketplace/reports.ts`

**Interfaces:**
- Consumes: the same Elysia context fields and controller service functions as before.
- Produces: consistent private controller aliases: `AuthControllerContext`,
  `ThemeControllerContext`, `ImageControllerContext`, `UserControllerContext`,
  `SponsorsControllerContext`, and `MarketplaceControllerContext`.
- Preserves: every controller export and method name used by route modules.

- [ ] **Step 1: Rename controller-context aliases without changing their shapes**

  Apply these exact type renames and update every handler annotation in the
  same file:

  ```text
  AuthContext                 -> AuthControllerContext
  ThemeContext                -> ThemeControllerContext
  UserContext                 -> UserControllerContext
  MarketplaceContext          -> MarketplaceControllerContext
  ```

  `ImageControllerContext` and `SponsorsControllerContext` already follow the
  convention and keep their current shapes. Update marketplace child imports
  and the `forbidden` parameter type to
  `MarketplaceControllerContext["set"]`.

- [ ] **Step 2: Name parsed request bodies and service outcomes by role**

  Replace generic variables only where the replacement makes the role explicit:

  ```text
  controllers/themes.ts
    payload              -> themeInputValidation
    data (theme body)    -> themeInput
    result (create)      -> createdTheme
    updated              -> wasUpdated
    deleted              -> wasDeleted
    result (review)      -> reviewOutcome

  controllers/images.ts
    result               -> deletionOutcome

  controllers/marketplace/admin.ts
    data                 -> categoryInput, reportResolutionInput, or visibilityInput
    result               -> categoryOutcome, reportsOutcome, reportResolutionOutcome,
                             or visibilityOutcome

  controllers/marketplace/reports.ts
    data                 -> reportInput
    result               -> reportOutcome

  controllers/sponsors.ts
    result               -> sponsorsOutcome
  ```

  Do not rename HTTP body fields (`url`, `reason`, `details`, `status`,
  `isPublic`) or response fields. They are API contracts.

- [ ] **Step 3: Keep the current validation and response branches byte-for-byte equivalent in meaning**

  For every renamed outcome, retain the existing discriminants and response
  mappings. For example, the review branch must still be:

  ```ts
  if (reviewOutcome.status === "not-found") {
      set.status = 404;
      return { error: "Theme not found" };
  }
  if (reviewOutcome.status === "own-theme") {
      set.status = 403;
      return { error: "Cannot review your own theme" };
  }
  return reviewOutcome.review;
  ```

- [ ] **Step 4: Verify controller consistency**

  Run from `backend/`: `bun run check`

  Expected: exit code 0 and `$ tsc --noEmit` output.

  Run from the repository root: `git diff --check`

  Expected: exit code 0 with no output.

  Trace the route registrations in `backend/src/api/` and confirm every
  referenced `*Controller` object and method retains its original export name.

- [ ] **Step 5: Commit the controller consistency slice**

  ```bash
  git add backend/src/controllers
  git commit -m "refactor: standardize controller naming"
  ```

## Task 3: Normalize service and DB operation inputs and identifiers

**Files:**
- Modify: `backend/src/services/auth.ts`
- Modify: `backend/src/services/images.ts`
- Modify: `backend/src/services/users.ts`
- Modify: `backend/src/services/sponsors.ts`
- Modify: `backend/src/services/marketplace/admin.ts`
- Modify: `backend/src/services/marketplace/reports.ts`
- Modify: `backend/src/db/users.ts`
- Modify: `backend/src/db/marketplace/moderation.ts`
- Modify: `backend/src/db/marketplace/reviews.ts`
- Modify: `backend/src/db/marketplace/theme-classification.ts`
- Modify: `backend/src/db/marketplace/theme-versions.ts`

**Interfaces:**
- Consumes: current function signatures and database columns.
- Produces: explicit internal input variable names while retaining the same exported function names and parameter ordering where callers depend on them.
- Preserves: all SQL/Drizzle operations, generated UUID values, return values, and cache/R2 side effects.

- [ ] **Step 1: Replace generic internal operation inputs with role-specific names**

  Keep API fields and SQL column names unchanged, but use these variable names
  inside the implementation and update their property references:

  ```text
  db/users.ts updateOrInsertUser:                  data -> userInput
  db/marketplace/moderation.ts createThemeReport:  data -> reportInput
  db/marketplace/moderation.ts resolveThemeReport: data -> resolutionInput
  db/marketplace/reviews.ts upsertThemeReview:     data -> reviewInput
  db/marketplace/theme-classification.ts createCategory: data -> categoryInput
  db/marketplace/theme-classification.ts applyThemeClassification: data -> classificationInput
  services/marketplace/admin.ts createCategoryForAdmin: data -> categoryInput
  services/marketplace/reports.ts createReportForUser: data -> reportInput
  ```

  Use the renamed identifier locally in every `.values`, `.set`, and `.where`
  expression. Do not change object keys supplied to Drizzle.

- [ ] **Step 2: Expand ambiguous identifier variables where they are function parameters**

  In `backend/src/db/users.ts`, rename the `getUserById` parameter from `id` to
  `userId`, including the `eq(users.id, userId)` comparison. In
  `backend/src/db/marketplace/theme-versions.ts`, rename the local generated
  report-free UUID `id` to `versionId`; use `versionId` for the insert and the
  retrieval query. In `backend/src/db/marketplace/moderation.ts`, rename the
  generated report UUID `id` to `reportId`.

  These are internal variable names only. The schema columns remain `id`, and
  returned objects retain their existing `id` fields.

- [ ] **Step 3: Make service outcome names explicit without changing output contracts**

  In `backend/src/services/marketplace/admin.ts`, rename local `result` values
  from `resolveThemeReport` and `setThemeVisibility` to
  `resolutionResult` and `visibilityResult`. In
  `backend/src/services/sponsors.ts`, rename the parsed GraphQL value from
  `result` to `graphqlResult` and leave the external sponsor response unchanged.

  Retain the exact outcome union values: `"forbidden"`, `"created"`,
  `"conflict"`, `"listed"`, `"not-found"`, `"resolved"`, `"updated"`,
  `"ok"`, and `"failed"`.

- [ ] **Step 4: Verify persistence and side effects remained unchanged**

  Run from `backend/`: `bun run check`

  Expected: exit code 0 and `$ tsc --noEmit` output.

  Run from the repository root: `git diff --check`

  Expected: exit code 0 with no output.

  Review each changed Drizzle chain and confirm its table, values, where
  predicates, conflict handling, and return form are unchanged. Review the R2
  and GitHub cache calls in `services/images.ts` and `services/sponsors.ts` to
  confirm that only variable identifiers changed.

- [ ] **Step 5: Commit the service and DB consistency slice**

  ```bash
  git add backend/src/services backend/src/db/users.ts backend/src/db/marketplace
  git commit -m "refactor: clarify backend operation names"
  ```

## Task 4: Perform the final boundary audit and static validation

**Files:**
- Modify only if an audit finding violates the accepted design: `backend/src/api/**/*.ts`, `backend/src/controllers/**/*.ts`, `backend/src/services/**/*.ts`, or `backend/src/db/**/*.ts`
- Modify: `docs/superpowers/specs/2026-07-24-backend-boundaries-design.md` only if the implementation revealed an accepted-design correction; otherwise leave it unchanged.

**Interfaces:**
- Consumes: the completed boundary and naming changes from Tasks 1-3.
- Produces: a verified one-way import graph and a clean static-check result.
- Preserves: all published endpoint and database contracts.

- [ ] **Step 1: Audit prohibited upward dependencies**

  Run these commands from the repository root:

  ```bash
  rg -n 'from "\.\./api|from "\.\./\.\./api' backend/src/db --glob '*.ts'
  rg -n 'from "\.\./controllers|from "\.\./\.\./controllers' backend/src/{services,db} --glob '*.ts'
  rg -n 'from "\.\./services|from "\.\./\.\./services' backend/src/db --glob '*.ts'
  ```

  Expected: no matches. If a match appears, move the behavior to the lower
  layer that owns it; do not add an adapter re-export.

- [ ] **Step 2: Audit names at module boundaries**

  Inspect all exported controller contexts, service inputs, DB operation
  inputs, and route/controller pairs. Confirm controller aliases end in
  `ControllerContext`, exported route/controller names share a feature stem,
  and any remaining generic `data` or `result` name is strictly local to a
  short expression whose role is self-evident. Do not rename schema fields,
  HTTP fields, or public response fields.

- [ ] **Step 3: Run final static checks**

  Run from `backend/`: `bun run check`

  Expected: exit code 0 and `$ tsc --noEmit` output.

  Run from the repository root: `git diff --check`

  Expected: exit code 0 with no output.

  Run `git status --short` and inspect the final diff. Confirm only the planned
  backend files and any intentional spec correction changed.

- [ ] **Step 4: Commit any audit correction**

  If Task 4 changed files, commit only those corrections:

  ```bash
  git add backend/src docs/superpowers/specs/2026-07-24-backend-boundaries-design.md
  git commit -m "refactor: verify backend layer boundaries"
  ```

  If the audit made no code or documentation changes, make no commit.
