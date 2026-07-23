import { Elysia } from "elysia";
import { getUserById, getUserProfile } from "../db/users";
import { getUserReviewActivity, isUserAdmin } from "../db/marketplace";
import { contextPlugin } from "../plugins/context";
import { authGuard } from "../plugins/auth-guard";

export const userRoute = new Elysia({ prefix: "/users" })
    .use(contextPlugin)
    .get("/profile", async ({ query, userId, set, db }) => {
        const targetUserId = query.userId || userId;
        if (
            !targetUserId ||
            typeof targetUserId !== "string" ||
            targetUserId.length > 256
        ) {
            set.status = 401;
            return { error: "Unauthorized", message: "No user ID provided" };
        }

        const viewerIsAdmin = userId ? await isUserAdmin(db, userId) : false;
        const mayViewDrafts = userId === targetUserId || viewerIsAdmin;
        const [user, userThemes] = await getUserProfile(db, targetUserId, {
            includeDrafts: mayViewDrafts,
        });
        if (!user) {
            set.status = 404;
            return { error: "User not found" };
        }
        const publicThemes = userThemes.filter((theme) => theme.isPublic);
        const profile = {
            user,
            themes: publicThemes,
        };
        if (!mayViewDrafts) {
            return {
                ...profile,
                reviews: await getUserReviewActivity(db, targetUserId),
            };
        }

        const reviews = await getUserReviewActivity(db, targetUserId, {
            includePrivateThemes: true,
        });
        return {
            ...profile,
            reviews,
            drafts: userThemes.filter((theme) => !theme.isPublic),
        };
    })
    .use(authGuard)
    .get("/me", async ({ userId, set, db }) => {
        const user = await getUserById(db, userId!);
        if (!user) {
            set.status = 404;
            return { error: "User not found" };
        }
        return { ...user, isAdmin: await isUserAdmin(db, userId!) };
    });
