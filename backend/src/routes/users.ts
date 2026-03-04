import { Elysia } from 'elysia';
import { getUserById, getUserProfile } from '../db/users';
import { contextPlugin } from '../plugins/context';
import { authGuard } from '../plugins/auth-guard';

export const userRoute = new Elysia({ prefix: '/users' })
	.use(contextPlugin)
	.get('/profile', async ({ query, userId, set, db }) => {
		const targetUserId = query.userId || userId;
		if (!targetUserId) {
			set.status = 401;
			return 'Unauthorized';
		}

		const [user, userThemes] = await getUserProfile(db, targetUserId);
		return { user, themes: userThemes };
	})
	.use(authGuard)
	.get('/me', async ({ userId, set, db }) => {
		const user = await getUserById(db, userId!);
		if (!user) {
			set.status = 404;
			return 'Not Found';
		}
		return user;
	});
