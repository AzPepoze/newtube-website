import { Elysia } from "elysia";
import { THEME_CATEGORIES, THEME_TAGS } from "../constants/marketplace";
import { contextPlugin } from "../plugins/context";
import { marketplaceAdminRoute } from "./marketplace/admin";
import { marketplaceReportsRoute } from "./marketplace/reports";

export const marketplaceRoute = new Elysia()
    .use(contextPlugin)
    .get("/tags", () => THEME_TAGS)
    .get("/categories", () => THEME_CATEGORIES)
    .use(marketplaceReportsRoute)
    .use(marketplaceAdminRoute);
