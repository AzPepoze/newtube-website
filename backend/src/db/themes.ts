import { and, eq, like, or, sql } from 'drizzle-orm';
import { themes } from './schema';
import type { Database } from './index';
import { uploadImageToR2, deleteImageFromR2 } from '../routes/images';

type ThemeSort = 'popular' | 'newest' | 'alpha';

const sortColumns: Record<ThemeSort, ReturnType<typeof sql>> = {
	popular: sql`${themes.downloads} DESC`,
	newest: sql`${themes.createdAt} DESC`,
	alpha: sql`${themes.name} ASC`,
};

export function searchThemes(db: Database, search: string, sort: ThemeSort = 'popular') {
	const pattern = `%${search}%`;
	return db
		.select()
		.from(themes)
		.where(and(
			eq(themes.isPublic, true),
			or(like(themes.name, pattern), like(themes.description, pattern))
		))
		.orderBy(sortColumns[sort] ?? sortColumns.popular)
		.all();
}

export function getThemeById(db: Database, id: string) {
	return db.query.themes.findFirst({
		where: eq(themes.id, id),
		with: { owner: { columns: { name: true, avatarUrl: true } } },
	});
}

export function getThemesByOwner(db: Database, ownerId: string) {
	return db.select().from(themes).where(eq(themes.ownerId, ownerId)).all();
}

export async function createTheme(db: Database, env: Env, ownerId: string, data: {
	name: string;
	description?: string;
	imgs?: string[];
	coverImage?: string;
	pendingImages?: Array<{ data: string; mimeType: string }>;
	pendingCoverImage?: { data: string; mimeType: string };
	settings?: unknown;
}) {
	const id = crypto.randomUUID();

	// Upload pending images first
	const uploadedUrls: string[] = [];
	if (data.pendingImages && Array.isArray(data.pendingImages)) {
		for (const image of data.pendingImages) {
			try {
				const url = await uploadImageToR2(env, image.data, image.mimeType);
				uploadedUrls.push(url);
			} catch (error) {
				console.error('Error uploading theme image:', error);
			}
		}
	}

	// Upload pending cover image
	let finalCoverImage = data.coverImage;
	if (data.pendingCoverImage) {
		try {
			finalCoverImage = await uploadImageToR2(env, data.pendingCoverImage.data, data.pendingCoverImage.mimeType);
		} catch (error) {
			console.error('Error uploading cover image:', error);
		}
	}

	// Combine with provided image URLs
	const allImages = [...(data.imgs ?? []), ...uploadedUrls];

	console.log('[db/createTheme] Inserting into database...', { id, ownerId, name: data.name });
	try {
		const result = await db.insert(themes).values({
			id,
			ownerId,
			name: data.name,
			description: data.description,
			images: allImages,
			coverImage: finalCoverImage,
			settings: data.settings ?? {},
		}).returning({ id: themes.id }).then(res => {
			console.log('[db/createTheme] Insert successful, result:', res);
			return res[0];
		});
		return result;
	} catch (error) {
		console.error('[db/createTheme] Insert failed:', (error as any)?.message ?? error);
		throw error;
	}
}

export async function updateTheme(db: Database, env: Env, id: string, ownerId: string, data: {
	name: string;
	description?: string;
	imgs?: string[];
	coverImage?: string;
	pendingImages?: Array<{ data: string; mimeType: string }>;
	pendingCoverImage?: { data: string; mimeType: string };
	settings?: unknown;
}) {
	// Get existing theme to find removed images
	const existingTheme = await db.query.themes.findFirst({
		where: and(eq(themes.id, id), eq(themes.ownerId, ownerId)),
	});

	if (!existingTheme) {
		return false;
	}

	const existingImages = existingTheme.images || [];
	const newImages = data.imgs ?? [];

	// Upload pending images first
	const uploadedUrls: string[] = [];
	if (data.pendingImages && Array.isArray(data.pendingImages)) {
		for (const image of data.pendingImages) {
			try {
				const url = await uploadImageToR2(env, image.data, image.mimeType);
				uploadedUrls.push(url);
			} catch (error) {
				console.error('Error uploading theme image:', error);
			}
		}
	}

	// Upload pending cover image
	let finalCoverImage = data.coverImage;
	if (data.pendingCoverImage) {
		try {
			finalCoverImage = await uploadImageToR2(env, data.pendingCoverImage.data, data.pendingCoverImage.mimeType);
			// Delete old cover image if it was on R2
			if (existingTheme.coverImage && existingTheme.coverImage !== finalCoverImage) {
				const r2Prefix = 'https://pub-'; // Adjust based on your R2 URL pattern if needed
				if (existingTheme.coverImage.includes(r2Prefix)) {
					await deleteImageFromR2(env, existingTheme.coverImage);
				}
			}
		} catch (error) {
			console.error('Error uploading cover image:', error);
		}
	} else if (existingTheme.coverImage && data.coverImage === '') {
		// User explicitly removed cover image
		const r2Prefix = 'https://pub-';
		if (existingTheme.coverImage.includes(r2Prefix)) {
			await deleteImageFromR2(env, existingTheme.coverImage);
		}
	}

	// Combine with provided image URLs
	const allImages = [...newImages, ...uploadedUrls];

	// Delete removed images from R2
	for (const imageUrl of existingImages) {
		if (!allImages.includes(imageUrl)) {
			await deleteImageFromR2(env, imageUrl);
		}
	}

	const result = await db
		.update(themes)
		.set({
			name: data.name,
			description: data.description,
			images: allImages,
			coverImage: finalCoverImage,
			settings: data.settings ?? {},
		})
		.where(and(eq(themes.id, id), eq(themes.ownerId, ownerId)))
		.run();

	return result.meta.changes > 0;
}

export async function deleteTheme(db: Database, env: Env, id: string, ownerId: string) {
	// Get theme to delete its images
	const theme = await db.query.themes.findFirst({
		where: and(eq(themes.id, id), eq(themes.ownerId, ownerId)),
	});

	if (theme) {
		const images = theme.images || [];

		// Delete all images from R2
		for (const imageUrl of images) {
			await deleteImageFromR2(env, imageUrl);
		}
	}

	const result = await db
		.delete(themes)
		.where(and(eq(themes.id, id), eq(themes.ownerId, ownerId)))
		.run();

	return result.meta.changes > 0;
}
