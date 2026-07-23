import { Elysia } from "elysia";
import {
    REPORT_RESOLUTION_STATUSES,
    REPORT_STATUSES,
} from "../../constants/marketplace";
import {
    createCategory,
    isUserAdmin,
    listModerationReports,
    resolveThemeReport,
    setThemeVisibility,
    tagSlug,
} from "../../db/marketplace";
import { authGuard } from "../../plugins/auth-guard";
import { contextPlugin } from "../../plugins/context";
import {
    parsePagination,
    validateBoolean,
    validateEnum,
    validateText,
    validateUuid,
} from "../../utils/validation";
import type { ReportStatus } from "../../types/marketplace";

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

export const marketplaceAdminRoute = new Elysia()
    .use(contextPlugin)
    .use(authGuard)
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
            REPORT_RESOLUTION_STATUSES,
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
