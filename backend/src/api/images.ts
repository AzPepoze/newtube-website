import { Elysia } from 'elysia';
import { authGuard } from '../plugins/auth-guard';
import { contextPlugin } from '../plugins/context';
import { userOwnsImage } from '../db/images';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function uploadImageToR2(env: Env, fileData: string, mimeType: string): Promise<string> {
	console.log('[uploadImageToR2] Starting upload...', { mimeType, dataLength: fileData?.length });
	try {
		const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
		const byteCharacters = atob(base64Data);
		const byteNumbers = new Array(byteCharacters.length);
		for (let i = 0; i < byteCharacters.length; i++) {
			byteNumbers[i] = byteCharacters.charCodeAt(i);
		}
		const byteArray = new Uint8Array(byteNumbers);

		const extension = mimeType.split('/')[1] ?? 'webp';
		const objectKey = `${crypto.randomUUID()}.${extension}`;

		console.log('[uploadImageToR2] Putting object to R2:', objectKey);
		const blob = new Blob([byteArray], { type: mimeType });
		await env.IMAGES.put(objectKey, blob.stream(), {
			httpMetadata: { contentType: mimeType },
		});

		const url = `${env.R2_PUBLIC_URL}/${objectKey}`;
		console.log('[uploadImageToR2] Upload successful:', url);
		return url;
	} catch (error) {
		console.error('[uploadImageToR2] Upload failed:', error);
		throw error;
	}
}

async function deleteImageFromR2(env: Env, imageUrl: string): Promise<void> {
	try {
		const url = new URL(imageUrl);
		const objectKey = url.pathname.substring(1);
		await env.IMAGES.delete(objectKey);
	} catch (error) {
		console.error('Error deleting image from R2:', error);
	}
}

export const imageRoute = new Elysia({ prefix: '/images' })
	.use(contextPlugin)
	.use(authGuard)
	.post('/upload', async ({ userId, request, set, env }) => {
		const { success } = await env.UPLOAD_RATE_LIMITER.limit({ key: userId! });
		if (!success) {
			set.status = 429;
			return { error: 'Rate limit exceeded', message: 'Too many uploads. Try again later.' };
		}

		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file || !file.type.startsWith('image/')) {
			set.status = 400;
			return { error: 'Invalid file', message: 'Must be an image file.' };
		}

		if (file.size > MAX_FILE_SIZE) {
			set.status = 413;
			return { error: 'File too large', message: 'Maximum size is 5MB.' };
		}

		const extension = file.type.split('/')[1] ?? 'webp';
		const objectKey = `${crypto.randomUUID()}.${extension}`;

		await env.IMAGES.put(objectKey, file.stream(), {
			httpMetadata: { contentType: file.type },
		});

		const publicUrl = `${env.R2_PUBLIC_URL}/${objectKey}`;

		return { url: publicUrl };
	})
	.delete('/delete', async ({ userId, body, set, env, db }) => {
		const { url } = body as { url: string };
		if (!url) {
			set.status = 400;
			return { error: 'Invalid request', message: 'URL is required' };
		}

		const ownsImage = await userOwnsImage(db, userId!, url);

		if (!ownsImage) {
			set.status = 403;
			return { error: 'Unauthorized', message: 'Image not found in your themes' };
		}

		await deleteImageFromR2(env, url);
		return { success: true };
	});

export { uploadImageToR2, deleteImageFromR2 };

