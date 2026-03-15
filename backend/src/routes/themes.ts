import { Elysia } from 'elysia';
import { searchThemes, getThemeById, createTheme, updateTheme, deleteTheme } from '../db/themes';
import { contextPlugin } from '../plugins/context';
import { authGuard } from '../plugins/auth-guard';
import { validateThemeTitle, validateThemeDescription, validateSettingsJSON, validatePendingImages, validatePendingCoverImage } from '../lib/validation';

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

		// Validate request data
		const data = body as any;
		const themeName = data.themeName;
		const titleValidation = validateThemeTitle(themeName);
		if (!titleValidation.valid) {
			set.status = 400;
			return { error: 'Invalid themeName', message: titleValidation.message };
		}

		const descriptionValidation = validateThemeDescription(data.description);
		if (!descriptionValidation.valid) {
			set.status = 400;
			return { error: 'Invalid description', message: descriptionValidation.message };
		}

		const pendingImagesValidation = validatePendingImages(data.pendingImages);
		if (!pendingImagesValidation.valid) {
			set.status = 400;
			return { error: 'Invalid image', message: pendingImagesValidation.message };
		}

		const pendingCoverImageValidation = validatePendingCoverImage(data.pendingCoverImage);
		if (!pendingCoverImageValidation.valid) {
			set.status = 400;
			return { error: 'Invalid cover image', message: pendingCoverImageValidation.message };
		}

		const settingsValidation = validateSettingsJSON(data.settings);
		if (!settingsValidation.valid) {
			set.status = 400;
			return { error: 'Invalid settings', message: settingsValidation.message };
		}

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
			const result = await createTheme(db, env, userId!, data);
			if (!result) {
				console.error('[Theme Route] createTheme returned null/undefined');
				set.status = 500;
				return { error: 'Failed to create theme', message: 'Database returned no result' };
			}
			console.log('[Theme Route] Theme created successfully:', result.themeId);
			return result;
		} catch (error) {
			console.error('[Theme Route] Database error in createTheme:', error);
			throw error;
		}
	})
	.put('/:id', async ({ userId, params, body, set, db, env }) => {
		// Validate request data
		const data = body as any;
		const themeName = data.themeName;
		const titleValidation = validateThemeTitle(themeName);
		if (!titleValidation.valid) {
			set.status = 400;
			return { error: 'Invalid themeName', message: titleValidation.message };
		}

		const descriptionValidation = validateThemeDescription(data.description);
		if (!descriptionValidation.valid) {
			set.status = 400;
			return { error: 'Invalid description', message: descriptionValidation.message };
		}

		const pendingImagesValidation = validatePendingImages(data.pendingImages);
		if (!pendingImagesValidation.valid) {
			set.status = 400;
			return { error: 'Invalid image', message: pendingImagesValidation.message };
		}

		const pendingCoverImageValidation = validatePendingCoverImage(data.pendingCoverImage);
		if (!pendingCoverImageValidation.valid) {
			set.status = 400;
			return { error: 'Invalid cover image', message: pendingCoverImageValidation.message };
		}

		const settingsValidation = validateSettingsJSON(data.settings);
		if (!settingsValidation.valid) {
			set.status = 400;
			return { error: 'Invalid settings', message: settingsValidation.message };
		}

		const updated = await updateTheme(db, env, params.id, userId!, data);
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
