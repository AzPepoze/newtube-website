import { Elysia } from "elysia";
import {
    addThemeToCollection,
    createCategory,
    createCollection,
    createThemeReport,
    deleteCollection,
    getCollectionForOwner,
    getReportsForReporter,
    isUserAdmin,
    listCategories,
    listCollectionThemes,
    listCollectionsByUser,
    listModerationReports,
    listTags,
    removeThemeFromCollection,
    resolveThemeReport,
    setThemeVisibility,
    tagSlug,
    updateCollection,
    type ReportStatus,
} from "../db/marketplace";
import { getThemeForViewer } from "../db/themes";
import { authGuard } from "../plugins/auth-guard";
import { contextPlugin } from "../plugins/context";
import {
    parsePagination,
    validateBoolean,
    validateEnum,
    validateText,
    validateUuid,
} from "../utils/validation";

const REPORT_REASONS = [
    "copyright",
    "inappropriate",
    "malware",
    "broken",
    "spam",
    "other",
] as const;
const REPORT_STATUSES = ["open", "resolved", "dismissed"] as const;
const RESOLUTION_STATUSES = ["resolved", "dismissed"] as const;

async function requireAdmin(db: any, userId: string | undefined, set: any) {
    if (!userId || !(await isUserAdmin(db, userId))) {
        set.status = 403;
        return false;
    }
    return true;
}

function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

export const marketplaceRoute = new Elysia()
    .use(contextPlugin)
    .get("/tags", ({ db }) => listTags(db))
    .get("/categories", ({ db }) => listCategories(db))
    .use(authGuard)
    .post("/themes/:id/reports", async ({ params, body, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "theme ID");
        const data = body as any;
        const reasonValidation = validateEnum(
            data?.reason,
            REPORT_REASONS,
            "reason",
        );
        const detailsValidation = validateText(data?.details, "Details", {
            max: 2_000,
        });
        if (
            !idValidation.valid ||
            !reasonValidation.valid ||
            !detailsValidation.valid
        ) {
            set.status = 400;
            return {
                error: "Invalid report",
                message: !idValidation.valid
                    ? invalidMessage(idValidation)
                    : !reasonValidation.valid
                      ? invalidMessage(reasonValidation)
                      : invalidMessage(detailsValidation),
            };
        }
        const theme = await getThemeForViewer(db, params.id);
        if (!theme) {
            set.status = 404;
            return { error: "Theme not found" };
        }
        if (theme.ownerId === userId) {
            set.status = 403;
            return { error: "Cannot report your own theme" };
        }
        const report = await createThemeReport(db, {
            themeId: params.id,
            reporterId: userId!,
            reason: data.reason,
            details: data.details?.trim() || undefined,
        });
        set.status = 201;
        return report;
    })
    .get("/reports/mine", ({ userId, db }) =>
        getReportsForReporter(db, userId!),
    )
    .get("/collections", ({ userId, db }) => listCollectionsByUser(db, userId!))
    .post("/collections", async ({ body, userId, db, set }) => {
        const data = body as any;
        const nameValidation = validateText(data?.name, "Collection name", {
            min: 1,
            max: 80,
            required: true,
        });
        const descriptionValidation = validateText(
            data?.description,
            "Description",
            { max: 500 },
        );
        if (!nameValidation.valid || !descriptionValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid collection",
                message: !nameValidation.valid
                    ? invalidMessage(nameValidation)
                    : invalidMessage(descriptionValidation),
            };
        }
        try {
            const collection = await createCollection(db, {
                userId: userId!,
                name: data.name.trim(),
                description: data.description?.trim() || undefined,
            });
            set.status = 201;
            return collection;
        } catch (error) {
            set.status = 409;
            return {
                error: "Collection already exists",
                message: "Collection names must be unique",
            };
        }
    })
    .get("/collections/:id", async ({ params, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "collection ID");
        if (!idValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid collection ID",
                message: idValidation.message,
            };
        }
        const collection = await getCollectionForOwner(db, params.id, userId!);
        if (!collection) {
            set.status = 404;
            return { error: "Collection not found" };
        }
        return {
            ...collection,
            items: await listCollectionThemes(db, params.id, {
                publicOnly: false,
            }),
        };
    })
    .put("/collections/:id", async ({ params, body, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "collection ID");
        const data = body as any;
        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data) ||
            (data.name === undefined && data.description === undefined)
        ) {
            set.status = 400;
            return {
                error: "Invalid collection",
                message: "Provide name or description",
            };
        }
        const nameValidation =
            data.name === undefined
                ? { valid: true as const }
                : validateText(data.name, "Collection name", {
                      min: 1,
                      max: 80,
                      required: true,
                  });
        const descriptionValidation =
            data.description === undefined || data.description === null
                ? { valid: true as const }
                : validateText(data.description, "Description", { max: 500 });
        if (
            !idValidation.valid ||
            !nameValidation.valid ||
            !descriptionValidation.valid
        ) {
            set.status = 400;
            return {
                error: "Invalid collection",
                message: !idValidation.valid
                    ? invalidMessage(idValidation)
                    : !nameValidation.valid
                      ? invalidMessage(nameValidation)
                      : invalidMessage(descriptionValidation),
            };
        }
        try {
            const result = await updateCollection(db, params.id, userId!, {
                ...(data.name === undefined ? {} : { name: data.name.trim() }),
                ...(data.description === undefined
                    ? {}
                    : {
                          description:
                              data.description === null
                                  ? null
                                  : data.description.trim() || null,
                      }),
            });
            if (result.meta.changes === 0) {
                set.status = 404;
                return { error: "Collection not found" };
            }
            set.status = 204;
        } catch {
            set.status = 409;
            return {
                error: "Collection already exists",
                message: "Collection names must be unique",
            };
        }
    })
    .delete("/collections/:id", async ({ params, userId, db, set }) => {
        const idValidation = validateUuid(params.id, "collection ID");
        if (!idValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid collection ID",
                message: idValidation.message,
            };
        }
        const result = await deleteCollection(db, params.id, userId!);
        if (result.meta.changes === 0) {
            set.status = 404;
            return { error: "Collection not found" };
        }
        set.status = 204;
    })
    .post(
        "/collections/:id/items",
        async ({ params, body, userId, db, set }) => {
            const idValidation = validateUuid(params.id, "collection ID");
            const data = body as any;
            const themeValidation = validateUuid(data?.themeId, "theme ID");
            if (!idValidation.valid || !themeValidation.valid) {
                set.status = 400;
                return {
                    error: "Invalid collection item",
                    message: !idValidation.valid
                        ? invalidMessage(idValidation)
                        : invalidMessage(themeValidation),
                };
            }
            const collection = await getCollectionForOwner(
                db,
                params.id,
                userId!,
            );
            if (!collection) {
                set.status = 404;
                return { error: "Collection not found" };
            }
            const theme = await getThemeForViewer(db, data.themeId);
            if (!theme) {
                set.status = 404;
                return { error: "Public theme not found" };
            }
            const item = await addThemeToCollection(
                db,
                params.id,
                data.themeId,
            );
            set.status = 201;
            return item;
        },
    )
    .delete(
        "/collections/:id/items/:themeId",
        async ({ params, userId, db, set }) => {
            const idValidation = validateUuid(params.id, "collection ID");
            const themeValidation = validateUuid(params.themeId, "theme ID");
            if (!idValidation.valid || !themeValidation.valid) {
                set.status = 400;
                return {
                    error: "Invalid collection item",
                    message: !idValidation.valid
                        ? invalidMessage(idValidation)
                        : invalidMessage(themeValidation),
                };
            }
            const collection = await getCollectionForOwner(
                db,
                params.id,
                userId!,
            );
            if (!collection) {
                set.status = 404;
                return { error: "Collection not found" };
            }
            const result = await removeThemeFromCollection(
                db,
                params.id,
                params.themeId,
            );
            if (result.meta.changes === 0) {
                set.status = 404;
                return { error: "Collection item not found" };
            }
            set.status = 204;
        },
    )
    .post("/admin/categories", async ({ body, userId, db, set }) => {
        if (!(await requireAdmin(db, userId, set)))
            return { error: "Forbidden" };
        const data = body as any;
        const nameValidation = validateText(data?.name, "Category name", {
            min: 1,
            max: 48,
            required: true,
        });
        const slug =
            typeof data?.slug === "string"
                ? data.slug.trim().toLowerCase()
                : tagSlug(data?.name ?? "");
        if (
            !nameValidation.valid ||
            !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ||
            slug.length > 48
        ) {
            set.status = 400;
            return {
                error: "Invalid category",
                message: !nameValidation.valid
                    ? invalidMessage(nameValidation)
                    : "slug must contain lowercase letters, numbers, and hyphens",
            };
        }
        const category = await createCategory(db, {
            name: data.name.trim(),
            slug,
        });
        if (!category) {
            set.status = 409;
            return {
                error: "Category already exists",
                message:
                    "A category with that name already exists under a different slug",
            };
        }
        set.status = 201;
        return category;
    })
    .get("/admin/reports", async ({ query, userId, db, set }) => {
        if (!(await requireAdmin(db, userId, set)))
            return { error: "Forbidden" };
        const pagination = parsePagination(query, { limit: 50 });
        const statusValidation =
            query.status === undefined
                ? { valid: true as const }
                : validateEnum(query.status, REPORT_STATUSES, "status");
        if (!pagination.valid || !statusValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid report query",
                message: !pagination.valid
                    ? invalidMessage(pagination)
                    : invalidMessage(statusValidation),
            };
        }
        return listModerationReports(db, {
            ...pagination,
            status: query.status as ReportStatus | undefined,
        });
    })
    .put("/admin/reports/:id", async ({ params, body, userId, db, set }) => {
        if (!(await requireAdmin(db, userId, set)))
            return { error: "Forbidden" };
        const idValidation = validateUuid(params.id, "report ID");
        const data = body as any;
        const statusValidation = validateEnum(
            data?.status,
            RESOLUTION_STATUSES,
            "status",
        );
        if (!idValidation.valid || !statusValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid report",
                message: !idValidation.valid
                    ? invalidMessage(idValidation)
                    : invalidMessage(statusValidation),
            };
        }
        const result = await resolveThemeReport(db, {
            reportId: params.id,
            adminId: userId!,
            status: data.status,
        });
        if (result.meta.changes === 0) {
            set.status = 404;
            return { error: "Report not found" };
        }
        set.status = 204;
    })
    .put(
        "/admin/themes/:id/visibility",
        async ({ params, body, userId, db, set }) => {
            if (!(await requireAdmin(db, userId, set)))
                return { error: "Forbidden" };
            const idValidation = validateUuid(params.id, "theme ID");
            const data = body as any;
            const visibilityValidation = validateBoolean(
                data?.isPublic,
                "isPublic",
            );
            if (!idValidation.valid || !visibilityValidation.valid) {
                set.status = 400;
                return {
                    error: "Invalid visibility",
                    message: !idValidation.valid
                        ? invalidMessage(idValidation)
                        : invalidMessage(visibilityValidation),
                };
            }
            const result = await setThemeVisibility(
                db,
                params.id,
                data.isPublic,
            );
            if (result.meta.changes === 0) {
                set.status = 404;
                return { error: "Theme not found" };
            }
            set.status = 204;
        },
    );
