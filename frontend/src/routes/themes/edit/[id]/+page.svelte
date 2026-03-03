<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import ThemeEditor from "$lib/components/ThemeEditor.svelte";
	import { requireAuth } from "$lib/auth";
	import type { Theme } from "$lib/types";

	import { PUBLIC_API_URL } from "$lib/constants";
	const { id } = page.params;

	let theme = $state<Theme | null>(null);
	let loading = $state(true);
	let error = $state("");

	onMount(async () => {
		const userId = requireAuth();
		if (!userId) return;

		try {
			const response = await fetch(`${PUBLIC_API_URL}/themes/${id}`);
			if (!response.ok) throw new Error("Theme not found");
			theme = await response.json();

			// Normalize JSON fields
			if (theme) {
				if (theme.ownerId !== userId) {
					window.location.href = "/profile";
					return;
				}

				if (typeof theme.settings === "string")
					theme.settings = JSON.parse(theme.settings);
				if (typeof theme.images === "string")
					theme.images = JSON.parse(theme.images);
			}
		} catch (e: any) {
			error = e.message;
		} finally {
			loading = false;
		}
	});
</script>

<div class="page-container">
	{#if loading}
		<div class="loading-state glass-panel">
			<div class="spinner"></div>
			<p>Loading theme details...</p>
		</div>
	{:else if error}
		<div class="error-state glass-panel">
			<p>⚠️ {error}</p>
			<a href="/profile" class="back-btn premium-button"
				>Back to Profile</a
			>
		</div>
	{:else if theme}
		<ThemeEditor initialData={theme} isEdit={true} />
	{/if}
</div>

<style lang="scss">
	.page-container {
		padding-top: 2rem;
	}

	.loading-state,
	.error-state {
		max-width: 600px;
		margin: 4rem auto;
		padding: 3rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(var(--text-primary-rgb), 0.1);
		border-top-color: var(--primary-glow);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.back-btn {
		background: rgba(255, 255, 255, 0.05);
		color: var(--text-primary);
	}
</style>
