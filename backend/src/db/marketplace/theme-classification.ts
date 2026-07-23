import { asc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { THEME_CATEGORIES, THEME_TAGS } from "../../constants/marketplace";
import { normalizeTagName, tagSlug } from "../../utils/marketplace";
import type { Database } from "../index";
import { categories, tags, themeCategories, themeTags } from "../schema";

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

    if (tagIds.length) {
        await db
            .insert(tags)
            .values([...THEME_TAGS])
            .onConflictDoUpdate({
                target: tags.id,
                set: { slug: sql`excluded.slug`, name: sql`excluded.name` },
            });
    }
    if (categoryIds.length) {
        await db
            .insert(categories)
            .values([...THEME_CATEGORIES])
            .onConflictDoUpdate({
                target: categories.id,
                set: { slug: sql`excluded.slug`, name: sql`excluded.name` },
            });
    }
}

export async function listTags(db: Database) {
    await syncThemeTagsAndCategories(db);
    return db.select().from(tags).orderBy(asc(tags.name)).all();
}

export async function listCategories(db: Database) {
    await syncThemeTagsAndCategories(db);
    return db.select().from(categories).orderBy(asc(categories.name)).all();
}

export function getCategoryById(db: Database, id: string) {
    return db.select().from(categories).where(eq(categories.id, id)).get();
}

export async function ensureCategoryById(db: Database, id: string) {
    await syncThemeTagsAndCategories(db);
    const existing = await getCategoryById(db, id);
    if (existing) return existing;

    const category = THEME_CATEGORIES.find((item) => item.id === id);
    if (!category) return undefined;

    await db.insert(categories).values(category).onConflictDoNothing();
    return getCategoryById(db, id);
}

export async function createCategory(
    db: Database,
    categoryInput: { name: string; slug: string },
) {
    const id = crypto.randomUUID();
    await db
        .insert(categories)
        .values({
            id,
            name: categoryInput.name.trim(),
            slug: categoryInput.slug,
        })
        .onConflictDoNothing();

    return db
        .select()
        .from(categories)
        .where(eq(categories.slug, categoryInput.slug))
        .get();
}

export async function setThemeTagNames(
    db: Database,
    themeId: string,
    tagNames: string[],
) {
    await syncThemeTagsAndCategories(db);
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
    await syncThemeTagsAndCategories(db);
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

    return ensureCategoryById(db, categoryId);
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
    classificationInput: { tagNames?: string[]; categoryId?: string | null },
) {
    if (classificationInput.tagNames !== undefined) {
        await setThemeTagNames(db, themeId, classificationInput.tagNames);
    }
    if (classificationInput.categoryId !== undefined) {
        await setThemeCategory(db, themeId, classificationInput.categoryId);
    }
    return getThemeClassification(db, themeId);
}
