<script lang="ts">
    import { page } from "$app/state";
    import { scale } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import { requireAuth, getSessionId, getUserId } from "$lib/utils/auth";
    import ProfileThemeList from "$lib/components/profile/ProfileThemeList.svelte";
    import ProfileHeader from "$lib/components/profile/ProfileHeader.svelte";
    import ProfileMarketplace from "$lib/components/profile/ProfileMarketplace.svelte";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { ui } from "$lib/core/ui.svelte";
    import { parseApiError } from "$lib/utils/api";

    let targetUserId = $derived(page.url.searchParams.get("userId"));
    let currentUserId = $derived(getUserId());
    let isOwnProfile = $derived(
        !targetUserId || (!!currentUserId && targetUserId === currentUserId),
    );

    let myThemes = $state<Theme[]>([]);
    let userData = $state<{
        id: string;
        name: string;
        avatarUrl: string;
        bio?: string | null;
        createdAt: string;
    } | null>(null);
    let loading = $state(true);
    let drafts = $state<any[]>([]);
    let reviews = $state<any[]>([]);

    function handleBioUpdated(newBio: string) {
        if (userData) {
            userData.bio = newBio;
        }
    }

    async function fetchProfileData(queryUserId: string | null) {
        const loggedInUserId = getUserId();
        const sessionId = getSessionId();

        if (!queryUserId && !sessionId && !loggedInUserId) {
            requireAuth();
            loading = false;
            return;
        }

        loading = true;
        try {
            const fetchUrl = queryUserId
                ? `${PUBLIC_API_URL}/users/profile?userId=${encodeURIComponent(queryUserId)}`
                : `${PUBLIC_API_URL}/users/profile`;
            const response = await fetch(fetchUrl, {
                credentials: "include",
            });
            if (!response.ok) {
                const errMsg = await parseApiError(response, "Failed to fetch profile");
                throw new Error(errMsg);
            }
            const data = await response.json();
            myThemes = data.themes || [];
            drafts = data.drafts || [];
            reviews = data.reviews || [];
            userData = data.user;
        } catch (error) {
            const msg = error instanceof Error && error.message ? error.message : "Failed to fetch profile data. Please check your connection.";
            ui.showModal(
                "Profile Error",
                msg,
                "error",
            );
        } finally {
            loading = false;
        }
    }

    $effect(() => {
        const queryUserId = page.url.searchParams.get("userId");
        void fetchProfileData(queryUserId);
    });

    async function deleteTheme(themeId: string) {
        if (!confirm("Are you sure you want to delete this theme?")) return;
        try {
            await fetch(`${PUBLIC_API_URL}/themes/${themeId}`, {
                method: "DELETE",
                credentials: "include",
            });
            myThemes = myThemes.filter((t) => t.themeId !== themeId);
        } catch (error) {
            ui.showModal(
                "Delete Failed",
                "Could not delete the theme. You may not have permission.",
                "error",
            );
        }
    }
</script>

<div
    class="profile-container"
    in:scale={{ delay: 200, start: 0.98, duration: 300 }}
    out:scale={{ start: 0.98, duration: 200 }}
>
    <ProfileHeader {userData} {isOwnProfile} onBioUpdated={handleBioUpdated} />
    <ProfileThemeList {loading} {myThemes} {deleteTheme} {isOwnProfile} />
    {#if !loading}
        <ProfileMarketplace {reviews} {drafts} {isOwnProfile} />
    {/if}
</div>

<style lang="scss">
    .profile-container {
        padding: 2rem 0;
    }
</style>
