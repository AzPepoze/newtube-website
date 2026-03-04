import { eq } from 'drizzle-orm';
import { themes, users } from './schema';
import type { Database } from './index';

export function getUserById(db: Database, id: string) {
	return db
		.select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
		.from(users)
		.where(eq(users.id, id))
		.get();
}

export function getUserProfile(db: Database, userId: string) {
	return Promise.all([
		db.select({ name: users.name, avatarUrl: users.avatarUrl, createdAt: users.createdAt })
			.from(users).where(eq(users.id, userId)).get(),
		db.select().from(themes).where(eq(themes.ownerId, userId)).all(),
	]);
}

export function updateOrInsertUser(db: Database, data: { id: string; email: string; name: string; avatarUrl: string }) {
	return db
		.insert(users)
		.values({ id: data.id, email: data.email, name: data.name, avatarUrl: data.avatarUrl })
		.onConflictDoUpdate({
			target: users.id,
			set: { name: data.name, avatarUrl: data.avatarUrl },
		});
}
