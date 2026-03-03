<script lang="ts">
	import ThemeCard from "$lib/components/ThemeCard.svelte";
	import { getCurrentUser } from "$lib/auth";
	import type { Theme } from "$lib/types";

	let {
		name,
		description,
		images,
		coverImage,
		coverImagePending,
		settingsCode,
	}: {
		name: string;
		description: string;
		images: string[];
		coverImage: string;
		coverImagePending: File | null;
		settingsCode: string;
	} = $props();

	let currentUser = $state<any>(null);
	const displayCoverImage = $derived(
		coverImagePending ? URL.createObjectURL(coverImagePending) : coverImage,
	);

	$effect(() => {
		getCurrentUser().then((user) => {
			currentUser = user;
		});
	});

	const mockTheme = $derived.by(
		() =>
			({
				id: "preview-theme",
				ownerId: currentUser?.id || "preview-user",
				name: name || "Theme Name",
				description: description || "No description provided.",
				images,
				coverImage: displayCoverImage,
				settings: settingsCode ? JSON.parse(settingsCode) : {},
				downloads: 0,
			}) as Theme,
	);
</script>

<div class="preview-container">
	<div class="card-preview glass-panel">
		<h3>Card Preview</h3>
		<div class="card-wrapper">
			<ThemeCard theme={mockTheme} />
		</div>
	</div>

	<div class="data-preview glass-panel">
		<h3>Raw Data</h3>
		<pre><code
				>{JSON.stringify(
					{
						name,
						description,
						images,
						coverImage,
						settings: JSON.parse(settingsCode || "{}"),
					},
					null,
					2,
				)}</code
			></pre>
	</div>
</div>

<style lang="scss">
	.preview-container {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.card-preview,
	.data-preview {
		padding: 2rem;
		border: 1px solid var(--border-glass);
		border-radius: var(--radius-md);

		h3 {
			margin: 0 0 1.5rem;
			font-size: 0.85rem;
			color: var(--text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			font-weight: 800;
		}
	}

	.card-wrapper {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1rem;
		max-width: 400px;

		:global(a) {
			pointer-events: none;
			cursor: default;
		}
	}

	.data-preview {
		pre {
			background: rgba(var(--text-primary-rgb), 0.05);
			padding: 1.5rem;
			border-radius: var(--radius-sm);
			overflow-x: auto;
			margin: 0;
			border: 1px solid var(--border-glass);

			code {
				font-family: monospace;
				font-size: 0.85rem;
				color: var(--text-primary);
			}
		}
	}
</style>
