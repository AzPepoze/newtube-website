import { Elysia } from 'elysia';
import { CloudflareAdapter } from 'elysia/adapter/cloudflare-worker';
import { cors } from '@elysiajs/cors';
import { authRoute } from './routes/auth';
import { themeRoute } from './routes/themes';
import { userRoute } from './routes/users';
import { imageRoute } from './routes/images';

const app = new Elysia({ adapter: CloudflareAdapter })
	.use(cors({
		origin: true,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
	}))
	.use(authRoute)
	.use(themeRoute)
	.use(userRoute)
	.use(imageRoute)
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
		return 'Internal Server Error';
	})
	.compile();

export default app;
