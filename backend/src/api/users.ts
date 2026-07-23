import { Elysia } from "elysia";
import { userController } from "../controllers/users";
import { authGuard } from "../plugins/auth-guard";
import { contextPlugin } from "../plugins/context";

export const userRoute = new Elysia({ prefix: "/users" })
    .use(contextPlugin)
    .get("/profile", (context) => userController.profile(context))
    .use(authGuard)
    .get("/me", (context) => userController.me(context));
