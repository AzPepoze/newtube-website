import { Elysia } from "elysia";
import {
    createThemeReport,
    getReportsForReporter,
} from "../../db/marketplace";
import { getThemeForViewer } from "../../db/themes";
import { authGuard } from "../../plugins/auth-guard";
import { contextPlugin } from "../../plugins/context";
import {
    validateEnum,
    validateText,
    validateUuid,
} from "../../utils/validation";

const REPORT_REASONS = [
    "copyright",
    "inappropriate",
    "malware",
    "broken",
    "spam",
    "other",
] as const;

function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

export const marketplaceReportsRoute = new Elysia()
    .use(contextPlugin)
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
    );
