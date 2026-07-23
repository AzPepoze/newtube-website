import { Elysia } from "elysia";
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
    getCategoryById,
    getThemeClassification,
    getThemeReviewSummary,
    getThemeVersion,
    isUserAdmin,
    listThemeReviews,
    listThemeVersions,
    tagSlug,
    upsertThemeReview,
    deleteThemeReview,
} from "../db/marketplace";
import { authGuard } from "../plugins/auth-guard";
import { contextPlugin } from "../plugins/context";
import {
    parsePagination,
    validateBoolean,
    validateEnum,
    validatePendingCoverImage,
    validatePendingImages,
    validateRating,
    validateSettingsJSON,
    validateTagNames,
    validateText,
    validateThemeDescription,
    validateThemeTitle,
    validateUuid,
} from "../utils/validation";

const THEME_SORTS = ["popular", "newest", "alpha"] as const;

function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

function parseDiscoverySlugs(value: unknown, label: string) {
    if (value === undefined || value === "") {
        return { valid: true as const, values: [] as string[] };
    }
    if (typeof value !== "string") {
        return {
            valid: false as const,
            message: `${label} must be a comma-separated list`,
        };
    }

    const rawValues = value.split(",").map((item) => item.trim());
    if (rawValues.length > 10 || rawValues.some((item) => item.length > 64)) {
        return {
            valid: false as const,
            message: `${label} accepts at most 10 values of 64 characters`,
        };
    }

    const values = [...new Set(rawValues.map(tagSlug).filter(Boolean))];
    if (values.length !== rawValues.length) {
        return {
            valid: false as const,
            message: `${label} values must contain letters or numbers`,
        };
    }
    return { valid: true as const, values };
}

async function enrichTheme(db: any, theme: any) {
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

async function validateThemePayload(db: any, data: any) {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
        return "Request body must be an object";
    }
    const validations = [
        validateThemeTitle(data.themeName),
        validateThemeDescription(data.description),
        validatePendingImages(data.pendingImages),
        validatePendingCoverImage(data.pendingCoverImage),
        validateSettingsJSON(data.settings),
    ];
    if (data.isPublic !== undefined) {
        validations.push(validateBoolean(data.isPublic, "isPublic"));
    }
    if (data.tagNames !== undefined) {
        validations.push(validateTagNames(data.tagNames));
    }
    if (data.categoryId !== undefined && data.categoryId !== null) {
        validations.push(validateUuid(data.categoryId, "categoryId"));
    }
    const failed = validations.find((result) => !result.valid);
    if (failed && !failed.valid) return failed.message;

    if (data.categoryId) {
        const category = await getCategoryById(db, data.categoryId);
        if (!category) return "Category not found";
    }
    return null;
}

export const themeRoute = new Elysia({ prefix: "/themes" })
    .use(contextPlugin)
    .get("/", async ({ query, db, set }) => {
        const pagination = parsePagination(query);
        if (!pagination.valid) {
            set.status = 400;
            return { error: "Invalid pagination", message: pagination.message };
        }
        const sort = query.sort ?? "popular";
        const sortValidation = validateEnum(sort, THEME_SORTS, "sort");
        if (!sortValidation.valid) {
            set.status = 400;
            return { error: "Invalid sort", message: sortValidation.message };
        }
        const searchValidation = validateText(query.q, "q", { max: 120 });
        if (!searchValidation.valid) {
            set.status = 400;
            return { error: "Invalid q", message: searchValidation.message };
        }

        const tagFilters = parseDiscoverySlugs(query.tag, "tag");
        const categoryFilters = parseDiscoverySlugs(
            query.category,
            "category",
        );
        if (!tagFilters.valid || !categoryFilters.valid) {
            set.status = 400;
            return {
                error: "Invalid discovery filter",
                message: !tagFilters.valid
                    ? tagFilters.message
                    : categoryFilters.message,
            };
        }
        const page = await searchThemesPage(db, {
            search: typeof query.q === "string" ? query.q.trim() : "",
            sort: sort as ThemeSort,
            tags: tagFilters.values,
            categories: categoryFilters.values,
            ...pagination,
        });
        return {
            ...page,
            items: await Promise.all(
                page.items.map((theme) => enrichTheme(db, theme)),
            ),
        };
    })
    .get("/drafts", async ({ userId, db, set }) => {
        if (!userId) {
            set.status = 401;
            return { error: "Unauthorized", message: "You must be logged in" };
        }
        return Promise.all(
            (await getDraftThemesByOwner(db, userId)).map((theme) =>
                enrichTheme(db, theme),
            ),
        );
    })
    .get("/:id/versions", async ({ params, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const admin = userId ? await isUserAdmin(db, userId) : false;
        const theme = await getThemeForViewer(db, params.id, {
            userId,
            isAdmin: admin,
        });
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        return listThemeVersions(db, params.id, {
            includeDrafts: admin || theme.ownerId === userId,
        });
    })
    .get("/:id/versions/:version", async ({ params, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        const version = Number(params.version);
        if (!idValidation.valid || !Number.isInteger(version) || version < 1) {
            set.status = 400;
            return { error: "Invalid version" };
        }
        const admin = userId ? await isUserAdmin(db, userId) : false;
        const theme = await getThemeForViewer(db, params.id, {
            userId,
            isAdmin: admin,
        });
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        const snapshot = await getThemeVersion(db, params.id, version, {
            includeDrafts: admin || theme.ownerId === userId,
        });
        if (!snapshot) {
            set.status = 404;
            return { error: "Version not found" };
        }
        return snapshot;
    })
    .get("/:id/reviews", async ({ params, query, db, set }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        const pagination = parsePagination(query, { limit: 20 });
        if (!idValidation.valid || !pagination.valid) {
            set.status = 400;
            return {
                error: "Invalid request",
                message: !idValidation.valid
                    ? invalidMessage(idValidation)
                    : invalidMessage(pagination),
            };
        }
        const theme = await getThemeForViewer(db, params.id);
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        const [items, rating] = await Promise.all([
            listThemeReviews(db, params.id, pagination),
            getThemeReviewSummary(db, params.id),
        ]);
        return {
            items,
            total: Number(rating?.count ?? 0),
            rating:
                rating?.averageRating == null
                    ? null
                    : Number(rating.averageRating),
            ...pagination,
        };
    })
    .get("/:id", async ({ params, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const admin = userId ? await isUserAdmin(db, userId) : false;
        const theme = await getThemeForViewer(db, params.id, {
            userId,
            isAdmin: admin,
        });
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        return enrichTheme(db, theme);
    })
    .use(authGuard)
    .post("/", async ({ userId, body, db, set, env }) => {
        const data = body as any;
        const message = await validateThemePayload(db, data);
        if (message) {
            set.status = 400;
            return { error: "Invalid theme", message };
        }
        try {
            if (env.THEME_RATE_LIMITER) {
                const { success } = await env.THEME_RATE_LIMITER.limit({
                    key: userId!,
                });
                if (!success) {
                    set.status = 429;
                    return {
                        error: "Rate limit exceeded",
                        message: "Too many themes created. Try again later.",
                    };
                }
            }
        } catch (error) {
            console.error("Theme rate limiter error", error);
        }
        const result = await createTheme(db, env, userId!, data);
        if (!result) {
            set.status = 500;
            return { error: "Failed to create theme" };
        }
        set.status = 201;
        return result;
    })
    .put("/:id", async ({ userId, params, body, db, set, env }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const data = body as any;
        const message = await validateThemePayload(db, data);
        if (message) {
            set.status = 400;
            return { error: "Invalid theme", message };
        }
        const updated = await updateTheme(db, env, params.id, userId!, data);
        if (!updated) {
            set.status = 403;
            return {
                error: "Unauthorized",
                message: "Theme not found or you do not own it",
            };
        }
        set.status = 204;
    })
    .delete("/:id", async ({ userId, params, set, db, env }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const deleted = await deleteTheme(db, env, params.id, userId!);
        if (!deleted) {
            set.status = 403;
            return {
                error: "Unauthorized",
                message: "Theme not found or you do not own it",
            };
        }
        set.status = 204;
    })
    .put("/:id/review", async ({ userId, params, body, db, set }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        const data = body as any;
        const ratingValidation = validateRating(data?.rating);
        const bodyValidation = validateText(data?.body, "Review", {
            max: 2_000,
        });
        if (
            !idValidation.valid ||
            !ratingValidation.valid ||
            !bodyValidation.valid
        ) {
            set.status = 400;
            return {
                error: "Invalid review",
                message: !idValidation.valid
                    ? invalidMessage(idValidation)
                    : !ratingValidation.valid
                      ? invalidMessage(ratingValidation)
                      : invalidMessage(bodyValidation),
            };
        }
        const theme = await getThemeForViewer(db, params.id);
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        if (theme.ownerId === userId) {
            set.status = 403;
            return { error: "Cannot review your own theme" };
        }
        return upsertThemeReview(db, {
            themeId: params.id,
            userId: userId!,
            rating: data.rating,
            body: data.body?.trim() || undefined,
        });
    })
    .delete("/:id/review", async ({ userId, params, db, set }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const result = await deleteThemeReview(db, params.id, userId!);
        if (result.meta.changes === 0) {
            set.status = 404;
            return { error: "Review not found" };
        }
        set.status = 204;
    });
