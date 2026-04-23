import { PUBLIC_API_URL } from '$lib/constants';

export interface UserProfile {
    id: string;
    name: string;
    avatarUrl: string;
}

class UserService {
    private profileCache = new Map<string, Promise<UserProfile | null>>();

    getProfile(userId: string): Promise<UserProfile | null> {
        if (!userId) {
            return Promise.resolve(null);
        }

        if (this.profileCache.has(userId)) {
            return this.profileCache.get(userId)!;
        }

        const fetchPromise = fetch(`${PUBLIC_API_URL}/users/profile?userId=${userId}`, {
            credentials: 'include'
        })
            .then(async (res) => {
                if (!res.ok) {
                    console.error(`Failed to fetch profile for user ${userId}: ${res.statusText}`);
                    return null;
                }
                const data = await res.json();
                return data.user as UserProfile;
            })
            .catch((err) => {
                console.error(`Network error fetching profile for user ${userId}:`, err);
                // Remove failed request from cache so we can try again later
                this.profileCache.delete(userId);
                return null;
            });

        this.profileCache.set(userId, fetchPromise);
        return fetchPromise;
    }

    hydrateProfiles(profiles: UserProfile[]) {
        for (const profile of profiles) {
            if (profile && profile.id && !this.profileCache.has(profile.id)) {
                this.profileCache.set(profile.id, Promise.resolve(profile));
            }
        }
    }

    clearCache() {
        this.profileCache.clear();
    }
}

export const userService = new UserService();
