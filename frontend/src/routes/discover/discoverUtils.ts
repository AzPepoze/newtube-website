import type { Theme } from "$lib/types/index";

export function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export function asOffset(value: string | null): number {
    const parsed = Number.parseInt(value ?? "0", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function parseFilterValues(value: string | null): string[] {
    return value
        ? [...new Set(value.split(",").map(slugify).filter(Boolean))]
        : [];
}

export function buildSearchParams(
    searchQuery: string,
    sortBy: string,
    selectedTags: string[],
    pageSize: number,
    offset: number,
): URLSearchParams {
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (sortBy !== "popular") params.set("sort", sortBy);
    if (selectedTags.length) params.set("tag", selectedTags.join(","));
    params.set("limit", String(pageSize));
    if (offset > 0) params.set("offset", String(offset));
    return params;
}

export function matchesLegacyFilters(
    theme: Theme,
    selectedTags: string[],
): boolean {
    const tags = new Set(selectedTags);
    return (
        !tags.size ||
        (theme.tags ?? []).some((value) => tags.has(slugify(value)))
    );
}
