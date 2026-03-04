import { Elysia } from 'elysia';
import { env } from 'cloudflare:workers';
import { createDb } from '../db';
import { updateOrInsertUser } from '../db/users';
import { createSession, deleteSession } from '../db/sessions';
import { getGoogleAuthUrl, getGoogleUser } from '../lib/auth';
import { contextPlugin } from '../plugins/context';

export const authRoute = new Elysia({ prefix: '/auth' })
	.use(contextPlugin)
	.get('/google', async ({ request, redirect }) => {
		const url = new URL(request.url);
		let protocol = url.protocol;
		if (!url.hostname.includes('localhost')) {
			protocol = 'https:';
		}
		const redirectUri = `${protocol}//${url.host}/auth/callback`;
		console.log(`[Auth] Starting Google OAuth. Redirect URI: ${redirectUri}`);

		const authUrl = await getGoogleAuthUrl(env, redirectUri);
		return redirect(authUrl);
	})
	.get('/callback', async ({ request, query, redirect, set, cookie }) => {
		const code = query.code as string;
		if (!code) {
			console.error('[Auth Callback] Missing code in query params');
			set.status = 400;
			return 'Missing code';
		}

		console.log('[Auth Callback] Received code, exchanging for tokens...');

		try {
			const db = createDb(env.DB);
			const url = new URL(request.url);
			let protocol = url.protocol;
			if (!url.hostname.includes('localhost')) {
				protocol = 'https:';
			}
			const redirectUri = `${protocol}//${url.host}/auth/callback`;
			console.log(`[Auth Callback] Using Redirect URI for exchange: ${redirectUri}`);

			const googleUser = await getGoogleUser(env, code, redirectUri);
			console.log(`[Auth Callback] Successfully authenticated user: ${googleUser.email}`);

			await updateOrInsertUser(db, {
				id: googleUser.id,
				email: googleUser.email,
				name: googleUser.name,
				avatarUrl: googleUser.picture,
			});

			const sessionId = await createSession(db, googleUser.id);

			const frontendUrlStr = (env.FRONTEND_URL || 'http://localhost:5173').trim();
			const urlObj = new URL(frontendUrlStr);
			urlObj.pathname = '/discover';
			urlObj.searchParams.set('sessionId', sessionId);
			const redirectDest = urlObj.toString();

			const sameSite = frontendUrlStr.includes('localhost') ? 'lax' : 'none';
			cookie.sessionId.set({
				value: sessionId,
				path: '/',
				maxAge: 2592000,
				sameSite,
				secure: !frontendUrlStr.includes('localhost'),
				httpOnly: true, // More secure, since frontend only needs it from URL once to move it over
			});
			cookie.userId.set({
				value: googleUser.id,
				path: '/',
				maxAge: 2592000,
				sameSite,
				secure: !frontendUrlStr.includes('localhost'),
			});

			console.log(`[Auth Callback] Redirecting to frontend: ${redirectDest}`);
			return redirect(redirectDest);
		} catch (error: any) {
			console.error('[Auth Callback] Error during authentication:', error);
			set.status = 500;
			return error.message;
		}
	})
	.post('/logout', async ({ cookie, db }) => {
		const sessionId = cookie.sessionId?.value;
		if (typeof sessionId === 'string') {
			await deleteSession(db, sessionId);
		}

		cookie.sessionId.remove();
		cookie.userId.remove();

		return { success: true };
	});
