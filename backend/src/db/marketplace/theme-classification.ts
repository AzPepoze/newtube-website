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
    return getCategoryById(db, id);
}

export async function findThemeTagsByNames(db: Database, tagNames: string[]) {
    await syncThemeTagsAndCategories(db);
    const slugs = [
        ...new Set(tagNames.map(normalizeTagName).map(tagSlug).filter(Boolean)),
    ];
    return slugs.length
        ? db.select().from(tags).where(inArray(tags.slug, slugs)).all()
        : [];
}

export async function setThemeTagNames(
    db: Database,
    themeId: string,
    tagNames: string[],
) {
    const selectedTags = await findThemeTagsByNames(db, tagNames);

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
