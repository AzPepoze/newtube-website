import { and, eq } from "drizzle-orm";
import { themes, users } from "./schema";
import type { Database } from "./index";

export function getUserById(db: Database, userId: string) {
    return db
        .select({
            id: users.id,
            name: users.name,
            avatarUrl: users.avatarUrl,
            createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .get();
}

export function getUserProfile(
    db: Database,
    userId: string,
    { includeDrafts = false }: { includeDrafts?: boolean } = {},
) {
    return Promise.all([
        db
            .select({
                id: users.id,
                name: users.name,
                avatarUrl: users.avatarUrl,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .get(),
        db
            .select()
            .from(themes)
            .where(
                includeDrafts
                    ? eq(themes.ownerId, userId)
                    : and(
                          eq(themes.ownerId, userId),
                          eq(themes.isPublic, true),
                      ),
            )
            .all(),
    ]);
}

export function updateOrInsertUser(
    db: Database,
    userInput: { id: string; email: string; name: string; avatarUrl: string },
) {
    return db
        .insert(users)
        .values({
            id: userInput.id,
            email: userInput.email,
            name: userInput.name,
            avatarUrl: userInput.avatarUrl,
        })
        .onConflictDoUpdate({
            target: users.id,
            set: { name: userInput.name, avatarUrl: userInput.avatarUrl },
        });
}
