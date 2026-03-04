import { eq } from 'drizzle-orm';
import { sessions } from './schema';
import type { Database } from './index';

export async function createSession(db: Database, userId: string): Promise<string> {
    const sessionId = crypto.randomUUID();
    // Session expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await db.insert(sessions).values({
        id: sessionId,
        userId,
        expiresAt,
    });

    return sessionId;
}

export async function getSession(db: Database, sessionId: string) {
    const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .get();

    if (!session) return null;

    // Check if expired
    if (new Date(session.expiresAt) < new Date()) {
        await deleteSession(db, sessionId);
        return null;
    }

    return session;
}

export async function deleteSession(db: Database, sessionId: string) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
}
