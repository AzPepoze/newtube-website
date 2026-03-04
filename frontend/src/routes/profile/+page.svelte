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
	import { ui } from "$lib/ui.svelte";

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
				{ credentials: "include" },
			);
			const data = await response.json();
			myThemes = data.themes || [];
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
			myThemes = myThemes.filter((t) => t.id !== themeId);
		} catch (error) {
			ui.showModal(
				"Delete Failed",
				"Could not delete the theme. You may not have permission.",
				"error",
			);
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
