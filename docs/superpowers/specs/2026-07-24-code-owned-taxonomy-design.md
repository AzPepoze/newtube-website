# Code-Owned Theme Taxonomy

## Goal

Make `THEME_TAGS` and `THEME_CATEGORIES` the sole source of truth for theme taxonomy. The database mirrors those constants so taxonomy relations remain queryable, but neither administrators nor theme authors can create taxonomy values at runtime.

## Synchronization

`syncThemeTaxonomy(db)` reconciles the database with the current constants whenever taxonomy is read or a theme classification is written:

1. Upsert every tag and category declared in the constants.
2. Delete tag records whose IDs are no longer declared. Foreign-key cascade removes their `ThemeTags` links.
3. Delete `ThemeCategories` links for categories whose IDs are no longer declared, then delete those category records. Affected themes therefore become uncategorized.

The operation is idempotent: calling it without a constants change leaves the database unchanged.

## API and UI

- `GET /tags` and `GET /categories` synchronize first, then return the database rows.
- Saving a theme synchronizes first, then accepts only tag names and category IDs represented by the constants.
- The editor presents existing taxonomy values only; it does not create arbitrary tags.
- The admin category-creation form and `POST /admin/categories` endpoint are removed.

## Error Handling

- A category ID or tag name absent from the constants is rejected with a validation error.
- If reconciliation cannot complete, the request fails rather than returning stale taxonomy or writing an invalid classification.

## Verification

Regression tests will prove that reconciliation inserts newly declared constants, removes a deleted tag and its theme links, and unlinks themes before deleting a removed category. Existing backend and frontend type checks will also run.
