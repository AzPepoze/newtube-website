export function normalizeTagName(name: string) {
    return name.trim().replace(/\s+/g, " ").toLowerCase();
}

export function tagSlug(name: string) {
    return normalizeTagName(name)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
