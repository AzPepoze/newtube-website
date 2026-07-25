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
        createdAt: string;
    } | null>(null);
    let loading = $state(true);
    let drafts = $state<any[]>([]);
    let reviews = $state<any[]>([]);

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
                const err = await response.json().catch(() => ({}));
                throw new Error(
                    err.message || err.error || "Failed to fetch profile",
                );
            }
            const data = await response.json();
            myThemes = data.themes || [];
            drafts = data.drafts || [];
            reviews = data.reviews || [];
            userData = data.user;
        } catch (error) {
            ui.showModal(
                "Profile Error",
                "Failed to fetch profile data. Please check your connection.",
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
    <ProfileHeader {userData} {isOwnProfile} />
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
