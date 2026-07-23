import { relations, sql } from "drizzle-orm";
import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export type TagSnapshot = { id: string; slug: string; name: string };
export type CategorySnapshot = { id: string; slug: string; name: string };

export const users = sqliteTable("Users", {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    avatarUrl: text("avatar_url"),
    isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const sessions = sqliteTable("Sessions", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const themes = sqliteTable("Themes", {
    themeId: text("theme_id").primaryKey(),
    ownerId: text("owner_id").references(() => users.id),
    themeName: text("theme_name").notNull(),
    description: text("description"),
    images: text("images", { mode: "json" })
        .$type<string[]>()
        .default(sql`'[]'`),
    coverImage: text("cover_image"),
    settings: text("settings", { mode: "json" })
        .$type<any>()
        .default(sql`'{}'`),
    isPublic: integer("is_public", { mode: "boolean" }).default(true),
    downloads: integer("downloads").default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const categories = sqliteTable("Categories", {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const tags = sqliteTable("Tags", {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
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
    (table) => [primaryKey({ columns: [table.themeId, table.tagId] })],
);

export const themeCategories = sqliteTable("ThemeCategories", {
    themeId: text("theme_id")
        .primaryKey()
        .references(() => themes.themeId, { onDelete: "cascade" }),
    categoryId: text("category_id")
        .notNull()
        .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const themeVersions = sqliteTable("ThemeVersions", {
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
    tags: text("tags", { mode: "json" }).$type<TagSnapshot[]>().notNull(),
    category: text("category", { mode: "json" }).$type<CategorySnapshot | null>(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const reviews = sqliteTable("Reviews", {
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
});

export const themeReports = sqliteTable("ThemeReports", {
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
});

export const collections = sqliteTable("Collections", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const collectionItems = sqliteTable(
    "CollectionItems",
    {
        collectionId: text("collection_id")
            .notNull()
            .references(() => collections.id, { onDelete: "cascade" }),
        themeId: text("theme_id")
            .notNull()
            .references(() => themes.themeId, { onDelete: "cascade" }),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => [primaryKey({ columns: [table.collectionId, table.themeId] })],
);

export const usersRelations = relations(users, ({ many }) => ({
    themes: many(themes),
    sessions: many(sessions),
    reviews: many(reviews),
    reports: many(themeReports, { relationName: "reporter" }),
    resolvedReports: many(themeReports, { relationName: "resolver" }),
    collections: many(collections),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
    user: one(users, {
        fields: [sessions.userId],
        references: [users.id],
    }),
}));

export const themesRelations = relations(themes, ({ one, many }) => ({
    owner: one(users, {
        fields: [themes.ownerId],
        references: [users.id],
    }),
    tagLinks: many(themeTags),
    categoryLink: one(themeCategories),
    versions: many(themeVersions),
    reviews: many(reviews),
    reports: many(themeReports),
    collectionItems: many(collectionItems),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
    themeLinks: many(themeTags),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
    themeLinks: many(themeCategories),
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

export const themeCategoriesRelations = relations(themeCategories, ({ one }) => ({
    theme: one(themes, {
        fields: [themeCategories.themeId],
        references: [themes.themeId],
    }),
    category: one(categories, {
        fields: [themeCategories.categoryId],
        references: [categories.id],
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

export const collectionsRelations = relations(collections, ({ one, many }) => ({
    user: one(users, {
        fields: [collections.userId],
        references: [users.id],
    }),
    items: many(collectionItems),
}));

export const collectionItemsRelations = relations(collectionItems, ({ one }) => ({
    collection: one(collections, {
        fields: [collectionItems.collectionId],
        references: [collections.id],
    }),
    theme: one(themes, {
        fields: [collectionItems.themeId],
        references: [themes.themeId],
    }),
}));

export type User = typeof users.$inferSelect;
export type Theme = typeof themes.$inferSelect;
export type Session = typeof sessions.$inferSelect;
