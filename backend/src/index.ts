import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { env } from 'cloudflare:workers';
import { cors } from '@elysiajs/cors';
import { authRoute } from './routes/auth';
import { themeRoute } from './routes/themes';
import { userRoute } from './routes/users';
import { imageRoute } from './routes/images';
import { sponsorsRoute } from './routes/sponsors';

const app = new Elysia({ adapter: CloudflareAdapter })
	.use(cors({
		origin: true,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
	}))
	.derive(({ request }) => {
		return {
			checkGlobalRateLimit: async (userId?: string) => {
				const cloudflareEnv = env as unknown as Env;
				if (!cloudflareEnv.GLOBAL_RATE_LIMITER) return { success: true };
				const clientIp = request.headers.get('cf-connecting-ip') || 'global';
				const key = userId || clientIp;
				return await cloudflareEnv.GLOBAL_RATE_LIMITER.limit({ key });
			}
		};
	})
	.onBeforeHandle(async ({ request, set, checkGlobalRateLimit, cookie }) => {
		const url = new URL(request.url);
		const method = request.method;

		const path = url.pathname;
		if (method === 'POST' && (path === '/themes' || path === '/themes/' || path === '/images/upload')) {
			return;
		}

		const sessionId = cookie.sessionId?.value as string | undefined;
		const { success } = await checkGlobalRateLimit(sessionId);

		if (!success) {
			set.status = 429;
			return { error: 'Rate limit exceeded', message: 'Too many requests. Try again later.' };
		}
	})
	.use(authRoute)
	.use(themeRoute)
	.use(userRoute)
	.use(imageRoute)
	.use(sponsorsRoute)
	.onError(({ code, error, set }) => {
		console.error(`Error (${code}):`, error);

		if (code === 'NOT_FOUND') {
			set.status = 404;
			return 'Not Found';
		}

		if (code === 'VALIDATION') {
			set.status = 400;
			return error.all;
		}

		// Handle errors that have a status property (e.g. from create-error)
		if (error && 'status' in error && typeof (error as any).status === 'number') {
			set.status = (error as any).status;
			return error.message;
		}

		set.status = 500;
		return {
			error: 'Internal Server Error',
			message: (error as any).message || 'Unknown error',
			code: code,
			stack: (error as any).stack
		};
	})
	.compile();

export default app;
