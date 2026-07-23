import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "./index";
import {
    categories,
    collectionItems,
    collections,
    reviews,
    tags,
    themeCategories,
    themeReports,
    themeTags,
    themes,
    themeVersions,
    users,
    type CategorySnapshot,
    type TagSnapshot,
} from "./schema";

export type ReportStatus = "open" | "resolved" | "dismissed";

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

export async function createThemeVersion(db: Database, themeId: string) {
    const theme = await db
        .select()
        .from(themes)
        .where(eq(themes.themeId, themeId))
        .get();
    if (!theme) return null;

    const [classification, latestVersion] = await Promise.all([
        getThemeClassification(db, themeId),
        db
            .select({
                latest: sql<number | null>`MAX(${themeVersions.versionNumber})`,
            })
            .from(themeVersions)
            .where(eq(themeVersions.themeId, themeId))
            .get(),
    ]);

    const versionNumber = Number(latestVersion?.latest ?? 0) + 1;
    const id = crypto.randomUUID();
    await db.insert(themeVersions).values({
        id,
        themeId,
        versionNumber,
        themeName: theme.themeName,
        description: theme.description,
        images: theme.images ?? [],
        coverImage: theme.coverImage,
        settings: theme.settings ?? {},
        isPublic: theme.isPublic ?? true,
        tags: classification.tags satisfies TagSnapshot[],
        category: classification.category satisfies CategorySnapshot | null,
    });

    return db
        .select()
        .from(themeVersions)
        .where(eq(themeVersions.id, id))
        .get();
}

export function listThemeVersions(
    db: Database,
    themeId: string,
    { includeDrafts = false }: { includeDrafts?: boolean } = {},
) {
    const query = db
        .select()
        .from(themeVersions)
        .where(
            includeDrafts
                ? eq(themeVersions.themeId, themeId)
                : and(
                      eq(themeVersions.themeId, themeId),
                      eq(themeVersions.isPublic, true),
                  ),
        )
        .orderBy(desc(themeVersions.versionNumber));
    return query.all();
}

export function getThemeVersion(
    db: Database,
    themeId: string,
    versionNumber: number,
    { includeDrafts = false }: { includeDrafts?: boolean } = {},
) {
    return db
        .select()
        .from(themeVersions)
        .where(
            and(
                eq(themeVersions.themeId, themeId),
                eq(themeVersions.versionNumber, versionNumber),
                ...(includeDrafts ? [] : [eq(themeVersions.isPublic, true)]),
            ),
        )
        .get();
}

export async function upsertThemeReview(
    db: Database,
    data: { themeId: string; userId: string; rating: number; body?: string },
) {
    const id = crypto.randomUUID();
    await db
        .insert(reviews)
        .values({
            id,
            themeId: data.themeId,
            userId: data.userId,
            rating: data.rating,
            body: data.body,
        })
        .onConflictDoUpdate({
            target: [reviews.themeId, reviews.userId],
            set: {
                rating: data.rating,
                body: data.body,
                updatedAt: sql`CURRENT_TIMESTAMP`,
            },
        });

    return db
        .select()
        .from(reviews)
        .where(
            and(
                eq(reviews.themeId, data.themeId),
                eq(reviews.userId, data.userId),
            ),
        )
        .get();
}

export function deleteThemeReview(
    db: Database,
    themeId: string,
    userId: string,
) {
    return db
        .delete(reviews)
        .where(and(eq(reviews.themeId, themeId), eq(reviews.userId, userId)))
        .run();
}

export function getThemeReviewSummary(db: Database, themeId: string) {
    return db
        .select({
            count: sql<number>`COUNT(*)`,
            averageRating: sql<number | null>`AVG(${reviews.rating})`,
        })
        .from(reviews)
        .where(eq(reviews.themeId, themeId))
        .get();
}

export function listThemeReviews(
    db: Database,
    themeId: string,
    { limit = 20, offset = 0 }: { limit?: number; offset?: number } = {},
) {
    return db
        .select({
            id: reviews.id,
            themeId: reviews.themeId,
            userId: reviews.userId,
            rating: reviews.rating,
            body: reviews.body,
            createdAt: reviews.createdAt,
            updatedAt: reviews.updatedAt,
            user: {
                id: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl,
            },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.userId, users.id))
        .where(eq(reviews.themeId, themeId))
        .orderBy(desc(reviews.createdAt))
        .limit(limit)
        .offset(offset)
        .all();
}

export function getUserReviewActivity(
    db: Database,
    userId: string,
    { includePrivateThemes = false }: { includePrivateThemes?: boolean } = {},
) {
    return db
        .select({
            id: reviews.id,
            rating: reviews.rating,
            body: reviews.body,
            createdAt: reviews.createdAt,
            updatedAt: reviews.updatedAt,
            theme: {
                themeId: themes.themeId,
                themeName: themes.themeName,
                coverImage: themes.coverImage,
            },
        })
        .from(reviews)
        .innerJoin(themes, eq(reviews.themeId, themes.themeId))
        .where(
            includePrivateThemes
                ? eq(reviews.userId, userId)
                : and(eq(reviews.userId, userId), eq(themes.isPublic, true)),
        )
        .orderBy(desc(reviews.updatedAt))
        .all();
}

export async function createThemeReport(
    db: Database,
    data: {
        themeId: string;
        reporterId: string;
        reason: string;
        details?: string;
    },
) {
    const id = crypto.randomUUID();
    await db.insert(themeReports).values({ id, ...data });
    return db.select().from(themeReports).where(eq(themeReports.id, id)).get();
}

export function getReportsForReporter(db: Database, reporterId: string) {
    return db
        .select()
        .from(themeReports)
        .where(eq(themeReports.reporterId, reporterId))
        .orderBy(desc(themeReports.createdAt))
        .all();
}

export function listModerationReports(
    db: Database,
    {
        status,
        limit = 50,
        offset = 0,
    }: { status?: ReportStatus; limit?: number; offset?: number } = {},
) {
    const query = db
        .select({
            id: themeReports.id,
            reason: themeReports.reason,
            details: themeReports.details,
            status: themeReports.status,
            createdAt: themeReports.createdAt,
            updatedAt: themeReports.updatedAt,
            resolvedAt: themeReports.resolvedAt,
            theme: {
                themeId: themes.themeId,
                themeName: themes.themeName,
                isPublic: themes.isPublic,
            },
            reporter: {
                id: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl,
            },
        })
        .from(themeReports)
        .innerJoin(themes, eq(themeReports.themeId, themes.themeId))
        .innerJoin(users, eq(themeReports.reporterId, users.id));

    return (status ? query.where(eq(themeReports.status, status)) : query)
        .orderBy(desc(themeReports.createdAt))
        .limit(limit)
        .offset(offset)
        .all();
}

export function resolveThemeReport(
    db: Database,
    data: {
        reportId: string;
        adminId: string;
        status: Exclude<ReportStatus, "open">;
    },
) {
    return db
        .update(themeReports)
        .set({
            status: data.status,
            resolvedBy: data.adminId,
            resolvedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(themeReports.id, data.reportId))
        .run();
}

export function isUserAdmin(db: Database, userId: string) {
    return db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.id, userId))
        .get()
        .then((user) => user?.isAdmin === true)
        .catch((error) => {
            const message =
                error instanceof Error ? error.message : String(error);
            if (/no such column/i.test(message) && /is_admin/i.test(message)) {
                console.warn(
                    "Users.is_admin is unavailable; treating the session as non-admin until the legacy D1 migration is applied.",
                );
                return false;
            }
            throw error;
        });
}

export function setUserAdmin(db: Database, userId: string, isAdmin: boolean) {
    return db.update(users).set({ isAdmin }).where(eq(users.id, userId)).run();
}

export function setThemeVisibility(
    db: Database,
    themeId: string,
    isPublic: boolean,
) {
    return db
        .update(themes)
        .set({ isPublic, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(themes.themeId, themeId))
        .run();
}

export async function createCollection(
    db: Database,
    data: { userId: string; name: string; description?: string },
) {
    const id = crypto.randomUUID();
    await db.insert(collections).values({ id, ...data });
    return db.select().from(collections).where(eq(collections.id, id)).get();
}

export function listCollectionsByUser(db: Database, userId: string) {
    return db
        .select({
            id: collections.id,
            userId: collections.userId,
            name: collections.name,
            description: collections.description,
            createdAt: collections.createdAt,
            updatedAt: collections.updatedAt,
            itemCount: sql<number>`COUNT(${collectionItems.themeId})`,
        })
        .from(collections)
        .leftJoin(
            collectionItems,
            eq(collections.id, collectionItems.collectionId),
        )
        .where(eq(collections.userId, userId))
        .groupBy(collections.id)
        .orderBy(desc(collections.updatedAt))
        .all();
}

export function getCollectionForOwner(
    db: Database,
    collectionId: string,
    userId: string,
) {
    return db
        .select()
        .from(collections)
        .where(
            and(
                eq(collections.id, collectionId),
                eq(collections.userId, userId),
            ),
        )
        .get();
}

export function updateCollection(
    db: Database,
    collectionId: string,
    userId: string,
    data: { name?: string; description?: string | null },
) {
    return db
        .update(collections)
        .set({ ...data, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(
            and(
                eq(collections.id, collectionId),
                eq(collections.userId, userId),
            ),
        )
        .run();
}

export function deleteCollection(
    db: Database,
    collectionId: string,
    userId: string,
) {
    return db
        .delete(collections)
        .where(
            and(
                eq(collections.id, collectionId),
                eq(collections.userId, userId),
            ),
        )
        .run();
}

export async function addThemeToCollection(
    db: Database,
    collectionId: string,
    themeId: string,
) {
    await db
        .insert(collectionItems)
        .values({ collectionId, themeId })
        .onConflictDoNothing();
    return db
        .select()
        .from(collectionItems)
        .where(
            and(
                eq(collectionItems.collectionId, collectionId),
                eq(collectionItems.themeId, themeId),
            ),
        )
        .get();
}

export function removeThemeFromCollection(
    db: Database,
    collectionId: string,
    themeId: string,
) {
    return db
        .delete(collectionItems)
        .where(
            and(
                eq(collectionItems.collectionId, collectionId),
                eq(collectionItems.themeId, themeId),
            ),
        )
        .run();
}

export function listCollectionThemes(
    db: Database,
    collectionId: string,
    { publicOnly = true }: { publicOnly?: boolean } = {},
) {
    const condition = publicOnly
        ? and(
              eq(collectionItems.collectionId, collectionId),
              eq(themes.isPublic, true),
          )
        : eq(collectionItems.collectionId, collectionId);

    return db
        .select({
            addedAt: collectionItems.createdAt,
            theme: themes,
        })
        .from(collectionItems)
        .innerJoin(themes, eq(collectionItems.themeId, themes.themeId))
        .where(condition)
        .orderBy(desc(collectionItems.createdAt))
        .all();
}
