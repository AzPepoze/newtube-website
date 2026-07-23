import { Elysia } from "elysia";
import { listCategories, listTags } from "../db/marketplace";
import { contextPlugin } from "../plugins/context";
import { marketplaceAdminRoute } from "./marketplace/admin";
import { marketplaceReportsRoute } from "./marketplace/reports";

export const marketplaceRoute = new Elysia()
    .use(contextPlugin)
    .get("/tags", ({ db }) => listTags(db))
    .get("/categories", ({ db }) => listCategories(db))
    .use(marketplaceReportsRoute)
    .use(marketplaceAdminRoute);
