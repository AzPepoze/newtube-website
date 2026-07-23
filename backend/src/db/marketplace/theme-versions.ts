import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../index";
import { themes, themeVersions, type TagSnapshot } from "../schema";
import { getThemeClassification } from "./theme-classification";

export async function createThemeVersion(db: Database, themeId: string) {
    const theme = await db
        .select()
        .from(themes)
        .where(eq(themes.themeId, themeId))
        .get();
    if (!theme) return null;

    const [classification, latestVersion] = await Promise.all([
        getThemeClassification(db, themeId),
        db
            .select({
                latest: sql<number | null>`MAX(${themeVersions.versionNumber})`,
            })
            .from(themeVersions)
            .where(eq(themeVersions.themeId, themeId))
            .get(),
    ]);

    const versionNumber = Number(latestVersion?.latest ?? 0) + 1;
    const versionId = crypto.randomUUID();
    await db.insert(themeVersions).values({
        id: versionId,
        themeId,
        versionNumber,
        themeName: theme.themeName,
        description: theme.description,
        images: theme.images ?? [],
        coverImage: theme.coverImage,
        settings: theme.settings ?? {},
        isPublic: theme.isPublic ?? true,
        tags: classification.tags satisfies TagSnapshot[],
    });

    return db
        .select()
        .from(themeVersions)
        .where(eq(themeVersions.id, versionId))
        .get();
}

export function listThemeVersions(
    db: Database,
    themeId: string,
    { includeDrafts = false }: { includeDrafts?: boolean } = {},
) {
    const query = db
        .select()
        .from(themeVersions)
        .where(
            includeDrafts
                ? eq(themeVersions.themeId, themeId)
                : and(
                      eq(themeVersions.themeId, themeId),
                      eq(themeVersions.isPublic, true),
                  ),
        )
        .orderBy(desc(themeVersions.versionNumber));
    return query.all();
}

export function getThemeVersion(
    db: Database,
    themeId: string,
    versionNumber: number,
    { includeDrafts = false }: { includeDrafts?: boolean } = {},
) {
    return db
        .select()
        .from(themeVersions)
        .where(
            and(
                eq(themeVersions.themeId, themeId),
                eq(themeVersions.versionNumber, versionNumber),
                ...(includeDrafts ? [] : [eq(themeVersions.isPublic, true)]),
            ),
        )
        .get();
}
