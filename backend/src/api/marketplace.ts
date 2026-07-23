import { Elysia } from "elysia";
import { marketplaceController } from "../controllers/marketplace";
import { contextPlugin } from "../plugins/context";
import { marketplaceAdminRoute } from "./marketplace/admin";
import { marketplaceReportsRoute } from "./marketplace/reports";

export const marketplaceRoute = new Elysia()
    .use(contextPlugin)
    .get("/tags", marketplaceController.listTags)
    .get("/categories", marketplaceController.listCategories)
    .use(marketplaceReportsRoute)
    .use(marketplaceAdminRoute);
