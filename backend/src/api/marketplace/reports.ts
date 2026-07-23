import { Elysia } from "elysia";
import { marketplaceReportsController } from "../../controllers/marketplace/reports";
import { authGuard } from "../../plugins/auth-guard";
import { contextPlugin } from "../../plugins/context";

export const marketplaceReportsRoute = new Elysia()
    .use(contextPlugin)
    .use(authGuard)
    .post("/themes/:id/reports", marketplaceReportsController.create)
    .get("/reports/mine", marketplaceReportsController.listMine);
