export const VALIDATION_LIMITS = {
    TITLE_MAX: 100,
    DESCRIPTION_MAX: 10000,
    SETTINGS_JSON_MAX: 1000 * 1024,
    IMAGE_MAX_BYTES: 5 * 1024 * 1024,
};

export function formatBytes(bytes: number): string {
    if (bytes === 0) return "0 B";

    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    if (i === 0) return bytes + " B";
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
