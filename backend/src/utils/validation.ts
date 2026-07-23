import { VALIDATION_LIMITS, formatBytes } from "shared";

export interface ValidationError {
    valid: false;
    message: string;
}

export interface ValidationSuccess {
    valid: true;
}

export type ValidationResult = ValidationSuccess | ValidationError;

const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validateUuid(value: unknown, label = "ID"): ValidationResult {
    if (typeof value !== "string" || !UUID_PATTERN.test(value)) {
        return { valid: false, message: `${label} must be a valid ID` };
    }
    return { valid: true };
}

export function validateText(
    value: unknown,
    label: string,
    {
        min = 0,
        max,
        required = false,
    }: { min?: number; max: number; required?: boolean },
): ValidationResult {
    if (value === undefined || value === null) {
        return required
            ? { valid: false, message: `${label} is required` }
            : { valid: true };
    }
    if (typeof value !== "string") {
        return { valid: false, message: `${label} must be text` };
    }
    const trimmed = value.trim();
    if ((required && !trimmed) || trimmed.length < min) {
        return { valid: false, message: `${label} is too short` };
    }
    if (trimmed.length > max) {
        return { valid: false, message: `${label} exceeds ${max} characters` };
    }
    return { valid: true };
}

export function validateBoolean(
    value: unknown,
    label: string,
): ValidationResult {
    return typeof value === "boolean"
        ? { valid: true }
        : { valid: false, message: `${label} must be true or false` };
}

export function validateEnum<T extends string>(
    value: unknown,
    allowed: readonly T[],
    label: string,
): ValidationResult {
    return typeof value === "string" && allowed.includes(value as T)
        ? { valid: true }
        : { valid: false, message: `${label} is invalid` };
}

export function validateRating(value: unknown): ValidationResult {
    return typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= 5
        ? { valid: true }
        : { valid: false, message: "Rating must be an integer from 1 to 5" };
}

export function validateTagNames(value: unknown): ValidationResult {
    if (!Array.isArray(value) || value.length > 10) {
        return { valid: false, message: "Provide at most 10 tags" };
    }
    const normalized = new Set<string>();
    for (const tag of value) {
        if (typeof tag !== "string") {
            return { valid: false, message: "Tags must be text" };
        }
        const normalizedTag = tag.trim().replace(/\s+/g, " ").toLowerCase();
        if (
            !normalizedTag ||
            normalizedTag.length > 32 ||
            !/[a-z0-9]/i.test(normalizedTag)
        ) {
            return {
                valid: false,
                message: "Each tag must be 1–32 letters or numbers",
            };
        }
        if (normalized.has(normalizedTag)) {
            return { valid: false, message: "Tags must be unique" };
        }
        normalized.add(normalizedTag);
    }
    return { valid: true };
}

export function parsePagination(
    value: { limit?: unknown; offset?: unknown },
    defaults: { limit?: number; maxLimit?: number } = {},
): { valid: true; limit: number; offset: number } | ValidationError {
    const limit =
        value.limit === undefined
            ? (defaults.limit ?? 24)
            : Number(value.limit);
    const offset = value.offset === undefined ? 0 : Number(value.offset);
    const maxLimit = defaults.maxLimit ?? 100;
    if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
        return {
            valid: false,
            message: `limit must be an integer from 1 to ${maxLimit}`,
        };
    }
    if (!Number.isInteger(offset) || offset < 0 || offset > 100_000) {
        return {
            valid: false,
            message: "offset must be an integer from 0 to 100000",
        };
    }
    return { valid: true, limit, offset };
}

export function validateThemeTitle(title: string): ValidationResult {
    const trimmed = title?.trim() ?? "";

    if (!trimmed) {
        return {
            valid: false,
            message: "Title is required",
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

export function validateThemeDescription(
    description: string | undefined,
): ValidationResult {
    const desc = description ?? "";

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
            message: "Settings must be a valid JSON object",
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

const ALLOWED_IMAGE_MIMES = [
    "image/webp",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/gif",
];

export function validateImageSize(
    dataUrl: string,
    mimeType?: string,
): ValidationResult {
    if (!dataUrl || typeof dataUrl !== "string") {
        return { valid: false, message: "Image data is required" };
    }

    if (mimeType && !ALLOWED_IMAGE_MIMES.includes(mimeType.toLowerCase())) {
        return {
            valid: false,
            message: `Unsupported image type (${mimeType}). Allowed: WebP, PNG, JPEG, GIF`,
        };
    }

    const base64Data = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
    if (!base64Data || !base64Data.trim()) {
        return {
            valid: false,
            message: "Invalid image base64 encoding",
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
    images?: Array<{ data: string; mimeType: string }>,
): ValidationResult {
    if (!images || !Array.isArray(images)) {
        return { valid: true };
    }

    if (images.length > 5) {
        return {
            valid: false,
            message: "A theme can have at most 5 screenshot images",
        };
    }

    for (let i = 0; i < images.length; i++) {
        const item = images[i];
        if (!item || typeof item.data !== "string") {
            return {
                valid: false,
                message: `Screenshot ${i + 1}: Invalid image data`,
            };
        }
        const result = validateImageSize(item.data, item.mimeType);
        if (!result.valid) {
            return {
                valid: false,
                message: `Screenshot ${i + 1}: ${result.message}`,
            };
        }
    }

    return { valid: true };
}

export function validatePendingCoverImage(
    image: { data: string; mimeType: string } | undefined,
): ValidationResult {
    if (!image) {
        return { valid: true };
    }

    if (!image.data || typeof image.data !== "string") {
        return { valid: false, message: "Cover image: Invalid image data" };
    }

    const result = validateImageSize(image.data, image.mimeType);
    if (!result.valid) {
        return {
            valid: false,
            message: `Cover image: ${result.message}`,
        };
    }

    return { valid: true };
}
