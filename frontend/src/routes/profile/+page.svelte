<script lang="ts">
	import { onMount } from "svelte";
	import type { Theme } from "$lib/types";
	import { getUserId, requireAuth } from "$lib/auth";
	import ProfileThemeList from "$lib/components/ProfileThemeList.svelte";
	import ProfileHeader from "$lib/components/ProfileHeader.svelte";

	let myThemes = $state<Theme[]>([]);
	let userData = $state<{
		name: string;
		avatarUrl: string;
		createdAt: string;
	} | null>(null);
	let loading = $state(true);
	let userId = $state("");

	import { PUBLIC_API_URL } from "$lib/constants";

	async function fetchMyThemes() {
		userId = getUserId();

		if (!userId) {
			loading = false;
			return;
		}

		loading = true;
		try {
			const response = await fetch(
				`${PUBLIC_API_URL}/users/profile?userId=${userId}`,
			);
			const data = await response.json();
			myThemes = data.themes || [];
			userData = data.user;
		} catch (error) {
			console.error("Failed to fetch profile themes:", error);
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
			});
			myThemes = myThemes.filter((t) => t.id !== themeId);
		} catch (error) {
			console.error("Failed to delete theme:", error);
		}
	}
</script>

<div class="profile-container">
	<ProfileHeader {userData} />
	<ProfileThemeList {loading} {myThemes} {deleteTheme} />
</div>

<style lang="scss">
	.profile-container {
		padding: 2rem 0;
	}
</style>
