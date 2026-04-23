import { VALIDATION_LIMITS, formatBytes } from 'shared';

const MAX_IMAGE_SIZE_BYTES = VALIDATION_LIMITS.IMAGE_MAX_BYTES;

export interface CompressedImage {
	data: string;
	mimeType: string;
}

export async function compressImage(file: File): Promise<CompressedImage> {
	// For GIFs, keep original to preserve animation
	if (file.type === 'image/gif') {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const dataUrl = reader.result as string;
				if (!validateImageSize(dataUrl)) {
					reject(new Error(`Image exceeds ${formatBytes(MAX_IMAGE_SIZE_BYTES)} limit`));
					return;
				}
				resolve({
					data: dataUrl,
					mimeType: 'image/gif',
				});
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	// For other formats, compress to WebP
	const dataUrl = await readFileAsDataUrl(file);
	const canvas = await createCanvasFromImage(dataUrl);
	const compressedDataUrl = await canvasToWebP(canvas);

	if (!validateImageSize(compressedDataUrl)) {
		throw new Error(`Image exceeds ${formatBytes(MAX_IMAGE_SIZE_BYTES)} limit`);
	}

	return {
		data: compressedDataUrl,
		mimeType: 'image/webp',
	};
}


function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

function createCanvasFromImage(dataUrl: string): Promise<HTMLCanvasElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			const scale = Math.min(1, 1280 / img.width);
			const canvas = document.createElement('canvas');
			canvas.width = img.width * scale;
			canvas.height = img.height * scale;
			const context = canvas.getContext('2d')!;
			context.imageSmoothingEnabled = true;
			context.drawImage(img, 0, 0, canvas.width, canvas.height);
			resolve(canvas);
		};
		img.onerror = reject;
		img.src = dataUrl;
	});
}

function canvasToWebP(canvas: HTMLCanvasElement): Promise<string> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (blob) {
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = reject;
					reader.readAsDataURL(blob);
				} else {
					reject(new Error('Canvas toBlob failed'));
				}
			},
			'image/webp',
			0.75,
		);
	});
}

function validateImageSize(dataUrl: string): boolean {
	const base64Data = dataUrl.split(',')[1];
	if (!base64Data) return false;

	const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);

	return sizeInBytes <= MAX_IMAGE_SIZE_BYTES;
}
