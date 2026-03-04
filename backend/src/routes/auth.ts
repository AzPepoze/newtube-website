import { Elysia } from 'elysia';
import { env } from 'cloudflare:workers';
import { createDb } from '../db';
import { updateOrInsertUser } from '../db/users';
import { getGoogleAuthUrl, getGoogleUser } from '../lib/auth';

export const authRoute = new Elysia({ prefix: '/auth' })
	.get('/google', async ({ request, redirect }) => {
		const url = new URL(request.url);
		const redirectUri = `${url.origin}/auth/callback`;
		const authUrl = await getGoogleAuthUrl(env, redirectUri);
		return redirect(authUrl);
	})
	.get('/callback', async ({ request, query, redirect, set, cookie }) => {
		const code = query.code as string;
		if (!code) {
			set.status = 400;
			return 'Missing code';
		}

		try {
			const db = createDb(env.DB);
			const url = new URL(request.url);
			const redirectUri = `${url.origin}/auth/callback`;
			const googleUser = await getGoogleUser(env, code, redirectUri);

			await updateOrInsertUser(db, {
				id: googleUser.id,
				email: googleUser.email,
				name: googleUser.name,
				avatarUrl: googleUser.picture,
			});

			const frontendUrlStr = (env.FRONTEND_URL || 'http://localhost:5173').trim();
			const urlObj = new URL(frontendUrlStr);
			urlObj.pathname = '/discover';
			urlObj.searchParams.set('userId', googleUser.id);
			const redirectDest = urlObj.toString();

			const sameSite = frontendUrlStr.includes('localhost') ? 'lax' : 'none';
			cookie.userId.set({
				value: googleUser.id,
				path: '/',
				maxAge: 2592000,
				sameSite,
				secure: !frontendUrlStr.includes('localhost'),
			});
			cookie.userEmail.set({
				value: googleUser.email,
				path: '/',
				maxAge: 2592000,
				sameSite,
				secure: !frontendUrlStr.includes('localhost'),
			});
			cookie.userName.set({
				value: googleUser.name,
				path: '/',
				maxAge: 2592000,
				sameSite,
				secure: !frontendUrlStr.includes('localhost'),
			});

			return redirect(redirectDest);
		} catch (error: any) {
			set.status = 500;
			return error.message;
		}
	});
