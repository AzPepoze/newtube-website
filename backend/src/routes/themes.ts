import { Elysia } from 'elysia';
import { searchThemes, getThemeById, createTheme, updateTheme, deleteTheme } from '../db/themes';
import { contextPlugin } from '../plugins/context';
import { authGuard } from '../plugins/auth-guard';

export const themeRoute = new Elysia({ prefix: '/themes' })
	.use(contextPlugin)
	.get('/', async ({ query, db }) => {
		return searchThemes(db, query.q || '', query.sort as any || 'popular');
	})
	.get('/:id', async ({ params, set, db }) => {
		const theme = await getThemeById(db, params.id);
		if (!theme) {
			set.status = 404;
			return { error: 'Theme not found' };
		}
		return theme;
	})
	.use(authGuard)
	.post('/', async ({ userId, body, db, set, env }) => {
		console.log('[Theme Route] Creating theme for user:', userId);
		try {
			if (env.THEME_RATE_LIMITER) {
				const { success } = await env.THEME_RATE_LIMITER.limit({ key: userId! });
				if (!success) {
					console.warn('[Theme Route] Rate limit exceeded for user:', userId);
					set.status = 429;
					return { error: 'Rate limit exceeded', message: 'Too many themes created. Try again later.' };
				}
			}
		} catch (error) {
			console.error('[Theme Route] Rate limiter error:', error);
		}

		try {
			const result = await createTheme(db, env, userId!, body as any);
			if (!result) {
				console.error('[Theme Route] createTheme returned null/undefined');
				set.status = 500;
				return { error: 'Failed to create theme', message: 'Database returned no result' };
			}
			console.log('[Theme Route] Theme created successfully:', result.id);
			return result;
		} catch (error) {
			console.error('[Theme Route] Database error in createTheme:', error);
			throw error;
		}
	})
	.put('/:id', async ({ userId, params, body, set, db, env }) => {
		const updated = await updateTheme(db, env, params.id, userId!, body as any);
		if (!updated) {
			set.status = 403;
			return { error: 'Unauthorized', message: 'Theme not found or you do not have permission to edit it' };
		}
		set.status = 204;
	})
	.delete('/:id', async ({ userId, params, set, db, env }) => {
		const deleted = await deleteTheme(db, env, params.id, userId!);
		if (!deleted) {
			set.status = 403;
			return { error: 'Unauthorized', message: 'Theme not found or you do not have permission to delete it' };
		}
		set.status = 204;
	});
