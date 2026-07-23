<script lang="ts">
    import { onMount } from "svelte";
    import { scale } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import { requireAuth, getSessionId, getUserId } from "$lib/utils/auth";
    import ProfileThemeList from "$lib/components/profile/ProfileThemeList.svelte";
    import ProfileHeader from "$lib/components/profile/ProfileHeader.svelte";
    import ProfileMarketplace from "$lib/components/profile/ProfileMarketplace.svelte";

    let myThemes = $state<Theme[]>([]);
    let userData = $state<{
        name: string;
        avatarUrl: string;
        createdAt: string;
    } | null>(null);
    let loading = $state(true);
    let drafts = $state<any[]>([]);
    let collections = $state<any[]>([]);
    let reviews = $state<any[]>([]);

    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { ui } from "$lib/core/ui.svelte";

    async function fetchMyThemes() {
        const sessionId = getSessionId();
        const userId = getUserId();

        if (!sessionId && !userId) {
            loading = false;
            return;
        }

        loading = true;
        try {
            const response = await fetch(`${PUBLIC_API_URL}/users/profile`, {
                credentials: "include",
            });
            const data = await response.json();
            myThemes = data.themes || [];
            drafts = data.drafts || [];
            collections = data.collections || [];
            reviews = data.reviews || [];
            userData = data.user;
        } catch (error) {
            ui.showModal(
                "Profile Error",
                "Failed to fetch your themes. Please check your connection.",
                "error",
            );
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        if (requireAuth()) {
            fetchMyThemes();
        }
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

    function updateCollections(nextCollections: any[]) {
        collections = nextCollections;
    }
</script>

<div
    class="profile-container"
    in:scale={{ delay: 200, start: 0.98, duration: 300 }}
    out:scale={{ start: 0.98, duration: 200 }}
>
    <ProfileHeader {userData} />
    <ProfileThemeList {loading} {myThemes} {deleteTheme} />
    {#if !loading}
        <ProfileMarketplace
            {collections}
            {reviews}
            {drafts}
            onCollectionsChange={updateCollections}
        />
    {/if}
</div>

<style lang="scss">
    .profile-container {
        padding: 2rem 0;
    }
</style>
