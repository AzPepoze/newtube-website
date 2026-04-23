import { VALIDATION_LIMITS, formatBytes } from 'shared';

const TITLE_MAX = VALIDATION_LIMITS.TITLE_MAX;
const DESCRIPTION_MAX = VALIDATION_LIMITS.DESCRIPTION_MAX;
const SETTINGS_JSON_MAX = VALIDATION_LIMITS.SETTINGS_JSON_MAX;

export interface ValidationResult {
	valid: boolean;
	message?: string;
}

export interface JsonValidationResult extends ValidationResult {
	sizeInBytes: number;
}

export function validateTitle(text: string): ValidationResult {
	const trimmed = text.trim();

	if (!trimmed) {
		return {
			valid: false,
			message: 'Title is required',
		};
	}

	if (trimmed.length > TITLE_MAX) {
		return {
			valid: false,
			message: `Title exceeds ${TITLE_MAX} character limit`,
		};
	}

	return { valid: true };
}

export function validateDescription(text: string): ValidationResult {
	if (text.length > DESCRIPTION_MAX) {
		return {
			valid: false,
			message: `Description exceeds ${DESCRIPTION_MAX} character limit`,
		};
	}

	return { valid: true };
}

export function validateSettingsJSON(jsonString: string): JsonValidationResult {
	let parsed: any;

	try {
		parsed = JSON.parse(jsonString);
	} catch (e) {
		return {
			valid: false,
			sizeInBytes: 0,
			message: 'Invalid JSON syntax',
		};
	}

	// Calculate the actual size in bytes when stringified
	const stringified = JSON.stringify(parsed);
	const sizeInBytes = new Blob([stringified]).size;

	if (sizeInBytes > SETTINGS_JSON_MAX) {
		return {
			valid: false,
			sizeInBytes,
			message: `Settings JSON exceeds ${formatBytes(SETTINGS_JSON_MAX)} limit`,
		};
	}

	return {
		valid: true,
		sizeInBytes,
	};
}

export const LIMITS = {
	title: TITLE_MAX,
	description: DESCRIPTION_MAX,
	settingsJson: SETTINGS_JSON_MAX,
};

export { formatBytes };
