import { Elysia } from "elysia";
import { authController } from "../controllers/auth";
import { contextPlugin } from "../plugins/context";

export const authRoute = new Elysia({ prefix: "/auth" })
    .use(contextPlugin)
    .get("/google", (context) => authController.google(context))
    .get("/callback", (context) => authController.callback(context))
    .post("/logout", (context) => authController.logout(context));
