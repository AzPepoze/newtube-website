import { and, countDistinct, eq, inArray, like, or, sql } from "drizzle-orm";
import type { Database } from "./index";
import { categories, tags, themeCategories, themeTags, themes } from "./schema";

export type ThemeSort = "popular" | "newest" | "alpha";

export type ThemePersistenceInput = {
    themeName: string;
    description?: string;
    images: string[];
    coverImage?: string;
    settings?: unknown;
    isPublic: boolean;
};

const sortColumns: Record<ThemeSort, ReturnType<typeof sql>> = {
    popular: sql`${themes.downloads} DESC`,
    newest: sql`${themes.createdAt} DESC`,
    alpha: sql`${themes.themeName} ASC`,
};

export async function searchThemes(
    db: Database,
    search: string,
    sort: ThemeSort = "popular",
) {
    const pattern = `%${search}%`;
    const results = await db
        .select()
        .from(themes)
        .where(
            and(
                eq(themes.isPublic, true),
                or(
                    like(themes.themeName, pattern),
                    like(themes.description, pattern),
                ),
            ),
        )
        .orderBy(sortColumns[sort] ?? sortColumns.popular)
        .all();

    return results.map((theme) => {
        if (theme.settings && typeof theme.settings === "object") {
            const settings = { ...theme.settings };
            if (settings.addOnStyleShiftItems) {
                settings.addOnStyleShiftItems = true;
            }
            return { ...theme, settings };
        }
        return theme;
    });
}

export async function searchThemesPage(
    db: Database,
    {
        search = "",
        sort = "popular",
        tags: selectedTags,
        categories: selectedCategories,
        limit = 24,
        offset = 0,
    }: {
        search?: string;
        sort?: ThemeSort;
        tags?: string[];
        categories?: string[];
        limit?: number;
        offset?: number;
    } = {},
) {
    const pattern = `%${search}%`;
    const conditions = [
        eq(themes.isPublic, true),
        or(like(themes.themeName, pattern), like(themes.description, pattern)),
    ];

    const from = db
        .select({ theme: themes })
        .from(themes)
        .leftJoin(themeTags, eq(themeTags.themeId, themes.themeId))
        .leftJoin(tags, eq(themeTags.tagId, tags.id))
        .leftJoin(themeCategories, eq(themeCategories.themeId, themes.themeId))
        .leftJoin(categories, eq(themeCategories.categoryId, categories.id));
    const countFrom = db
        .select({ total: countDistinct(themes.themeId) })
        .from(themes)
        .leftJoin(themeTags, eq(themeTags.themeId, themes.themeId))
        .leftJoin(tags, eq(themeTags.tagId, tags.id))
        .leftJoin(themeCategories, eq(themeCategories.themeId, themes.themeId))
        .leftJoin(categories, eq(themeCategories.categoryId, categories.id));

    if (selectedTags?.length) {
        conditions.push(inArray(tags.slug, selectedTags));
    }
    if (selectedCategories?.length) {
        conditions.push(inArray(categories.slug, selectedCategories));
    }

    const where = and(...conditions);
    const [rows, total] = await Promise.all([
        from
            .where(where)
            .groupBy(themes.themeId)
            .orderBy(sortColumns[sort] ?? sortColumns.popular)
            .limit(limit)
            .offset(offset)
            .all(),
        countFrom.where(where).get(),
    ]);

    return {
        items: rows.map(({ theme }) => theme),
        total: total?.total ?? 0,
        limit,
        offset,
    };
}

export function getThemeById(db: Database, themeId: string) {
    return db.query.themes.findFirst({
        where: eq(themes.themeId, themeId),
        with: { owner: { columns: { name: true, avatarUrl: true } } },
    });
}

export function getThemeByOwner(
    db: Database,
    themeId: string,
    ownerId: string,
) {
    return db.query.themes.findFirst({
        where: and(eq(themes.themeId, themeId), eq(themes.ownerId, ownerId)),
    });
}

export function getThemesByOwner(db: Database, ownerId: string) {
    return db.select().from(themes).where(eq(themes.ownerId, ownerId)).all();
}

export function getDraftThemesByOwner(db: Database, ownerId: string) {
    return db
        .select()
        .from(themes)
        .where(and(eq(themes.ownerId, ownerId), eq(themes.isPublic, false)))
        .all();
}

export async function getThemeForViewer(
    db: Database,
    themeId: string,
    viewer: { userId?: string; isAdmin?: boolean } = {},
) {
    const theme = await getThemeById(db, themeId);
    if (!theme) return null;
    if (
        theme.isPublic ||
        viewer.isAdmin ||
        (viewer.userId && theme.ownerId === viewer.userId)
    ) {
        return theme;
    }
    return null;
}

export async function createThemeRecord(
    db: Database,
    ownerId: string,
    persistenceInput: ThemePersistenceInput,
) {
    const themeId = crypto.randomUUID();

    console.log("[db/createTheme] Inserting into database...", {
        themeId,
        ownerId,
        themeName: persistenceInput.themeName,
    });
    try {
        const createdTheme = await db
            .insert(themes)
            .values({
                themeId,
                ownerId,
                themeName: persistenceInput.themeName,
                description: persistenceInput.description,
                images: persistenceInput.images,
                coverImage: persistenceInput.coverImage,
                settings: persistenceInput.settings ?? {},
                isPublic: persistenceInput.isPublic,
            })
            .returning({ themeId: themes.themeId })
            .then((createdThemeRows) => {
                console.log(
                    "[db/createTheme] Insert successful, result:",
                    createdThemeRows,
                );
                return createdThemeRows[0];
            });
        return createdTheme;
    } catch (error) {
        console.error(
            "[db/createTheme] Insert failed:",
            (error as any)?.message ?? error,
        );
        throw error;
    }
}

export async function updateThemeRecordForOwner(
    db: Database,
    themeId: string,
    ownerId: string,
    persistenceInput: ThemePersistenceInput,
) {
    const updateOutcome = await db
        .update(themes)
        .set({
            themeName: persistenceInput.themeName,
            description: persistenceInput.description,
            images: persistenceInput.images,
            coverImage: persistenceInput.coverImage,
            settings: persistenceInput.settings ?? {},
            isPublic: persistenceInput.isPublic,
            updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(and(eq(themes.themeId, themeId), eq(themes.ownerId, ownerId)))
        .run();

    return updateOutcome.meta.changes > 0;
}

export async function deleteThemeRecordForOwner(
    db: Database,
    themeId: string,
    ownerId: string,
) {
    const deleteOutcome = await db
        .delete(themes)
        .where(and(eq(themes.themeId, themeId), eq(themes.ownerId, ownerId)))
        .run();

    return deleteOutcome.meta.changes > 0;
}
