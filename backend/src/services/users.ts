import type { Database } from "../db";
import { getUserReviewActivity, isUserAdmin } from "../db/marketplace";
import { getUserById, getUserProfile } from "../db/users";

export async function getProfileForViewer(
    db: Database,
    targetUserId: string,
    viewerId?: string,
) {
    const viewerIsAdmin = viewerId ? await isUserAdmin(db, viewerId) : false;
    const mayViewDrafts = viewerId === targetUserId || viewerIsAdmin;
    const [user, userThemes] = await getUserProfile(db, targetUserId, {
        includeDrafts: mayViewDrafts,
    });
    if (!user) return null;

    const profile = {
        user,
        themes: userThemes.filter((theme) => theme.isPublic),
    };
    if (!mayViewDrafts) {
        return {
            ...profile,
            reviews: await getUserReviewActivity(db, targetUserId),
        };
    }

    return {
        ...profile,
        reviews: await getUserReviewActivity(db, targetUserId, {
            includePrivateThemes: true,
        }),
        drafts: userThemes.filter((theme) => !theme.isPublic),
    };
}

export async function getCurrentUser(db: Database, userId: string) {
    const user = await getUserById(db, userId);
    if (!user) return null;

    return { ...user, isAdmin: await isUserAdmin(db, userId) };
}
