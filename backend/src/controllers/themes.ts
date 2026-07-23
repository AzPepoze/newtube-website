import type { Database } from "../db";
import type { ResponseStatus } from "../types/http";
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
    updateThemeForOwner,
} from "../services/themes";
import type { ThemeSort } from "../db/themes";
import {
    parsePagination,
    validateEnum,
    validateRating,
    validateText,
    validateUuid,
} from "../utils/validation";
import {
    invalidMessage,
    parseDiscoverySlugs,
    validateThemeInput,
} from "../validators/themes";

const THEME_SORTS = ["popular", "newest", "alpha"] as const;

type ThemeControllerContext = {
    db: Database;
    env: Env;
    userId?: string;
    set: ResponseStatus;
    params: Record<string, string>;
    query: Record<string, unknown>;
    body: unknown;
};

export const themeController = {
    async list({ query, db, set }: ThemeControllerContext) {
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
        if (!tagFilters.valid) {
            set.status = 400;
            return {
                error: "Invalid discovery filter",
                message: tagFilters.message,
            };
        }
        return listThemes(db, {
            search: typeof query.q === "string" ? query.q.trim() : "",
            sort: sort as ThemeSort,
            tags: tagFilters.values,
            ...pagination,
        });
    },

    async listDrafts({ userId, db, set }: ThemeControllerContext) {
        if (!userId) {
            set.status = 401;
            return { error: "Unauthorized", message: "You must be logged in" };
        }
        return listDraftThemes(db, userId);
    },

    async listVersions({ params, userId, db, set }: ThemeControllerContext) {
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

    async getVersion({ params, userId, db, set }: ThemeControllerContext) {
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

    async listReviews({ params, query, db, set }: ThemeControllerContext) {
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

    async get({ params, userId, db, set }: ThemeControllerContext) {
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

    async create({ userId, body, db, set, env }: ThemeControllerContext) {
        const themeInputValidation = await validateThemeInput(db, body);
        if (!themeInputValidation.input) {
            set.status = 400;
            return {
                error: "Invalid theme",
                message: themeInputValidation.message,
            };
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
        const createdTheme = await createThemeForOwner(
            db,
            env,
            userId!,
            themeInputValidation.input,
        );
        if (!createdTheme) {
            set.status = 500;
            return { error: "Failed to create theme" };
        }
        set.status = 201;
        return createdTheme;
    },

    async update({
        userId,
        params,
        body,
        db,
        set,
        env,
    }: ThemeControllerContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const themeInputValidation = await validateThemeInput(db, body);
        if (!themeInputValidation.input) {
            set.status = 400;
            return {
                error: "Invalid theme",
                message: themeInputValidation.message,
            };
        }
        const wasUpdated = await updateThemeForOwner(
            db,
            env,
            params.id,
            userId!,
            themeInputValidation.input,
        );
        if (!wasUpdated) {
            set.status = 403;
            return {
                error: "Unauthorized",
                message: "Theme not found or you do not own it",
            };
        }
        set.status = 204;
    },

    async remove({ userId, params, set, db, env }: ThemeControllerContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        if (!idValidation.valid) {
            set.status = 400;
            return { error: "Invalid theme ID", message: idValidation.message };
        }
        const wasDeleted = await deleteThemeForOwner(
            db,
            env,
            params.id,
            userId!,
        );
        if (!wasDeleted) {
            set.status = 403;
            return {
                error: "Unauthorized",
                message: "Theme not found or you do not own it",
            };
        }
        set.status = 204;
    },

    async upsertReview({
        userId,
        params,
        body,
        db,
        set,
    }: ThemeControllerContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        const reviewInput = body as { rating?: unknown; body?: unknown } | null;
        const ratingValidation = validateRating(reviewInput?.rating);
        const bodyValidation = validateText(reviewInput?.body, "Review", {
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
        const reviewOutcome = await createThemeReview(
            db,
            params.id,
            userId!,
            reviewInput!.rating as number,
            reviewInput!.body as string | undefined,
        );
        if (reviewOutcome.status === "not-found") {
            set.status = 404;
            return { error: "Theme not found" };
        }
        if (reviewOutcome.status === "own-theme") {
            set.status = 403;
            return { error: "Cannot review your own theme" };
        }
        return reviewOutcome.review;
    },

    async removeReview({ userId, params, db, set }: ThemeControllerContext) {
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
