import { REPORT_REASONS } from "../../constants/marketplace";
import {
    createReportForUser,
    listReportsForUser,
} from "../../services/marketplace/reports";
import { validateEnum, validateText, validateUuid } from "../../utils/validation";
import type { MarketplaceControllerContext } from "../marketplace";

function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

export const marketplaceReportsController = {
    async create({ params, body, userId, db, set }: MarketplaceControllerContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        const reportInput = body as { reason?: unknown; details?: unknown } | null;
        const reasonValidation = validateEnum(
            reportInput?.reason,
            REPORT_REASONS,
            "reason",
        );
        const detailsValidation = validateText(reportInput?.details, "Details", {
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

        const reportOutcome = await createReportForUser(db, userId!, {
            themeId: params.id,
            reason: reportInput!.reason as (typeof REPORT_REASONS)[number],
            details:
                typeof reportInput?.details === "string"
                    ? reportInput.details.trim() || undefined
                    : undefined,
        });
        if (reportOutcome.status === "not-found") {
            set.status = 404;
            return { error: "Theme not found" };
        }
        if (reportOutcome.status === "own-theme") {
            set.status = 403;
            return { error: "Cannot report your own theme" };
        }
        set.status = 201;
        return reportOutcome.report;
    },

    listMine({ userId, db }: MarketplaceControllerContext) {
        return listReportsForUser(db, userId!);
    },
};
