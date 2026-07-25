import { Elysia, t } from "elysia";
import { userController } from "../controllers/users";
import { authGuard } from "../plugins/auth-guard";
import { contextPlugin } from "../plugins/context";

export const userRoute = new Elysia({ prefix: "/users" })
    .use(contextPlugin)
    .get("/profile", (context) => userController.profile(context))
    .use(authGuard)
    .get("/me", (context) => userController.me(context))
    .patch(
        "/bio",
        (context) => userController.updateBio(context as any),
        {
            body: t.Object({
                bio: t.String({ maxLength: 500 }),
            }),
        },
    );

