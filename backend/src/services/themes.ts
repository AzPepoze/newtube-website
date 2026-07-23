import {
    createTheme,
    deleteTheme,
    getDraftThemesByOwner,
    getThemeForViewer,
    searchThemesPage,
    updateTheme,
    type ThemeSort,
} from "../db/themes";
import {
    getThemeClassification,
    getThemeReviewSummary,
    getThemeVersion as getThemeVersionSnapshot,
    isUserAdmin,
    listThemeReviews,
    listThemeVersions,
    upsertThemeReview,
    deleteThemeReview,
} from "../db/marketplace";
import type { Database } from "../db";

export interface ThemePayload {
    themeName: string;
    description?: string;
    imgs?: string[];
    coverImage?: string;
    pendingImages?: Array<{ data: string; mimeType: string }>;
    pendingCoverImage?: { data: string; mimeType: string };
    settings?: unknown;
    tagNames?: string[];
    categoryId?: string | null;
    isPublic?: boolean;
}

async function enrichTheme(db: Database, theme: any) {
    const [classification, rating] = await Promise.all([
        getThemeClassification(db, theme.themeId),
        getThemeReviewSummary(db, theme.themeId),
    ]);
    return {
        ...theme,
        tags: classification.tags.map((tag) => tag.name),
        category: classification.category?.name ?? null,
        rating:
            rating?.averageRating == null ? null : Number(rating.averageRating),
        ratingCount: Number(rating?.count ?? 0),
    };
}

async function findThemeForViewer(
    db: Database,
    themeId: string,
    userId?: string,
) {
    const isAdmin = userId ? await isUserAdmin(db, userId) : false;
    return getThemeForViewer(db, themeId, { userId, isAdmin });
}

export async function listThemes(
    db: Database,
    options: {
        search: string;
        sort: ThemeSort;
        tags: string[];
        categories: string[];
        limit: number;
        offset: number;
    },
) {
    const page = await searchThemesPage(db, options);
    return {
        ...page,
        items: await Promise.all(page.items.map((theme) => enrichTheme(db, theme))),
    };
}

export async function listDraftThemes(db: Database, ownerId: string) {
    return Promise.all(
        (await getDraftThemesByOwner(db, ownerId)).map((theme) =>
            enrichTheme(db, theme),
        ),
    );
}

export async function getTheme(db: Database, themeId: string, userId?: string) {
    const theme = await findThemeForViewer(db, themeId, userId);
    return theme ? enrichTheme(db, theme) : null;
}

export async function getThemeVersions(
    db: Database,
    themeId: string,
    userId?: string,
) {
    const theme = await findThemeForViewer(db, themeId, userId);
    if (!theme) return null;

    const isAdmin = userId ? await isUserAdmin(db, userId) : false;
    return listThemeVersions(db, themeId, {
        includeDrafts: isAdmin || theme.ownerId === userId,
    });
}

export async function getThemeVersion(
    db: Database,
    themeId: string,
    version: number,
    userId?: string,
) {
    const theme = await findThemeForViewer(db, themeId, userId);
    if (!theme) return { theme: null, snapshot: null };

    const isAdmin = userId ? await isUserAdmin(db, userId) : false;
    const snapshot = await getThemeVersionSnapshot(db, themeId, version, {
        includeDrafts: isAdmin || theme.ownerId === userId,
    });
    return { theme, snapshot };
}

export async function getThemeReviews(
    db: Database,
    themeId: string,
    pagination: { limit: number; offset: number },
) {
    const theme = await getThemeForViewer(db, themeId);
    if (!theme) return null;

    const [items, rating] = await Promise.all([
        listThemeReviews(db, themeId, pagination),
        getThemeReviewSummary(db, themeId),
    ]);
    return {
        items,
        total: Number(rating?.count ?? 0),
        rating:
            rating?.averageRating == null ? null : Number(rating.averageRating),
        ...pagination,
    };
}

export function createThemeForOwner(
    db: Database,
    env: Env,
    ownerId: string,
    data: ThemePayload,
) {
    return createTheme(db, env, ownerId, data);
}

export function updateThemeForOwner(
    db: Database,
    env: Env,
    themeId: string,
    ownerId: string,
    data: ThemePayload,
) {
    return updateTheme(db, env, themeId, ownerId, data);
}

export function deleteThemeForOwner(
    db: Database,
    env: Env,
    themeId: string,
    ownerId: string,
) {
    return deleteTheme(db, env, themeId, ownerId);
}

export async function createThemeReview(
    db: Database,
    themeId: string,
    userId: string,
    rating: number,
    body?: string,
) {
    const theme = await getThemeForViewer(db, themeId);
    if (!theme) return { status: "not-found" as const };
    if (theme.ownerId === userId) return { status: "own-theme" as const };

    return {
        status: "created" as const,
        review: await upsertThemeReview(db, {
            themeId,
            userId,
            rating,
            body: body?.trim() || undefined,
        }),
    };
}

export function removeThemeReview(db: Database, themeId: string, userId: string) {
    return deleteThemeReview(db, themeId, userId);
}
