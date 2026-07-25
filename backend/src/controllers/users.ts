import type { Database } from "../db";
import { getCurrentUser, getProfileForViewer, updateUserBio } from "../services/users";
import type { ResponseStatus } from "../types/http";

type UserControllerContext = {
    db: Database;
    query: Record<string, unknown>;
    body?: any;
    userId?: string;
    set: ResponseStatus;
};

export const userController = {
    async profile({ query, userId, set, db }: UserControllerContext) {
        const targetUserId = query.userId || userId;
        if (
            !targetUserId ||
            typeof targetUserId !== "string" ||
            targetUserId.length > 256
        ) {
            set.status = 401;
            return { error: "Unauthorized", message: "No user ID provided" };
        }

        const profile = await getProfileForViewer(db, targetUserId, userId);
        if (!profile) {
            set.status = 404;
            return { error: "User not found" };
        }
        return profile;
    },

    async me({ userId, set, db }: UserControllerContext) {
        const user = await getCurrentUser(db, userId!);
        if (!user) {
            set.status = 404;
            return { error: "User not found" };
        }
        return user;
    },

    async updateBio({ body, userId, set, db }: UserControllerContext) {
        if (!userId) {
            set.status = 401;
            return { error: "Unauthorized" };
        }
        if (!body || typeof body.bio !== "string") {
            set.status = 400;
            return { error: "Invalid request", message: "bio string is required" };
        }
        try {
            return await updateUserBio(db, userId, body.bio);
        } catch (err: any) {
            set.status = 400;
            return { error: "Bad Request", message: err.message || "Failed to update bio" };
        }
    },
};

