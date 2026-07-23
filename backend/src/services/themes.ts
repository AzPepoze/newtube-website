import {
    createThemeRecord,
    deleteThemeRecordForOwner,
    getDraftThemesByOwner,
    getThemeByOwner,
    getThemeForViewer,
    searchThemesPage,
    updateThemeRecordForOwner,
    type ThemePersistenceInput,
    type ThemeSort,
} from "../db/themes";
import {
    applyThemeClassification,
    createThemeVersion,
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
import { deleteImageFromR2 } from "./images";
import {
    cleanupRemovedThemeImages,
    processPendingThemeImages,
} from "./theme-images";

export interface ThemeInput {
    themeName: string;
    description?: string;
    imgs?: string[];
    coverImage?: string;
    pendingImages?: Array<{ data: string; mimeType: string }>;
    pendingCoverImage?: { data: string; mimeType: string };
    settings?: unknown;
    tagNames?: string[];
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
        limit: number;
        offset: number;
    },
) {
    const page = await searchThemesPage(db, options);
    return {
        ...page,
        items: await Promise.all(
            page.items.map((theme) => enrichTheme(db, theme)),
        ),
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

export async function createThemeForOwner(
    db: Database,
    env: Env,
    ownerId: string,
    themeInput: ThemeInput,
) {
    const { uploadedUrls, finalCoverImage } = await processPendingThemeImages(
        env,
        themeInput,
    );

    const createPersistenceInput: ThemePersistenceInput = {
        themeName: themeInput.themeName,
        description: themeInput.description,
        images: [...(themeInput.imgs ?? []), ...uploadedUrls],
        coverImage: finalCoverImage,
        settings: themeInput.settings ?? {},
        isPublic: themeInput.isPublic ?? true,
    };
    const createdTheme = await createThemeRecord(
        db,
        ownerId,
        createPersistenceInput,
    );
    if (createdTheme) {
        await applyThemeClassification(db, createdTheme.themeId, themeInput);
        await createThemeVersion(db, createdTheme.themeId);
    }
    return createdTheme;
}

export async function updateThemeForOwner(
    db: Database,
    env: Env,
    themeId: string,
    ownerId: string,
    themeInput: ThemeInput,
) {
    const existingTheme = await getThemeByOwner(db, themeId, ownerId);
    if (!existingTheme) {
        return false;
    }

    const { uploadedUrls, finalCoverImage } = await processPendingThemeImages(
        env,
        themeInput,
    );

    await cleanupRemovedThemeImages(env, existingTheme, finalCoverImage, [
        ...(themeInput.imgs ?? []),
        ...uploadedUrls,
    ]);

    const images = [...(themeInput.imgs ?? []), ...uploadedUrls];
    const updatePersistenceInput: ThemePersistenceInput = {
        themeName: themeInput.themeName,
        description: themeInput.description,
        images,
        coverImage: finalCoverImage,
        settings: themeInput.settings ?? {},
        isPublic: themeInput.isPublic ?? existingTheme.isPublic ?? true,
    };
    const wasUpdated = await updateThemeRecordForOwner(
        db,
        themeId,
        ownerId,
        updatePersistenceInput,
    );
    if (wasUpdated) {
        await applyThemeClassification(db, themeId, themeInput);
        await createThemeVersion(db, themeId);
    }
    return wasUpdated;
}

export async function deleteThemeForOwner(
    db: Database,
    env: Env,
    themeId: string,
    ownerId: string,
) {
    const theme = await getThemeByOwner(db, themeId, ownerId);
    if (theme) {
        for (const imageUrl of theme.images || []) {
            await deleteImageFromR2(env, imageUrl);
        }
    }
    return deleteThemeRecordForOwner(db, themeId, ownerId);
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

export function removeThemeReview(
    db: Database,
    themeId: string,
    userId: string,
) {
    return deleteThemeReview(db, themeId, userId);
}
