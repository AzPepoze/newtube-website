import { asc, eq, inArray } from "drizzle-orm";
import type { Database } from "../index";
import { categories, tags, themeCategories, themeTags } from "../schema";

export function normalizeTagName(name: string) {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function tagSlug(name: string) {
    return normalizeTagName(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function listTags(db: Database) {
    return db.select().from(tags).orderBy(asc(tags.name)).all();
}

export async function listCategories(db: Database) {
    return db.select().from(categories).orderBy(asc(categories.name)).all();
}

export function getCategoryById(db: Database, id: string) {
    return db.select().from(categories).where(eq(categories.id, id)).get();
}

export async function createCategory(
    db: Database,
    data: { name: string; slug: string },
) {
    const id = crypto.randomUUID();
    await db
        .insert(categories)
        .values({ id, name: data.name.trim(), slug: data.slug })
        .onConflictDoNothing();

    return db
        .select()
        .from(categories)
        .where(eq(categories.slug, data.slug))
        .get();
}

export async function setThemeTagNames(
    db: Database,
    themeId: string,
    tagNames: string[],
) {
    const normalized = [
        ...new Set(tagNames.map(normalizeTagName).filter(Boolean)),
    ];
    const slugs = normalized.map(tagSlug).filter(Boolean);

    if (slugs.length > 0) {
        const existing = await db
            .select()
            .from(tags)
            .where(inArray(tags.slug, slugs))
            .all();
        const existingSlugs = new Set(existing.map((tag) => tag.slug));
        const missing = normalized
            .filter((name) => !existingSlugs.has(tagSlug(name)))
            .map((name) => ({
                id: crypto.randomUUID(),
                name,
                slug: tagSlug(name),
            }));

        if (missing.length > 0) {
            await db.insert(tags).values(missing).onConflictDoNothing();
        }
    }

    const selectedTags =
        slugs.length > 0
            ? await db
                  .select()
                  .from(tags)
                  .where(inArray(tags.slug, slugs))
                  .all()
            : [];

    await db.delete(themeTags).where(eq(themeTags.themeId, themeId));
    if (selectedTags.length > 0) {
        await db
            .insert(themeTags)
            .values(selectedTags.map((tag) => ({ themeId, tagId: tag.id })));
    }

    return selectedTags.sort((a, b) => a.name.localeCompare(b.name));
}

export async function setThemeCategory(
    db: Database,
    themeId: string,
    categoryId: string | null,
) {
    if (!categoryId) {
        await db
            .delete(themeCategories)
            .where(eq(themeCategories.themeId, themeId));
        return null;
    }

    await db
        .insert(themeCategories)
        .values({ themeId, categoryId })
        .onConflictDoUpdate({
            target: themeCategories.themeId,
            set: { categoryId },
        });

    return db
        .select()
        .from(categories)
        .where(eq(categories.id, categoryId))
        .get();
}

export async function getThemeClassification(db: Database, themeId: string) {
    const [themeTagRows, category] = await Promise.all([
        db
            .select({ id: tags.id, slug: tags.slug, name: tags.name })
            .from(themeTags)
            .innerJoin(tags, eq(themeTags.tagId, tags.id))
            .where(eq(themeTags.themeId, themeId))
            .orderBy(asc(tags.name))
            .all(),
        db
            .select({
                id: categories.id,
                slug: categories.slug,
                name: categories.name,
            })
            .from(themeCategories)
            .innerJoin(
                categories,
                eq(themeCategories.categoryId, categories.id),
            )
            .where(eq(themeCategories.themeId, themeId))
            .get(),
    ]);

    return { tags: themeTagRows, category: category ?? null };
}

export async function applyThemeClassification(
    db: Database,
    themeId: string,
    data: { tagNames?: string[]; categoryId?: string | null },
) {
    if (data.tagNames !== undefined) {
        await setThemeTagNames(db, themeId, data.tagNames);
    }
    if (data.categoryId !== undefined) {
        await setThemeCategory(db, themeId, data.categoryId);
    }
    return getThemeClassification(db, themeId);
}
