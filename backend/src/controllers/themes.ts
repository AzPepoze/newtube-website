import {
    ensureCategoryById,
    tagSlug,
} from "../db/marketplace";
import type { Database } from "../db";
import {
    createThemeForOwner,
    createThemeReview,
    deleteThemeForOwner,
    getTheme,
    getThemeReviews,
    getThemeVersion,
    getThemeVersions,
    listDraftThemes,
    listThemes,
    removeThemeReview,
    type ThemePayload,
    updateThemeForOwner,
} from "../services/themes";
import type { ThemeSort } from "../db/themes";
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

type ResponseStatus = { status?: number | string };
type ThemeContext = {
    db: Database;
    env: Env;
    userId?: string;
    set: ResponseStatus;
    params: Record<string, string>;
    query: Record<string, unknown>;
    body: unknown;
};

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

async function validateThemePayload(
    db: Database,
    body: unknown,
): Promise<
    | { data: ThemePayload; message?: never }
    | { data?: never; message: string }
> {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { message: "Request body must be an object" };
    }
    const data = body as ThemePayload;
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
    if (failed && !failed.valid) return { message: failed.message };

    if (data.categoryId) {
        const category = await ensureCategoryById(db, data.categoryId);
        if (!category) return { message: "Category not found" };
    }
    return { data };
}

export const themeController = {
    async list({ query, db, set }: ThemeContext) {
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
        const categoryFilters = parseDiscoverySlugs(query.category, "category");
        if (!tagFilters.valid || !categoryFilters.valid) {
            set.status = 400;
            return {
                error: "Invalid discovery filter",
                message: !tagFilters.valid
                    ? tagFilters.message
                    : categoryFilters.message,
            };
        }
        return listThemes(db, {
            search: typeof query.q === "string" ? query.q.trim() : "",
            sort: sort as ThemeSort,
            tags: tagFilters.values,
            categories: categoryFilters.values,
            ...pagination,
        });
    },

    async listDrafts({ userId, db, set }: ThemeContext) {
        if (!userId) {
            set.status = 401;
            return { error: "Unauthorized", message: "You must be logged in" };
        }
        return listDraftThemes(db, userId);
    },

    async listVersions({ params, userId, db, set }: ThemeContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const versions = await getThemeVersions(db, params.id, userId);
        if (!versions) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        return versions;
    },

    async getVersion({ params, userId, db, set }: ThemeContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        const version = Number(params.version);
        if (!idValidation.valid || !Number.isInteger(version) || version < 1) {
            set.status = 400;
            return { error: "Invalid version" };
        }
        const { theme, snapshot } = await getThemeVersion(
            db,
            params.id,
            version,
            userId,
        );
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        if (!snapshot) {
            set.status = 404;
            return { error: "Version not found" };
        }
        return snapshot;
    },

    async listReviews({ params, query, db, set }: ThemeContext) {
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
        const reviews = await getThemeReviews(db, params.id, pagination);
        if (!reviews) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        return reviews;
    },

    async get({ params, userId, db, set }: ThemeContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const theme = await getTheme(db, params.id, userId);
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        return theme;
    },

    async create({ userId, body, db, set, env }: ThemeContext) {
        const payload = await validateThemePayload(db, body);
        if (!payload.data) {
            set.status = 400;
            return { error: "Invalid theme", message: payload.message };
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
        const result = await createThemeForOwner(db, env, userId!, payload.data);
        if (!result) {
            set.status = 500;
            return { error: "Failed to create theme" };
        }
        set.status = 201;
        return result;
    },

    async update({ userId, params, body, db, set, env }: ThemeContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const payload = await validateThemePayload(db, body);
        if (!payload.data) {
            set.status = 400;
            return { error: "Invalid theme", message: payload.message };
        }
        const updated = await updateThemeForOwner(
            db,
            env,
            params.id,
            userId!,
            payload.data,
        );
        if (!updated) {
            set.status = 403;
            return {
                error: "Unauthorized",
                message: "Theme not found or you do not own it",
            };
        }
        set.status = 204;
    },

    async remove({ userId, params, set, db, env }: ThemeContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const deleted = await deleteThemeForOwner(db, env, params.id, userId!);
        if (!deleted) {
            set.status = 403;
            return {
                error: "Unauthorized",
                message: "Theme not found or you do not own it",
            };
        }
        set.status = 204;
    },

    async upsertReview({ userId, params, body, db, set }: ThemeContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        const data = body as { rating?: unknown; body?: unknown } | null;
        const ratingValidation = validateRating(data?.rating);
        const bodyValidation = validateText(data?.body, "Review", { max: 2_000 });
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
        const result = await createThemeReview(
            db,
            params.id,
            userId!,
            data!.rating as number,
            data!.body as string | undefined,
        );
        if (result.status === "not-found") {
            set.status = 404;
            return { error: "Theme not found" };
        }
        if (result.status === "own-theme") {
            set.status = 403;
            return { error: "Cannot review your own theme" };
        }
        return result.review;
    },

    async removeReview({ userId, params, db, set }: ThemeContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const result = await removeThemeReview(db, params.id, userId!);
        if (result.meta.changes === 0) {
            set.status = 404;
            return { error: "Review not found" };
        }
        set.status = 204;
    },
};
