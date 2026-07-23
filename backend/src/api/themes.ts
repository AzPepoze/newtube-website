import { Elysia } from "elysia";
import { themeController } from "../controllers/themes";
import { authGuard } from "../plugins/auth-guard";
import { contextPlugin } from "../plugins/context";

export const themeRoute = new Elysia({ prefix: "/themes" })
    .use(contextPlugin)
    .get("/", (context) => themeController.list(context))
    .get("/drafts", (context) => themeController.listDrafts(context))
    .get("/:id/versions", (context) => themeController.listVersions(context))
    .get("/:id/versions/:version", (context) =>
        themeController.getVersion(context),
    )
    .get("/:id/reviews", (context) => themeController.listReviews(context))
    .get("/:id", (context) => themeController.get(context))
    .use(authGuard)
    .post("/", (context) => themeController.create(context))
    .put("/:id", (context) => themeController.update(context))
    .delete("/:id", (context) => themeController.remove(context))
    .put("/:id/review", (context) => themeController.upsertReview(context))
    .delete("/:id/review", (context) => themeController.removeReview(context));
