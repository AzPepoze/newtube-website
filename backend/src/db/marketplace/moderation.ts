import { desc, eq, sql } from "drizzle-orm";
import type { Database } from "../index";
import { themeReports, themes, users } from "../schema";
import type {
    ReportResolutionStatus,
    ReportStatus,
} from "../../types/marketplace";

export async function createThemeReport(
    db: Database,
    data: {
        themeId: string;
        reporterId: string;
        reason: string;
        details?: string;
    },
) {
    const id = crypto.randomUUID();
    await db.insert(themeReports).values({ id, ...data });
    return db.select().from(themeReports).where(eq(themeReports.id, id)).get();
}

export function getReportsForReporter(db: Database, reporterId: string) {
    return db
        .select()
        .from(themeReports)
        .where(eq(themeReports.reporterId, reporterId))
        .orderBy(desc(themeReports.createdAt))
        .all();
}

export function listModerationReports(
    db: Database,
    {
        status,
        limit = 50,
        offset = 0,
    }: { status?: ReportStatus; limit?: number; offset?: number } = {},
) {
    const query = db
        .select({
            id: themeReports.id,
            reason: themeReports.reason,
            details: themeReports.details,
            status: themeReports.status,
            createdAt: themeReports.createdAt,
            updatedAt: themeReports.updatedAt,
            resolvedAt: themeReports.resolvedAt,
            theme: {
                themeId: themes.themeId,
                themeName: themes.themeName,
                isPublic: themes.isPublic,
            },
            reporter: {
                id: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl,
            },
        })
        .from(themeReports)
        .innerJoin(themes, eq(themeReports.themeId, themes.themeId))
        .innerJoin(users, eq(themeReports.reporterId, users.id));

    return (status ? query.where(eq(themeReports.status, status)) : query)
        .orderBy(desc(themeReports.createdAt))
        .limit(limit)
        .offset(offset)
        .all();
}

export function resolveThemeReport(
    db: Database,
    data: {
        reportId: string;
        adminId: string;
        status: ReportResolutionStatus;
    },
) {
    return db
        .update(themeReports)
        .set({
            status: data.status,
            resolvedBy: data.adminId,
            resolvedAt: sql`CURRENT_TIMESTAMP`,
            updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(themeReports.id, data.reportId))
        .run();
}

export function isUserAdmin(db: Database, userId: string) {
    return db
        .select({ isAdmin: users.isAdmin })
        .from(users)
        .where(eq(users.id, userId))
        .get()
        .then((user) => user?.isAdmin === true)
        .catch((error) => {
            const message =
                error instanceof Error ? error.message : String(error);
            if (/no such column/i.test(message) && /is_admin/i.test(message)) {
                console.warn(
                    "Users.is_admin is unavailable; treating the session as non-admin until the legacy D1 migration is applied.",
                );
                return false;
            }
            throw error;
        });
}

export function setUserAdmin(db: Database, userId: string, isAdmin: boolean) {
    return db.update(users).set({ isAdmin }).where(eq(users.id, userId)).run();
}

export function setThemeVisibility(
    db: Database,
    themeId: string,
    isPublic: boolean,
) {
    return db
        .update(themes)
        .set({ isPublic, updatedAt: sql`CURRENT_TIMESTAMP` })
        .where(eq(themes.themeId, themeId))
        .run();
}
