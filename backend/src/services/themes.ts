import {
    createThemeRecord,
    deleteThemeRecordForOwner,
    getDraftThemesByOwner,
    getThemeByOwner,
    getThemeForViewer,
    searchThemesPage,
    updateThemeRecordForOwner,
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
import { deleteImageFromR2, uploadImageToR2 } from "./images";

export interface ThemeInput {
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

export async function createThemeForOwner(
    db: Database,
    env: Env,
    ownerId: string,
    themeInput: ThemeInput,
) {
    const uploadedUrls: string[] = [];
    if (themeInput.pendingImages && Array.isArray(themeInput.pendingImages)) {
        for (const image of themeInput.pendingImages) {
            try {
                const url = await uploadImageToR2(
                    env,
                    image.data,
                    image.mimeType,
                );
                uploadedUrls.push(url);
            } catch (error) {
                console.error("Error uploading theme image:", error);
            }
        }
    }

    let finalCoverImage = themeInput.coverImage;
    if (themeInput.pendingCoverImage) {
        try {
            finalCoverImage = await uploadImageToR2(
                env,
                themeInput.pendingCoverImage.data,
                themeInput.pendingCoverImage.mimeType,
            );
        } catch (error) {
            console.error("Error uploading cover image:", error);
        }
    }

    const result = await createThemeRecord(db, ownerId, {
        themeName: themeInput.themeName,
        description: themeInput.description,
        images: [...(themeInput.imgs ?? []), ...uploadedUrls],
        coverImage: finalCoverImage,
        settings: themeInput.settings,
        isPublic: themeInput.isPublic ?? true,
    });
    if (result) {
        await applyThemeClassification(db, result.themeId, themeInput);
        await createThemeVersion(db, result.themeId);
    }
    return result;
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

    const uploadedUrls: string[] = [];
    if (themeInput.pendingImages && Array.isArray(themeInput.pendingImages)) {
        for (const image of themeInput.pendingImages) {
            try {
                const url = await uploadImageToR2(
                    env,
                    image.data,
                    image.mimeType,
                );
                uploadedUrls.push(url);
            } catch (error) {
                console.error("Error uploading theme image:", error);
            }
        }
    }

    let finalCoverImage = themeInput.coverImage;
    if (themeInput.pendingCoverImage) {
        try {
            finalCoverImage = await uploadImageToR2(
                env,
                themeInput.pendingCoverImage.data,
                themeInput.pendingCoverImage.mimeType,
            );
            if (
                existingTheme.coverImage &&
                existingTheme.coverImage !== finalCoverImage
            ) {
                const r2Prefix = "https://pub-";
                if (existingTheme.coverImage.includes(r2Prefix)) {
                    await deleteImageFromR2(env, existingTheme.coverImage);
                }
            }
        } catch (error) {
            console.error("Error uploading cover image:", error);
        }
    } else if (existingTheme.coverImage && themeInput.coverImage === "") {
        const r2Prefix = "https://pub-";
        if (existingTheme.coverImage.includes(r2Prefix)) {
            await deleteImageFromR2(env, existingTheme.coverImage);
        }
    }

    const images = [...(themeInput.imgs ?? []), ...uploadedUrls];
    for (const imageUrl of existingTheme.images || []) {
        if (!images.includes(imageUrl)) {
            await deleteImageFromR2(env, imageUrl);
        }
    }

    const updated = await updateThemeRecordForOwner(db, themeId, ownerId, {
        themeName: themeInput.themeName,
        description: themeInput.description,
        images,
        coverImage: finalCoverImage,
        settings: themeInput.settings,
        isPublic: themeInput.isPublic ?? existingTheme.isPublic ?? true,
    });
    if (updated) {
        await applyThemeClassification(db, themeId, themeInput);
        await createThemeVersion(db, themeId);
    }
    return updated;
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

export function removeThemeReview(db: Database, themeId: string, userId: string) {
    return deleteThemeReview(db, themeId, userId);
}
