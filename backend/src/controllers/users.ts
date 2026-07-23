import type { Database } from "../db";
import { getCurrentUser, getProfileForViewer } from "../services/users";
import type { ResponseStatus } from "../types/http";

type UserControllerContext = {
    db: Database;
    query: Record<string, unknown>;
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
};
