import { Elysia } from "elysia";
import { env } from "cloudflare:workers";
import { createDb } from "../db";
import { getSession } from "../db/sessions";
import { sessionCache } from "../utils/cache";

export const contextPlugin = new Elysia({ name: "context" }).derive(
    { as: "global" },
    async ({ cookie }) => {
        const db = createDb(env.DB);
        const sessionId = cookie.sessionId?.value as string | undefined;
        let userId: string | undefined = undefined;

        if (sessionId) {
            const cachedSession = sessionCache.get(sessionId);
            if (cachedSession !== undefined) {
                userId = cachedSession?.userId;
            } else {
                const session = await getSession(db, sessionId);
                if (session) {
                    userId = session.userId;
                    sessionCache.set(sessionId, session, 30);
                } else {
                    sessionCache.set(sessionId, null, 30);
                }
            }
        }

        return {
            userId,
            db,
            env,
        };
    },
);
