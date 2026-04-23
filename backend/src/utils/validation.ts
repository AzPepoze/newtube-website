import { VALIDATION_LIMITS, formatBytes } from 'shared';

export interface ValidationError {
	valid: false;
	message: string;
}

export interface ValidationSuccess {
	valid: true;
}

export type ValidationResult = ValidationSuccess | ValidationError;

export function validateThemeTitle(title: string): ValidationResult {
	const trimmed = title?.trim() ?? '';

	if (!trimmed) {
		return {
			valid: false,
			message: 'Title is required',
		};
	}

	if (trimmed.length > VALIDATION_LIMITS.TITLE_MAX) {
		return {
			valid: false,
			message: `Title exceeds ${VALIDATION_LIMITS.TITLE_MAX} character limit`,
		};
	}

	return { valid: true };
}

export function validateThemeDescription(description: string | undefined): ValidationResult {
	const desc = description ?? '';

	if (desc.length > VALIDATION_LIMITS.DESCRIPTION_MAX) {
		return {
			valid: false,
			message: `Description exceeds ${VALIDATION_LIMITS.DESCRIPTION_MAX} character limit`,
		};
	}

	return { valid: true };
}

export function validateSettingsJSON(settings: unknown): ValidationResult {
	let stringified: string;

	try {
		stringified = JSON.stringify(settings);
	} catch (e) {
		return {
			valid: false,
			message: 'Settings must be a valid JSON object',
		};
	}

	const sizeInBytes = new TextEncoder().encode(stringified).length;

	if (sizeInBytes > VALIDATION_LIMITS.SETTINGS_JSON_MAX) {
		return {
			valid: false,
			message: `Settings JSON exceeds ${formatBytes(VALIDATION_LIMITS.SETTINGS_JSON_MAX)} limit (current size: ${formatBytes(sizeInBytes)})`,
		};
	}

	return { valid: true };
}


export function validateImageSize(dataUrl: string): ValidationResult {
	// Data URL format: "data:image/webp;base64,<base64_data>"
	const base64Data = dataUrl.split(',')[1];
	if (!base64Data) {
		return {
			valid: false,
			message: 'Invalid image data format',
		};
	}

	const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);

	if (sizeInBytes > VALIDATION_LIMITS.IMAGE_MAX_BYTES) {
		return {
			valid: false,
			message: `Image exceeds ${formatBytes(VALIDATION_LIMITS.IMAGE_MAX_BYTES)} limit (current size: ${formatBytes(sizeInBytes)})`,
		};
	}

	return { valid: true };
}


export function validatePendingImages(
	images?: Array<{ data: string; mimeType: string }>
): ValidationResult {
	if (!images || !Array.isArray(images)) {
		return { valid: true };
	}

	for (let i = 0; i < images.length; i++) {
		const result = validateImageSize(images[i].data);
		if (!result.valid) {
			return {
				valid: false,
				message: `Image ${i + 1}: ${result.message}`,
			};
		}
	}

	return { valid: true };
}


export function validatePendingCoverImage(image: { data: string; mimeType: string } | undefined): ValidationResult {
	if (!image) {
		return { valid: true };
	}

	return validateImageSize(image.data);
}
