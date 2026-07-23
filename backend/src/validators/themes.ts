import type { Database } from "../db";
import type { ThemeInput } from "../services/themes";
import { findThemeTagsByNames } from "../db/marketplace";
import {
    validateBoolean,
    validatePendingCoverImage,
    validatePendingImages,
    validateSettingsJSON,
    validateTagNames,
    validateThemeDescription,
    validateThemeTitle,
} from "../utils/validation";
import { tagSlug } from "../utils/marketplace";

export function invalidMessage(result: { valid: boolean; message?: string }) {
    return result.message ?? "Invalid request";
}

export function parseDiscoverySlugs(value: unknown, label: string) {
    if (value === undefined || value === "") {
        return { valid: true as const, values: [] as string[] };
    }
    if (typeof value !== "string") {
        return {
            valid: false as const,
            message: `${label} must be a comma-separated list`,
        };
    }

    const rawValues = value.split(",").map((item) => item.trim());
    if (rawValues.length > 10 || rawValues.some((item) => item.length > 64)) {
        return {
            valid: false as const,
            message: `${label} accepts at most 10 values of 64 characters`,
        };
    }

    const values = [...new Set(rawValues.map(tagSlug).filter(Boolean))];
    if (values.length !== rawValues.length) {
        return {
            valid: false as const,
            message: `${label} values must contain letters or numbers`,
        };
    }
    return { valid: true as const, values };
}

export async function validateThemeInput(
    db: Database,
    body: unknown,
): Promise<
    { input: ThemeInput; message?: never } | { input?: never; message: string }
> {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { message: "Request body must be an object" };
    }
    const themeInput = body as ThemeInput;
    const validations = [
        validateThemeTitle(themeInput.themeName),
        validateThemeDescription(themeInput.description),
        validatePendingImages(themeInput.pendingImages),
        validatePendingCoverImage(themeInput.pendingCoverImage),
        validateSettingsJSON(themeInput.settings),
    ];
    if (themeInput.isPublic !== undefined) {
        validations.push(validateBoolean(themeInput.isPublic, "isPublic"));
    }
    if (themeInput.tagNames !== undefined) {
        validations.push(validateTagNames(themeInput.tagNames));
    }
    const totalScreenshots =
        (themeInput.imgs?.length ?? 0) +
        (themeInput.pendingImages?.length ?? 0);
    if (totalScreenshots > 5) {
        return { message: "Theme can have at most 5 screenshots" };
    }

    const failed = validations.find((result) => !result.valid);
    if (failed && !failed.valid) return { message: failed.message };

    if (themeInput.tagNames) {
        const selectedTags = await findThemeTagsByNames(
            db,
            themeInput.tagNames,
        );
        if (selectedTags.length !== themeInput.tagNames.length) {
            return { message: "Tags must be selected from the available tags" };
        }
    }

    return { input: themeInput };
}
