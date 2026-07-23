import { createThemeReport, getReportsForReporter } from "../../db/marketplace";
import { getThemeForViewer } from "../../db/themes";
import type { Database } from "../../db";
import type { ReportReason } from "../../types/marketplace";

export async function createReportForUser(
    db: Database,
    reporterId: string,
    reportInput: { themeId: string; reason: ReportReason; details?: string },
) {
    const theme = await getThemeForViewer(db, reportInput.themeId);
    if (!theme) return { status: "not-found" as const };
    if (theme.ownerId === reporterId) return { status: "own-theme" as const };

    return {
        status: "created" as const,
        report: await createThemeReport(db, {
            ...reportInput,
            reporterId,
        }),
    };
}

export function listReportsForUser(db: Database, reporterId: string) {
    return getReportsForReporter(db, reporterId);
}
