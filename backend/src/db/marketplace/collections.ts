import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../index";
import { collectionItems, collections, themes } from "../schema";

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
