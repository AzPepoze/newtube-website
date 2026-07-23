import { asc, eq, inArray, notInArray, sql } from "drizzle-orm";
import { THEME_TAGS } from "../../constants/marketplace";
import { normalizeTagName, tagSlug } from "../../utils/marketplace";
import type { Database } from "../index";
import { tags, themeTags } from "../schema";

export async function syncThemeTagsAndCategories(db: Database) {
    const tagIds = THEME_TAGS.map((tag) => tag.id);

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
                set: {
                    slug: sql`excluded.slug`,
                    name: sql`excluded.name`,
                    groupName: sql`excluded.group_name`,
                },
            });
    }
}

export async function listTags(db: Database) {
    await syncThemeTagsAndCategories(db);
    return db.select().from(tags).orderBy(asc(tags.name)).all();
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

export async function getThemeClassification(db: Database, themeId: string) {
    const themeTagRows = await db
        .select({
            id: tags.id,
            slug: tags.slug,
            name: tags.name,
            groupName: tags.groupName,
        })
        .from(themeTags)
        .innerJoin(tags, eq(themeTags.tagId, tags.id))
        .where(eq(themeTags.themeId, themeId))
        .orderBy(asc(tags.name))
        .all();

    return { tags: themeTagRows };
}

export async function applyThemeClassification(
    db: Database,
    themeId: string,
    classificationInput: { tagNames?: string[] },
) {
    if (classificationInput.tagNames !== undefined) {
        await setThemeTagNames(db, themeId, classificationInput.tagNames);
    }
    return getThemeClassification(db, themeId);
}
