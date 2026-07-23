import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../index";
import { reviews, themes, users } from "../schema";

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
