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

export const THEME_TAGS = [
    // Theme & Aesthetic
    {
        id: "tag-dark",
        slug: "dark",
        name: "Dark",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-light",
        slug: "light",
        name: "Light",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-oled",
        slug: "oled",
        name: "OLED",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-minimal",
        slug: "minimal",
        name: "Minimal",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-cyber",
        slug: "cyber",
        name: "Cyber",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-anime",
        slug: "anime",
        name: "Anime",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-gaming",
        slug: "gaming",
        name: "Gaming",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-music",
        slug: "music",
        name: "Music",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-retro",
        slug: "retro",
        name: "Retro",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-neon",
        slug: "neon",
        name: "Neon",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-nature",
        slug: "nature",
        name: "Nature",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-pastel",
        slug: "pastel",
        name: "Pastel",
        groupName: "Theme & Aesthetic",
    },
    {
        id: "tag-vaporwave",
        slug: "vaporwave",
        name: "Vaporwave",
        groupName: "Theme & Aesthetic",
    },

    // Colors
    { id: "tag-purple", slug: "purple", name: "Purple", groupName: "Color" },
    { id: "tag-blue", slug: "blue", name: "Blue", groupName: "Color" },
    { id: "tag-red", slug: "red", name: "Red", groupName: "Color" },
    { id: "tag-pink", slug: "pink", name: "Pink", groupName: "Color" },
    { id: "tag-green", slug: "green", name: "Green", groupName: "Color" },

    // Layout & Utility
    {
        id: "tag-compact",
        slug: "compact",
        name: "Compact",
        groupName: "Layout & Utility",
    },
    {
        id: "tag-distraction-free",
        slug: "distraction-free",
        name: "Distraction Free",
        groupName: "Layout & Utility",
    },
    {
        id: "tag-high-contrast",
        slug: "high-contrast",
        name: "High Contrast",
        groupName: "Layout & Utility",
    },
] as const;
