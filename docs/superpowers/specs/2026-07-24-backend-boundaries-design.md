# Backend Boundary and Consistency Refactor

## Goal

Strengthen the backend's existing route, controller, service, and database
boundaries while making internal names and types consistent. The refactor must
preserve all externally observable behaviour.

## Scope

- Preserve every HTTP route, method, middleware requirement, status code,
  response body, validation outcome, database schema, and side-effect order.
- Do not add regression tests. Validate with the existing backend TypeScript
  check, whitespace validation, and manual endpoint dependency tracing.
- Retain the existing top-level layout: `api/`, `controllers/`, `services/`,
  `db/`, `constants/`, `types/`, and `utils/`.
- Retain marketplace submodules where they already represent a cohesive domain.

## Architecture

Dependencies flow in one direction:

```text
api -> controllers -> services -> db
                      |
                      +-> external resources, such as R2
```

- `api/` owns Elysia route registration and route-level middleware only.
- `controllers/` own HTTP adaptation: request parsing, validation, invoking a
  service, and mapping results to the existing HTTP response.
- `services/` own authorization decisions and workflows that combine database
  access with external resources.
- `db/` owns Drizzle queries, schema/table mapping, and focused data-access
  helpers. It must not import from `api/`, `controllers/`, `services/`, or the
  web framework.

The current `db/themes.ts` dependency on R2 helpers re-exported from
`api/images.ts` violates this direction. The refactor will make the theme
service own the image-storage workflow and import those helpers directly from
`services/images.ts`; the theme DB module will operate on final persistence
data only.

## Naming and Types

- Pair route and controller exports with the same feature stem, such as
  `themeRoute` / `themeController` and `marketplaceAdminRoute` /
  `marketplaceAdminController`.
- Name controller-context aliases `*ControllerContext` consistently.
- Name request/workflow inputs by use case, such as `CreateThemeInput` and
  `UpdateThemeInput` when their requirements diverge; avoid generic exported
  names such as `Payload`.
- Use full entity identifiers: `themeId`, `userId`, `ownerId`, and `reportId`.
- Use `list*` for collection reads, `get*` for reads, `create*`, `update*`, and
  `delete*` for mutations, and `is*` or `has*` for boolean predicates.
- Keep a type private to a feature until another feature needs it. Put only
  cross-feature contracts in `src/types/`, using role-specific names.
- Remove layer-confusing compatibility aliases and re-exports after their
  callers use the owning module directly.

## Refactor Sequence

1. Inventory every registered endpoint and trace its route, controller,
   service, and persistence/external-resource dependencies.
2. Correct layer violations, beginning with theme image storage, one cohesive
   use case at a time.
3. Apply the naming and type policy only within affected boundaries; do not
   reorganize unrelated cohesive code or make file moves solely for size.
4. After each slice, trace its affected endpoints end-to-end and run the
   backend TypeScript check.
5. Finish with a repository-wide import and naming review, then run the static
   checks again.

## Validation

- Run `bun run check` in `backend/`.
- Run `git diff --check`.
- Manually verify route registration, controller status mapping, service
  workflow, and DB/external-resource dependencies for every changed endpoint.

## Non-goals

- No public API redesign.
- No database migration or schema changes.
- No test additions or rewrites.
- No feature-first folder reorganization or repository-interface abstraction.
