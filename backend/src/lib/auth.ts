export interface GoogleUser {
    id: string;
    email: string;
    name: string;
    picture: string;
}

export async function getGoogleAuthUrl(env: any, redirectUri: string) {
    const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function getGoogleUser(env: any, code: string, redirectUri: string): Promise<GoogleUser> {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }),
    });

    const tokens: any = await tokenResponse.json();
    if (!tokens.access_token) {
        throw new Error('Failed to get access token');
    }

    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const userData: any = await userResponse.json();
    return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
    };
}
