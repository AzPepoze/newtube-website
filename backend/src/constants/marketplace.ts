import type {
    ReportReason,
    ReportResolutionStatus,
    ReportStatus,
} from "../types/marketplace";

export const REPORT_REASONS = [
    "copyright",
    "inappropriate",
    "malware",
    "broken",
    "spam",
    "other",
] as const satisfies readonly ReportReason[];

export const REPORT_STATUSES = [
    "open",
    "resolved",
    "dismissed",
] as const satisfies readonly ReportStatus[];

export const REPORT_RESOLUTION_STATUSES = [
    "resolved",
    "dismissed",
] as const satisfies readonly ReportResolutionStatus[];

export const THEME_CATEGORIES = [
    { id: "category-gaming", slug: "gaming", name: "Gaming" },
    {
        id: "category-entertainment",
        slug: "entertainment",
        name: "Entertainment",
    },
    { id: "category-music", slug: "music", name: "Music" },
    { id: "category-productivity", slug: "productivity", name: "Productivity" },
    { id: "category-education", slug: "education", name: "Education" },
    { id: "category-technology", slug: "technology", name: "Technology" },
    { id: "category-news", slug: "news", name: "News" },
    { id: "category-lifestyle", slug: "lifestyle", name: "Lifestyle" },
] as const;

export const THEME_TAGS = [
    { id: "tag-dark-mode", slug: "dark-mode", name: "Dark Mode" },
    { id: "tag-minimal", slug: "minimal", name: "Minimal" },
    { id: "tag-colorful", slug: "colorful", name: "Colorful" },
    { id: "tag-retro", slug: "retro", name: "Retro" },
    { id: "tag-anime", slug: "anime", name: "Anime" },
    { id: "tag-gaming", slug: "gaming", name: "Gaming" },
    { id: "tag-music", slug: "music", name: "Music" },
    { id: "tag-focus", slug: "focus", name: "Focus" },
    { id: "tag-accessibility", slug: "accessibility", name: "Accessibility" },
    { id: "tag-high-contrast", slug: "high-contrast", name: "High Contrast" },
    { id: "tag-oled", slug: "oled", name: "OLED" },
    { id: "tag-pastel", slug: "pastel", name: "Pastel" },
] as const;
