import type { Theme } from "$lib/types/index";
import { PUBLIC_API_URL } from "$lib/constants/index";

export interface ParsedThemeResult {
	theme: Theme | null;
	source: "id" | "setting" | "data" | "none";
	error?: string;
}

/**
 * Normalizes any incoming data or settings object into a complete Theme interface.
 */
export function normalizeThemePayload(data: any, fallbackId = "preview-theme"): Theme {
	if (!data || typeof data !== "object") {
		return {
			themeId: fallbackId,
			ownerId: "preview-user",
			themeName: "Untitled Theme",
			description: "Preview theme settings",
			images: [],
			settings: {},
			downloads: 0,
		};
	}

	// If payload is wrapped inside a settings container or raw settings
	const rawSettings = data.settings || data.currentSettings ? data.settings || { currentSettings: data.currentSettings, addOnStyleShiftItems: data.addOnStyleShiftItems } : data;

	return {
		themeId: data.themeId || data.id || fallbackId,
		ownerId: data.ownerId || "preview-user",
		themeName: data.themeName || data.name || "Preview Theme",
		description: data.description || "Previewing custom theme configuration.",
		images: Array.isArray(data.images) ? data.images : [],
		coverImage: data.coverImage || data.previewImage || undefined,
		settings: rawSettings,
		downloads: typeof data.downloads === "number" ? data.downloads : 0,
		tags: Array.isArray(data.tags) ? data.tags : [],
		rating: typeof data.rating === "number" ? data.rating : null,
		ratingCount: typeof data.ratingCount === "number" ? data.ratingCount : 0,
		createdAt: data.createdAt,
		updatedAt: data.updatedAt,
	};
}

/**
 * Encodes theme settings or theme object into a web-safe Base64 string for URL sharing.
 */
export function encodeThemeToBase64(data: any): string {
	try {
		const jsonString = JSON.stringify(data);
		return btoa(encodeURIComponent(jsonString));
	} catch {
		return "";
	}
}

/**
 * Decodes a Base64 encoded string into a theme settings object.
 */
export function decodeThemeFromBase64(base64Str: string): any {
	try {
		const jsonString = decodeURIComponent(atob(base64Str));
		return JSON.parse(jsonString);
	} catch {
		// Fallback: direct atob without URI component decoding
		try {
			return JSON.parse(atob(base64Str));
		} catch {
			return null;
		}
	}
}

/**
 * Parses theme data from URL search parameters or fetches via theme ID.
 */
export async function parseThemeFromUrl(
	searchParams: URLSearchParams,
	fetchFn: typeof fetch = fetch,
): Promise<ParsedThemeResult> {
	const themeId = searchParams.get("id") || searchParams.get("themeId");
	const rawSettingParam = searchParams.get("setting") || searchParams.get("config");
	const dataBase64Param = searchParams.get("data");

	// 1. Theme ID provided
	if (themeId) {
		try {
			const res = await fetchFn(`${PUBLIC_API_URL}/themes/${themeId}`, {
				credentials: "include",
			});
			if (res.ok) {
				const fetchedData = await res.json();
				return {
					theme: normalizeThemePayload(fetchedData, themeId),
					source: "id",
				};
			} else {
				const errData = await res.json().catch(() => ({}));
				return {
					theme: null,
					source: "id",
					error: errData.message || errData.error || `Theme with ID "${themeId}" not found.`,
				};
			}
		} catch (err) {
			return {
				theme: null,
				source: "id",
				error: err instanceof Error ? err.message : "Failed to fetch theme by ID.",
			};
		}
	}

	// 2. Base64 data param provided
	if (dataBase64Param) {
		const decoded = decodeThemeFromBase64(dataBase64Param);
		if (decoded) {
			return {
				theme: normalizeThemePayload(decoded, "base64-theme"),
				source: "data",
			};
		} else {
			return {
				theme: null,
				source: "data",
				error: "Failed to decode base64 theme data parameter.",
			};
		}
	}

	// 3. Raw URL encoded JSON setting param provided
	if (rawSettingParam) {
		try {
			const parsed = JSON.parse(rawSettingParam);
			return {
				theme: normalizeThemePayload(parsed, "custom-setting-theme"),
				source: "setting",
			};
		} catch {
			return {
				theme: null,
				source: "setting",
				error: "Invalid JSON format in 'setting' URL parameter.",
			};
		}
	}

	return {
		theme: null,
		source: "none",
	};
}
