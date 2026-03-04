import { Elysia } from 'elysia';
import { env } from 'cloudflare:workers';
import { createDb } from '../db';

export const contextPlugin = new Elysia({ name: 'context' })
    .derive({ as: 'global' }, ({ cookie }) => ({
        userId: cookie.userId?.value as string | undefined,
        db: createDb(env.DB),
    }));
