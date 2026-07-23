import { Elysia } from "elysia";
import { marketplaceAdminController } from "../../controllers/marketplace/admin";
import { authGuard } from "../../plugins/auth-guard";
import { contextPlugin } from "../../plugins/context";

export const marketplaceAdminRoute = new Elysia()
    .use(contextPlugin)
    .use(authGuard)
    .get("/admin/reports", marketplaceAdminController.listReports)
    .put("/admin/reports/:id", marketplaceAdminController.resolveReport)
    .put(
        "/admin/themes/:id/visibility",
        marketplaceAdminController.updateThemeVisibility,
    );
