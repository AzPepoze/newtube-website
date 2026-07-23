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
