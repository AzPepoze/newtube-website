import type { Database } from "../db";
import { createSession, deleteSession } from "../db/sessions";
import { updateOrInsertUser } from "../db/users";
import { getGoogleAuthUrl, getGoogleUser } from "../utils/auth";

export function startGoogleAuthentication(
    env: Env,
    redirectUri: string,
    redirectTarget?: string,
) {
    return getGoogleAuthUrl(env, redirectUri, redirectTarget);
}

export async function completeGoogleAuthentication(
    db: Database,
    env: Env,
    code: string,
    redirectUri: string,
    redirectTarget?: string,
) {
    const googleUser = await getGoogleUser(env, code, redirectUri);
    console.log(
        `[Auth Callback] Successfully authenticated user: ${googleUser.email}`,
    );

    await updateOrInsertUser(db, {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatarUrl: googleUser.picture,
    });

    const sessionId = await createSession(db, googleUser.id);
    const frontendUrl = (env.FRONTEND_URL || "http://localhost:5173").trim();
    const frontend = new URL(frontendUrl);
    const targetPath = redirectTarget || "/discover";
    frontend.pathname = targetPath.startsWith("/")
        ? targetPath
        : `/${targetPath}`;
    frontend.searchParams.set("sessionId", sessionId);
    frontend.searchParams.set("userId", googleUser.id);

    return {
        sessionId,
        userId: googleUser.id,
        frontendUrl,
        redirectDestination: frontend.toString(),
    };
}

export function logoutUser(db: Database, sessionId?: string) {
    return typeof sessionId === "string"
        ? deleteSession(db, sessionId)
        : Promise.resolve();
}
