import { Elysia } from 'elysia';
import { env } from 'cloudflare:workers';
import { authGuard } from '../plugins/auth-guard';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function uploadImageToR2(fileData: string, mimeType: string): Promise<string> {
	const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
	const byteCharacters = atob(base64Data);
	const byteNumbers = new Array(byteCharacters.length);
	for (let i = 0; i < byteCharacters.length; i++) {
		byteNumbers[i] = byteCharacters.charCodeAt(i);
	}
	const byteArray = new Uint8Array(byteNumbers);

	const extension = mimeType.split('/')[1] ?? 'webp';
	const objectKey = `${crypto.randomUUID()}.${extension}`;

	const blob = new Blob([byteArray], { type: mimeType });
	await env.IMAGES.put(objectKey, blob.stream(), {
		httpMetadata: { contentType: mimeType },
	});

	return `${env.R2_PUBLIC_URL}/${objectKey}`;
}

async function deleteImageFromR2(imageUrl: string): Promise<void> {
	try {
		const url = new URL(imageUrl);
		const objectKey = url.pathname.substring(1);
		await env.IMAGES.delete(objectKey);
	} catch (error) {
		console.error('Error deleting image from R2:', error);
	}
}

export const imageRoute = new Elysia({ prefix: '/images' })
	.use(authGuard)
	.post('/upload', async ({ userId, request, set }) => {
		const { success } = await env.UPLOAD_RATE_LIMITER.limit({ key: userId! });
		if (!success) {
			set.status = 429;
			return 'Too many uploads. Try again later.';
		}

		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file || !file.type.startsWith('image/')) {
			set.status = 400;
			return 'Invalid file. Must be an image.';
		}

		if (file.size > MAX_FILE_SIZE) {
			set.status = 413;
			return 'File too large. Maximum size is 5MB.';
		}

		const extension = file.type.split('/')[1] ?? 'webp';
		const objectKey = `${crypto.randomUUID()}.${extension}`;

		await env.IMAGES.put(objectKey, file.stream(), {
			httpMetadata: { contentType: file.type },
		});

		const publicUrl = `${env.R2_PUBLIC_URL}/${objectKey}`;

		return { url: publicUrl };
	})
	.delete('/delete', async ({ userId, body, set }) => {
		const { url } = body as { url: string };
		if (!url) {
			set.status = 400;
			return 'URL is required';
		}
		await deleteImageFromR2(url);
		return { success: true };
	});

export { uploadImageToR2, deleteImageFromR2 };

