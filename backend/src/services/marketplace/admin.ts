import {
    createCategory,
    isUserAdmin,
    listModerationReports,
    resolveThemeReport,
    setThemeVisibility,
} from "../../db/marketplace";
import type { Database } from "../../db";
import type {
    ReportResolutionStatus,
    ReportStatus,
} from "../../types/marketplace";

export async function isMarketplaceAdmin(db: Database, userId?: string) {
    return Boolean(userId && (await isUserAdmin(db, userId)));
}

export async function createCategoryForAdmin(
    db: Database,
    userId: string | undefined,
    categoryInput: { name: string; slug: string },
) {
    if (!(await isMarketplaceAdmin(db, userId)))
        return { status: "forbidden" as const };

    const category = await createCategory(db, categoryInput);
    return category
        ? { status: "created" as const, category }
        : { status: "conflict" as const };
}

export async function listReportsForAdmin(
    db: Database,
    userId: string | undefined,
    options: { status?: ReportStatus; limit: number; offset: number },
) {
    if (!(await isMarketplaceAdmin(db, userId)))
        return { status: "forbidden" as const };

    return {
        status: "listed" as const,
        reports: await listModerationReports(db, options),
    };
}

export async function resolveReportForAdmin(
    db: Database,
    userId: string | undefined,
    reportId: string,
    status: ReportResolutionStatus,
) {
    if (!(await isMarketplaceAdmin(db, userId)))
        return { status: "forbidden" as const };

    const resolutionResult = await resolveThemeReport(db, {
        reportId,
        adminId: userId!,
        status,
    });
    return resolutionResult.meta.changes === 0
        ? { status: "not-found" as const }
        : { status: "resolved" as const };
}

export async function updateThemeVisibilityForAdmin(
    db: Database,
    userId: string | undefined,
    themeId: string,
    isPublic: boolean,
) {
    if (!(await isMarketplaceAdmin(db, userId)))
        return { status: "forbidden" as const };

    const visibilityResult = await setThemeVisibility(db, themeId, isPublic);
    return visibilityResult.meta.changes === 0
        ? { status: "not-found" as const }
        : { status: "updated" as const };
}
