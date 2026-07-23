import { Elysia } from "elysia";
import { sponsorsController } from "../controllers/sponsors";
import { contextPlugin } from "../plugins/context";

export const sponsorsRoute = new Elysia({ prefix: "/sponsors" })
    .use(contextPlugin)
    .get("/", (context) => sponsorsController.list(context));
