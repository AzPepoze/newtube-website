import {
    REPORT_RESOLUTION_STATUSES,
    REPORT_STATUSES,
} from "../../constants/marketplace";
import { tagSlug } from "../../db/marketplace";
import {
    createCategoryForAdmin,
    isMarketplaceAdmin,
    listReportsForAdmin,
    resolveReportForAdmin,
    updateThemeVisibilityForAdmin,
} from "../../services/marketplace/admin";
import type { ReportStatus } from "../../types/marketplace";
import {
    parsePagination,
    validateBoolean,
    validateEnum,
    validateText,
    validateUuid,
} from "../../utils/validation";
import type { MarketplaceContext } from "../marketplace";

function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

function forbidden(set: MarketplaceContext["set"]) {
    set.status = 403;
    return { error: "Forbidden" };
}

export const marketplaceAdminController = {
    async createCategory({ body, userId, db, set }: MarketplaceContext) {
        if (!(await isMarketplaceAdmin(db, userId))) return forbidden(set);

        const data = body as { name?: unknown; slug?: unknown } | null;
        const nameValidation = validateText(data?.name, "Category name", {
            min: 1,
            max: 48,
            required: true,
        });
        const slug =
            typeof data?.slug === "string"
                ? data.slug.trim().toLowerCase()
                : tagSlug(typeof data?.name === "string" ? data.name : "");
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

        const result = await createCategoryForAdmin(db, userId, {
            name: (data?.name as string).trim(),
            slug,
        });
        if (result.status === "forbidden") return forbidden(set);
        if (result.status === "conflict") {
            set.status = 409;
            return {
                error: "Category already exists",
                message:
                    "A category with that name already exists under a different slug",
            };
        }
        set.status = 201;
        return result.category;
    },

    async listReports({ query, userId, db, set }: MarketplaceContext) {
        if (!(await isMarketplaceAdmin(db, userId))) return forbidden(set);

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

        const result = await listReportsForAdmin(db, userId, {
            ...pagination,
            status: query.status as ReportStatus | undefined,
        });
        return result.status === "forbidden" ? forbidden(set) : result.reports;
    },

    async resolveReport({ params, body, userId, db, set }: MarketplaceContext) {
        if (!(await isMarketplaceAdmin(db, userId))) return forbidden(set);

        const idValidation = validateUuid(params.id, "report ID");
        const data = body as { status?: unknown } | null;
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

        const result = await resolveReportForAdmin(
            db,
            userId,
            params.id,
            data!.status as (typeof REPORT_RESOLUTION_STATUSES)[number],
        );
        if (result.status === "forbidden") return forbidden(set);
        if (result.status === "not-found") {
            set.status = 404;
            return { error: "Report not found" };
        }
        set.status = 204;
    },

    async updateThemeVisibility({
        params,
        body,
        userId,
        db,
        set,
    }: MarketplaceContext) {
        if (!(await isMarketplaceAdmin(db, userId))) return forbidden(set);

        const idValidation = validateUuid(params.id, "theme ID");
        const data = body as { isPublic?: unknown } | null;
        const visibilityValidation = validateBoolean(data?.isPublic, "isPublic");
        if (!idValidation.valid || !visibilityValidation.valid) {
            set.status = 400;
            return {
                error: "Invalid visibility",
                message: !idValidation.valid
                    ? invalidMessage(idValidation)
                    : invalidMessage(visibilityValidation),
            };
        }

        const result = await updateThemeVisibilityForAdmin(
            db,
            userId,
            params.id,
            data!.isPublic as boolean,
        );
        if (result.status === "forbidden") return forbidden(set);
        if (result.status === "not-found") {
            set.status = 404;
            return { error: "Theme not found" };
        }
        set.status = 204;
    },
};
