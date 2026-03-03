import { Elysia } from 'elysia';
import { contextPlugin } from './context';

export const authGuard = new Elysia({ name: 'auth-guard' })
    .use(contextPlugin)
    .onBeforeHandle(({ userId, set }) => {
        if (!userId || userId === '') {
            set.status = 401;
            return 'Unauthorized';
        }
    });
