import type { Database } from "../db";
import {
    completeGoogleAuthentication,
    logoutUser,
    startGoogleAuthentication,
} from "../services/auth";
import type { ResponseStatus } from "../types/http";

type AuthContext = {
    db: Database;
    env: Env;
    query: Record<string, unknown>;
    request: Request;
    set: ResponseStatus;
    cookie: any;
    redirect: (url: string) => unknown;
};

function getRedirectUri(request: Request) {
    const url = new URL(request.url);
    const protocol = url.hostname.includes("localhost") ? url.protocol : "https:";
    return `${protocol}//${url.host}/auth/callback`;
}

export const authController = {
    async google({ query, request, redirect, env }: AuthContext) {
        const redirectUri = getRedirectUri(request);
        console.log(`[Auth] Starting Google OAuth. Redirect URI: ${redirectUri}`);
        const authUrl = await startGoogleAuthentication(
            env,
            redirectUri,
            query.redirect as string,
        );
        return redirect(authUrl);
    },

    async callback({ request, query, redirect, set, cookie, env, db }: AuthContext) {
        const code = query.code as string;
        if (!code) {
            console.error("[Auth Callback] Missing code in query params");
            set.status = 400;
            return { error: "Missing authorization code" };
        }

        console.log("[Auth Callback] Received code, exchanging for tokens...");
        try {
            const redirectUri = getRedirectUri(request);
            console.log(
                `[Auth Callback] Using Redirect URI for exchange: ${redirectUri}`,
            );
            const authentication = await completeGoogleAuthentication(
                db,
                env,
                code,
                redirectUri,
                query.state as string,
            );
            const localhost = authentication.frontendUrl.includes("localhost");
            const cookieOptions = {
                path: "/",
                maxAge: 2592000,
                sameSite: localhost ? "lax" : "none",
                secure: !localhost,
            };
            cookie.sessionId.set({
                value: authentication.sessionId,
                ...cookieOptions,
                httpOnly: true,
            });
            cookie.userId.set({ value: authentication.userId, ...cookieOptions });

            console.log(
                `[Auth Callback] Redirecting to frontend: ${authentication.redirectDestination}`,
            );
            return redirect(authentication.redirectDestination);
        } catch (error: any) {
            console.error("[Auth Callback] Error during authentication:", error);
            set.status = 500;
            return { error: "Authentication failed", message: error.message };
        }
    },

    async logout({ cookie, db }: AuthContext) {
        await logoutUser(db, cookie.sessionId?.value);
        cookie.sessionId.remove();
        cookie.userId.remove();
        return { success: true };
    },
};
