import { Elysia } from "elysia";
import { imageController } from "../controllers/images";
import { authGuard } from "../plugins/auth-guard";
import { contextPlugin } from "../plugins/context";

export const imageRoute = new Elysia({ prefix: "/images" })
    .use(contextPlugin)
    .use(authGuard)
    .post("/upload", (context) => imageController.upload(context))
    .delete("/delete", (context) => imageController.remove(context));
