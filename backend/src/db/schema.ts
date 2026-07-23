import { desc, relations, sql } from "drizzle-orm";
import {
    check,
    index,
    integer,
    primaryKey,
    sqliteTable,
    text,
    unique,
} from "drizzle-orm/sqlite-core";

export type TagSnapshot = { id: string; slug: string; name: string };

export const users = sqliteTable("Users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable(
    "Sessions",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [index("idx_sessions_user").on(table.userId)],
);

export const themes = sqliteTable(
    "Themes",
    {
        themeId: text("theme_id").primaryKey(),
        ownerId: text("owner_id")
            .notNull()
            .references(() => users.id),
        themeName: text("theme_name").notNull(),
        description: text("description"),
        images: text("images", { mode: "json" })
            .$type<string[]>()
            .default(sql`'[]'`),
        coverImage: text("cover_image"),
        settings: text("settings", { mode: "json" })
            .$type<any>()
            .notNull()
            .default(sql`'{}'`),
        isPublic: integer("is_public", { mode: "boolean" }).default(true),
        downloads: integer("downloads").default(0),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
        updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [
        index("idx_themes_owner").on(table.ownerId),
        index("idx_themes_public").on(table.isPublic),
    ],
);

export const uploads = sqliteTable(
    "Uploads",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => users.id),
        url: text("url").notNull(),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [index("idx_uploads_user").on(table.userId)],
);

export const tags = sqliteTable("Tags", {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    groupName: text("group_name").notNull().default("General"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const themeTags = sqliteTable(
    "ThemeTags",
    {
        themeId: text("theme_id")
            .notNull()
            .references(() => themes.themeId, { onDelete: "cascade" }),
        tagId: text("tag_id")
            .notNull()
            .references(() => tags.id, { onDelete: "cascade" }),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [
        primaryKey({ columns: [table.themeId, table.tagId] }),
        index("idx_theme_tags_tag").on(table.tagId),
    ],
);

export const themeVersions = sqliteTable(
    "ThemeVersions",
    {
        id: text("id").primaryKey(),
        themeId: text("theme_id")
            .notNull()
            .references(() => themes.themeId, { onDelete: "cascade" }),
        versionNumber: integer("version_number").notNull(),
        themeName: text("theme_name").notNull(),
        description: text("description"),
        images: text("images", { mode: "json" }).$type<string[]>(),
        coverImage: text("cover_image"),
        settings: text("settings", { mode: "json" }).$type<unknown>().notNull(),
        isPublic: integer("is_public", { mode: "boolean" }).notNull(),
        tags: text("tags", {
            mode: "json",
        })
            .$type<TagSnapshot[]>()
            .notNull()
            .default(sql`'[]'`),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [
        unique("theme_versions_theme_version_unique").on(
            table.themeId,
            table.versionNumber,
        ),
        index("idx_theme_versions_theme").on(
            table.themeId,
            desc(table.versionNumber),
        ),
    ],
);

export const reviews = sqliteTable(
    "Reviews",
    {
        id: text("id").primaryKey(),
        themeId: text("theme_id")
            .notNull()
            .references(() => themes.themeId, { onDelete: "cascade" }),
        userId: text("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        rating: integer("rating").notNull(),
        body: text("body"),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
        updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [
        check("reviews_rating_range", sql`${table.rating} BETWEEN 1 AND 5`),
        unique("reviews_theme_user_unique").on(table.themeId, table.userId),
        index("idx_reviews_theme").on(table.themeId, desc(table.createdAt)),
        index("idx_reviews_user").on(table.userId, desc(table.createdAt)),
    ],
);

export const themeReports = sqliteTable(
    "ThemeReports",
    {
        id: text("id").primaryKey(),
        themeId: text("theme_id")
            .notNull()
            .references(() => themes.themeId, { onDelete: "cascade" }),
        reporterId: text("reporter_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        reason: text("reason").notNull(),
        details: text("details"),
        status: text("status", {
            enum: ["open", "resolved", "dismissed"],
        })
            .notNull()
            .default("open"),
        resolvedBy: text("resolved_by").references(() => users.id, {
            onDelete: "set null",
        }),
        resolvedAt: text("resolved_at"),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
        updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [
        check(
            "theme_reports_status",
            sql`${table.status} IN ('open', 'resolved', 'dismissed')`,
        ),
        index("idx_theme_reports_reporter").on(
            table.reporterId,
            desc(table.createdAt),
        ),
        index("idx_theme_reports_moderation").on(
            table.status,
            desc(table.createdAt),
        ),
    ],
);

export const usersRelations = relations(users, ({ many }) => ({
    themes: many(themes),
    sessions: many(sessions),
    uploads: many(uploads),
    reviews: many(reviews),
    reports: many(themeReports, { relationName: "reporter" }),
    resolvedReports: many(themeReports, { relationName: "resolver" }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const uploadsRelations = relations(uploads, ({ one }) => ({
    user: one(users, {
        fields: [uploads.userId],
        references: [users.id],
    }),
}));

export const themesRelations = relations(themes, ({ one, many }) => ({
    owner: one(users, {
        fields: [themes.ownerId],
        references: [users.id],
    }),
    tagLinks: many(themeTags),
    versions: many(themeVersions),
    reviews: many(reviews),
    reports: many(themeReports),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    themeLinks: many(themeTags),
}));

export const themeTagsRelations = relations(themeTags, ({ one }) => ({
    theme: one(themes, {
        fields: [themeTags.themeId],
        references: [themes.themeId],
    }),
    tag: one(tags, {
        fields: [themeTags.tagId],
        references: [tags.id],
    }),
}));

export const themeVersionsRelations = relations(themeVersions, ({ one }) => ({
    theme: one(themes, {
        fields: [themeVersions.themeId],
        references: [themes.themeId],
    }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    theme: one(themes, {
        fields: [reviews.themeId],
        references: [themes.themeId],
    }),
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
}));

export const themeReportsRelations = relations(themeReports, ({ one }) => ({
    theme: one(themes, {
        fields: [themeReports.themeId],
        references: [themes.themeId],
    }),
    reporter: one(users, {
        relationName: "reporter",
        fields: [themeReports.reporterId],
        references: [users.id],
    }),
    resolver: one(users, {
        relationName: "resolver",
        fields: [themeReports.resolvedBy],
        references: [users.id],
    }),
}));

export type User = typeof users.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
