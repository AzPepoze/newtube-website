import { relations, sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('Users', {
	id: text('id').primaryKey(),
	email: text('email').notNull(),
	name: text('name').notNull(),
	avatarUrl: text('avatar_url'),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const themes = sqliteTable('Themes', {
	id: text('id').primaryKey(),
	ownerId: text('owner_id').references(() => users.id),
	name: text('name').notNull(),
	description: text('description'),
	images: text('images', { mode: 'json' }).$type<string[]>().default(sql`'[]'`),
	coverImage: text('cover_image'),
	settings: text('settings', { mode: 'json' }).$type<any>().default(sql`'{}'`),
	customStyleshift: text('custom_styleshift', { mode: 'json' }).$type<any[]>().default(sql`'[]'`),
	isPublic: integer('is_public', { mode: 'boolean' }).default(true),
	downloads: integer('downloads').default(0),
	createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const usersRelations = relations(users, ({ many }) => ({
	themes: many(themes),
}));

export const themesRelations = relations(themes, ({ one }) => ({
	owner: one(users, {
		fields: [themes.ownerId],
		references: [users.id],
	}),
}));

export type User = typeof users.$inferSelect;
export type Theme = typeof themes.$inferSelect;
