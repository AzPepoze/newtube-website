export type ReportReason =
    "copyright" | "inappropriate" | "malware" | "broken" | "spam" | "other";

export type ReportStatus = "open" | "resolved" | "dismissed";

export type ReportResolutionStatus = Exclude<ReportStatus, "open">;
