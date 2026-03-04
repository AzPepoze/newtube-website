import { Elysia } from 'elysia';
import { env } from 'cloudflare:workers';
import { createDb } from '../db';
import { getSession } from '../db/sessions';

export const contextPlugin = new Elysia({ name: 'context' })
    .derive({ as: 'global' }, async ({ cookie }) => {
        const db = createDb(env.DB);
        const sessionId = cookie.sessionId?.value as string | undefined;
        let userId: string | undefined = undefined;

        if (sessionId) {
            const session = await getSession(db, sessionId);
            if (session) {
                userId = session.userId;
            }
        }

        return {
            userId,
            db,
        };
    });
