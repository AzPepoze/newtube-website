import { REPORT_REASONS } from "../../constants/marketplace";
import {
    createReportForUser,
    listReportsForUser,
} from "../../services/marketplace/reports";
import { validateEnum, validateText, validateUuid } from "../../utils/validation";
import type { MarketplaceContext } from "../marketplace";

function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

export const marketplaceReportsController = {
    async create({ params, body, userId, db, set }: MarketplaceContext) {
        const idValidation = validateUuid(params.id, "theme ID");
        const data = body as { reason?: unknown; details?: unknown } | null;
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

        const result = await createReportForUser(db, userId!, {
            themeId: params.id,
            reason: data!.reason as (typeof REPORT_REASONS)[number],
            details:
                typeof data?.details === "string"
                    ? data.details.trim() || undefined
                    : undefined,
        });
        if (result.status === "not-found") {
            set.status = 404;
            return { error: "Theme not found" };
        }
        if (result.status === "own-theme") {
            set.status = 403;
            return { error: "Cannot report your own theme" };
        }
        set.status = 201;
        return result.report;
    },

    listMine({ userId, db }: MarketplaceContext) {
        return listReportsForUser(db, userId!);
    },
};
