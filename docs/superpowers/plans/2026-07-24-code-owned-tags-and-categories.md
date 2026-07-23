# Code-Owned Tags and Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep theme tags and categories synchronized from `THEME_TAGS` and `THEME_CATEGORIES`, and remove all runtime creation of those values.

**Architecture:** The database remains the queryable store for theme-to-tag and theme-to-category relations. A single database function reconciles it with the code constants before every read or classification write. Category links are removed before stale categories; stale tag links are removed by the existing cascade foreign key.

**Tech Stack:** Bun, TypeScript, Elysia, Cloudflare D1, Drizzle ORM, Vitest Workers, Svelte 5.

## Global Constraints

- `THEME_TAGS` and `THEME_CATEGORIES` are the only source of tag/category definitions.
- Removing a category constant leaves affected themes without a category.
- Removing a tag constant removes its associated theme-tag links.
- Users and administrators cannot create, edit, or delete tags/categories at runtime.
- Replace `taxonomy` with explicit tags-and-categories naming in code, CSS classes, messages, and filenames if any contain the term.

---

## File Structure

- `backend/src/db/marketplace/theme-classification.ts`: reconciliation, lookup, and theme relations.
- `backend/src/db/marketplace/theme-classification.test.ts`: real-D1 synchronization regression tests.
- `backend/src/services/marketplace.ts` and `backend/src/controllers/marketplace.ts`: database-backed list API.
- `backend/src/controllers/themes.ts`: reject tags absent from the constants.
- `backend/src/api/marketplace/admin.ts`, `backend/src/controllers/marketplace/admin.ts`, and `backend/src/services/marketplace/admin.ts`: remove category creation.
- `frontend/src/lib/components/editor/ThemeEditorBasicInfo.svelte`, `frontend/src/routes/discover/+page.svelte`, and `frontend/src/routes/admin/+page.svelte`: predefined selectors, terminology, and admin UI cleanup.

### Task 1: Add database reconciliation with regression tests

**Files:**

- Create: `backend/src/db/marketplace/theme-classification.test.ts`
- Modify: `backend/src/db/marketplace/theme-classification.ts`
- Modify: `backend/src/db/marketplace.ts`

**Interfaces:**

- Produces: `syncThemeTagsAndCategories(db: Database): Promise<void>`.

- [ ] **Step 1: Write the failing real-D1 tests**

```ts
import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import { createDb } from "../index";
import { categories, tags, themeCategories, themeTags } from "../schema";
import { syncThemeTagsAndCategories } from "./theme-classification";

const db = createDb(env.DB);

describe("syncThemeTagsAndCategories", () => {
    beforeEach(() =>
        env.DB.exec(
            "DELETE FROM ThemeTags; DELETE FROM ThemeCategories; DELETE FROM Themes; DELETE FROM Tags; DELETE FROM Categories; DELETE FROM Users;",
        ),
    );

    it("inserts all code-defined tags and categories", async () => {
        await syncThemeTagsAndCategories(db);
        expect(await db.select().from(tags).all()).toHaveLength(12);
        expect(await db.select().from(categories).all()).toHaveLength(8);
    });

    it("unlinks themes before deleting an undefined category", async () => {
        await env.DB.exec(
            "INSERT INTO Categories (id, slug, name) VALUES ('removed-category', 'removed', 'Removed');" +
                "INSERT INTO Users (id, email, name) VALUES ('owner-1', 'owner-1@example.test', 'Owner');" +
                "INSERT INTO Themes (theme_id, owner_id, theme_name, settings, is_public) VALUES ('theme-1', 'owner-1', 'Theme', '{}', 1);" +
                "INSERT INTO ThemeCategories (theme_id, category_id) VALUES ('theme-1', 'removed-category');",
        );
        await syncThemeTagsAndCategories(db);
        expect(await db.select().from(themeCategories).all()).toEqual([]);
        expect(await db.select().from(categories).all()).toHaveLength(8);
    });

    it("deletes an undefined tag and cascades its theme links", async () => {
        await env.DB.exec(
            "INSERT INTO Tags (id, slug, name) VALUES ('removed-tag', 'removed', 'Removed');" +
                "INSERT INTO Users (id, email, name) VALUES ('owner-2', 'owner-2@example.test', 'Owner');" +
                "INSERT INTO Themes (theme_id, owner_id, theme_name, settings, is_public) VALUES ('theme-2', 'owner-2', 'Theme', '{}', 1);" +
                "INSERT INTO ThemeTags (theme_id, tag_id) VALUES ('theme-2', 'removed-tag');",
        );
        await syncThemeTagsAndCategories(db);
        expect(await db.select().from(themeTags).all()).toEqual([]);
        expect(await db.select().from(tags).all()).toHaveLength(12);
    });
});
```

- [ ] **Step 2: Verify the test is red**

Run: `bun run --filter backend test src/db/marketplace/theme-classification.test.ts`

Expected: FAIL because `syncThemeTagsAndCategories` is not exported.

- [ ] **Step 3: Implement synchronization and code-defined tag lookup**

In `theme-classification.ts`, import `notInArray`, `sql`, `THEME_TAGS`, and `normalizeTagName`. Delete stale `ThemeCategories` links before stale categories; delete stale tags directly so their links cascade; then upsert every declared row by ID. Handle empty constants with unconditional deletes.

```ts
export async function syncThemeTagsAndCategories(db: Database) {
    const tagIds = THEME_TAGS.map((tag) => tag.id);
    const categoryIds = THEME_CATEGORIES.map((category) => category.id);

    if (categoryIds.length) {
        await db
            .delete(themeCategories)
            .where(notInArray(themeCategories.categoryId, categoryIds));
        await db
            .delete(categories)
            .where(notInArray(categories.id, categoryIds));
    } else {
        await db.delete(themeCategories);
        await db.delete(categories);
    }
    if (tagIds.length) {
        await db.delete(tags).where(notInArray(tags.id, tagIds));
    } else {
        await db.delete(tags);
    }

    await db
        .insert(tags)
        .values(THEME_TAGS)
        .onConflictDoUpdate({
            target: tags.id,
            set: { slug: sql`excluded.slug`, name: sql`excluded.name` },
        });
    await db
        .insert(categories)
        .values(THEME_CATEGORIES)
        .onConflictDoUpdate({
            target: categories.id,
            set: { slug: sql`excluded.slug`, name: sql`excluded.name` },
        });
}
```

Call this function before `listTags`, `listCategories`, `ensureCategoryById`, `setThemeTagNames`, and `setThemeCategory`. Leave tag validation, dynamic-tag removal, and removal of `createCategory` to Task 2 so Task 1 remains buildable on its own.

- [ ] **Step 4: Verify green**

Run: `bun run --filter backend test src/db/marketplace/theme-classification.test.ts`

Expected: PASS with three tests.

- [ ] **Step 5: Commit**

```bash
git add backend/src/db/marketplace/theme-classification.ts backend/src/db/marketplace/theme-classification.test.ts backend/src/db/marketplace.ts
git commit -m "feat: sync code-defined tags and categories"
```

### Task 2: Serve and validate only code-defined values

**Files:**

- Modify: `backend/src/services/marketplace.ts`
- Modify: `backend/src/controllers/marketplace.ts`
- Modify: `backend/src/controllers/themes.ts`
- Modify: `backend/src/api/marketplace/admin.ts`
- Modify: `backend/src/controllers/marketplace/admin.ts`
- Modify: `backend/src/services/marketplace/admin.ts`

**Interfaces:**

- Consumes: `listTags(db)`, `listCategories(db)`, and `ensureCategoryById(db, categoryId)` from Task 1.
- Produces: database-backed `GET /tags` and `GET /categories`; a `400` response for a tag not defined in code.

- [ ] **Step 1: Add the failing lookup test**

```ts
it("does not create a submitted tag absent from THEME_TAGS", async () => {
    await syncThemeTagsAndCategories(db);
    await env.DB.exec(
        "INSERT INTO Users (id, email, name) VALUES ('owner-3', 'owner-3@example.test', 'Owner');" +
            "INSERT INTO Themes (theme_id, owner_id, theme_name, settings, is_public) VALUES ('theme-3', 'owner-3', 'Theme', '{}', 1);",
    );
    await setThemeTagNames(db, "theme-3", ["not-defined-in-code"]);
    expect(await db.select().from(tags).all()).toHaveLength(12);
    expect(await db.select().from(themeTags).all()).toEqual([]);
});
```

- [ ] **Step 2: Verify red**

Run: `bun run --filter backend test src/db/marketplace/theme-classification.test.ts`

Expected: FAIL because `setThemeTagNames` currently inserts the submitted tag.

- [ ] **Step 3: Implement the API and validation change**

Make `listThemeTags(db)` and `listThemeCategories(db)` call the database functions. Make controller handlers accept `{ db }` and pass it to those services.

In `theme-classification.ts`, add `findThemeTagsByNames(db, tagNames)`, which normalizes names to slugs and selects only matching rows after synchronization. Make `setThemeTagNames` use it instead of inserting missing values. In `validateThemeInput`, after tag-shape validation, resolve the submitted values through `findThemeTagsByNames`. If the result count differs from the normalized unique input count, return `{ message: "Tags must be selected from the available tags" }`. Keep category validation through synchronized `ensureCategoryById`.

Remove `.post("/admin/categories", ...)`, `marketplaceAdminController.createCategory`, and `createCategoryForAdmin`; remove their now-unused validation and slug imports. Do not alter report moderation or visibility endpoints.

- [ ] **Step 4: Verify**

Run: `bun run --filter backend test`

Expected: PASS.

Run: `bun run --filter backend check`

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/marketplace.ts backend/src/controllers/marketplace.ts backend/src/controllers/themes.ts backend/src/api/marketplace/admin.ts backend/src/controllers/marketplace/admin.ts backend/src/services/marketplace/admin.ts backend/src/db/marketplace/theme-classification.test.ts
git commit -m "feat: restrict tags and categories to code"
```

### Task 3: Remove creation UI and use explicit names

**Files:**

- Modify: `frontend/src/lib/components/editor/ThemeEditorBasicInfo.svelte`
- Modify: `frontend/src/routes/discover/+page.svelte`
- Modify: `frontend/src/routes/admin/+page.svelte`

**Interfaces:**

- Consumes: the database-backed `GET /tags` and `GET /categories` APIs.
- Produces: predefined-only tag/category selection, no admin creation UI, and no frontend `taxonomy` identifiers.

- [ ] **Step 1: Replace free-text tag entry with predefined selection**

```svelte
<select id="theme-tags" bind:value={tagInput}>
    <option value="">Select a tag</option>
    {#each availableTags as tag (tag.id)}
        <option
            value={tag.name}
            disabled={tagNames.includes(normalizeTag(tag.name))}
        >
            {tag.name}
        </option>
    {/each}
</select>
<button
    type="button"
    onclick={addTag}
    disabled={!tagInput || tagNames.length >= 10}
>
    Add
</button>
```

Rename `loadTaxonomy` to `loadTagsAndCategories`, `taxonomyError` to `tagsAndCategoriesError`, and CSS classes `.taxonomy`, `.taxonomy-heading`, and `.taxonomy-error` to explicit `.tags-and-categories*` equivalents. Rewrite the loading error as `Tags and categories could not be loaded. Please try again.`

- [ ] **Step 2: Rename discovery variables without changing filtering behavior**

Rename `taxonomyTags` to `availableTags`, `taxonomyCategories` to `availableCategories`, and `loadTaxonomy` to `loadTagsAndCategories`. Keep URL parameters, fallbacks, and local legacy-response filtering unchanged.

- [ ] **Step 3: Remove admin category creation**

Delete admin-page category state, `slugify`, `createCategory`, the entire category panel markup, and category-panel CSS. Keep the moderation queue unchanged.

- [ ] **Step 4: Verify naming and frontend checks**

Run: `rg -n -i "taxonomy|createCategory|admin/categories" backend/src frontend/src`

Expected: no matches.

Run: `bun run --filter frontend check`

Expected: exit code 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/components/editor/ThemeEditorBasicInfo.svelte frontend/src/routes/discover/+page.svelte frontend/src/routes/admin/+page.svelte
git commit -m "refactor: use explicit tags and categories names"
```

### Task 4: Final verification

**Files:**

- Verify only.

- [ ] **Step 1: Run complete relevant verification**

Run: `bun run --filter backend test`

Expected: PASS.

Run: `bun run --filter backend check`

Expected: exit code 0.

Run: `bun run --filter frontend check`

Expected: exit code 0.

- [ ] **Step 2: Check the final repository state**

Run: `git diff --check HEAD~3..HEAD`

Expected: no whitespace errors.

Run: `git status --short`

Expected: no uncommitted changes.
