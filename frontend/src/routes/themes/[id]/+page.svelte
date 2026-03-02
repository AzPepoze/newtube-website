<script lang="ts">
	import { onMount } from "svelte";
	import { page } from "$app/state";
	import type { Theme } from "$lib/types";
	import { fade, fly } from "svelte/transition";
	import { env } from "$env/dynamic/public";
	import { getUserId } from "$lib/auth";
	import EditIcon from "$lib/icons/EditIcon.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";

	interface ThemeDetail extends Theme {
		creator_name?: string;
		creator_avatar?: string;
	}

	let theme = $state<ThemeDetail | null>(null);
	let loading = $state(true);
	let activeSlide = $state(0);
	let activeTab = $state("overview");
	let currentUser = $state("");

	const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

	async function fetchTheme() {
		currentUser = getUserId() || "";
		const id = page.params.id;
		loading = true;
		try {
			const response = await fetch(`${PUBLIC_API_URL}/themes/${id}`);
			const data = await response.json();
			theme = {
				...data,
				images:
					typeof data.images === "string"
						? JSON.parse(data.images)
						: data.images || [],
				settings:
					typeof data.settings === "string"
						? JSON.parse(data.settings)
						: data.settings,
				custom_styleshift:
					typeof data.custom_styleshift === "string"
						? JSON.parse(data.custom_styleshift)
						: data.custom_styleshift,
			};
		} catch (error) {
			console.error("Failed to fetch theme detail:", error);
			theme = null;
		} finally {
			loading = false;
		}
	}

	function prevSlide() {
		if (theme && theme.images.length > 0) {
			activeSlide =
				(activeSlide - 1 + theme.images.length) % theme.images.length;
		}
	}

	function nextSlide() {
		if (theme && theme.images.length > 0) {
			activeSlide = (activeSlide + 1) % theme.images.length;
		}
	}

	async function deleteTheme() {
		if (!theme || !confirm("Are you sure you want to delete this theme?"))
			return;
		try {
			const res = await fetch(`${PUBLIC_API_URL}/themes/${theme.id}`, {
				method: "DELETE",
			});
			if (res.ok) window.location.href = "/store";
			else alert("Failed to delete theme");
		} catch (e) {
			console.error("Error deleting theme:", e);
			alert("Failed to delete theme");
		}
	}

	onMount(() => {
		fetchTheme();
	});
</script>

<div class="theme-detail-container">
	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Loading theme details...</p>
		</div>
	{:else if theme}
		<div in:fade={{ duration: 400 }}>
			<a href="/store" class="back-link">← Back to Store</a>

			<div class="layout">
				<!-- Left Column -->
				<div class="left-col">
					<!-- Image Slider -->
					<div class="slider glass-panel">
						{#if theme.images && theme.images.length > 0}
							<div class="slides">
								<img
									src={theme.images[activeSlide]}
									alt={theme.name}
									in:fade={{ duration: 200 }}
								/>
							</div>
							{#if theme.images.length > 1}
								<button
									class="slider-btn prev"
									aria-label="Previous image"
									onclick={prevSlide}>‹</button
								>
								<button
									class="slider-btn next"
									aria-label="Next image"
									onclick={nextSlide}>›</button
								>
								<div class="dots">
									{#each theme.images as _, i}
										<button
											class="dot"
											aria-label="Image {i + 1}"
											class:active={i === activeSlide}
											onclick={() => (activeSlide = i)}
										></button>
									{/each}
								</div>
							{/if}
						{:else}
							<div class="no-image">
								<span class="premium-font"
									>{theme.name.charAt(0)}</span
								>
							</div>
						{/if}
					</div>

					<!-- Creator Card -->
					<div class="creator glass-panel">
						<div class="creator-avatar">
							{#if theme.creator_avatar}
								<img
									src={theme.creator_avatar}
									alt={theme.creator_name}
								/>
							{:else}
								<div class="avatar-fallback">
									{(theme.creator_name || theme.owner_id)
										.charAt(0)
										.toUpperCase()}
								</div>
							{/if}
						</div>
						<div class="creator-info">
							<p class="creator-label">Created by</p>
							<p class="creator-name">
								{theme.creator_name ||
									`@${theme.owner_id.slice(0, 8)}`}
							</p>
						</div>
					</div>
				</div>

				<!-- Right Column -->
				<div class="right-col" in:fly={{ x: 20, duration: 600 }}>
					<!-- Title + Install -->
					<div class="title-row">
						<h1 class="premium-font">{theme.name}</h1>
						<div class="actions-group">
							{#if currentUser === theme.owner_id}
								<a
									href="/themes/edit/{theme.id}"
									class="icon-action-btn edit"
									title="Edit Theme"
								>
									<EditIcon size={18} />
								</a>
								<button
									class="icon-action-btn delete"
									title="Delete Theme"
									onclick={deleteTheme}
								>
									<TrashIcon size={18} />
								</button>
							{/if}
							<button class="install-btn">Install Theme</button>
						</div>
					</div>

					<!-- Stats -->
					<div class="stats glass-panel">
						<div class="stat-item">
							<span class="stat-value"
								>📥 {theme.downloads.toLocaleString()}</span
							>
							<span class="stat-label">Downloads</span>
						</div>
						<div class="stat-divider"></div>
						<div class="stat-item">
							<span class="stat-value"
								>🖼️ {theme.images?.length ?? 0}</span
							>
							<span class="stat-label">Screenshots</span>
						</div>
						<div class="stat-divider"></div>
						<div class="stat-item">
							<span class="stat-value"
								>⚙️ {Object.keys(theme.settings || {})
									.length}</span
							>
							<span class="stat-label">Settings</span>
						</div>
					</div>

					<!-- Description -->
					<div class="section">
						<h3>Description</h3>
						<p class="description">{theme.description}</p>
					</div>

					<!-- Tabs -->
					<div class="tabs">
						<button
							class:active={activeTab === "settings"}
							onclick={() => (activeTab = "settings")}
							>Settings</button
						>
						{#if theme.custom_styleshift && theme.custom_styleshift.length > 0}
							<button
								class:active={activeTab === "custom"}
								onclick={() => (activeTab = "custom")}
								>Custom Styles</button
							>
						{/if}
					</div>

					{#if activeTab === "settings"}
						<div
							class="code-block glass-panel"
							in:fade={{ duration: 200 }}
						>
							<pre><code
									>{JSON.stringify(
										theme.settings,
										null,
										2,
									)}</code
								></pre>
						</div>
					{:else if activeTab === "custom"}
						<div
							class="code-block glass-panel"
							in:fade={{ duration: 200 }}
						>
							<pre><code
									>{JSON.stringify(
										theme.custom_styleshift,
										null,
										2,
									)}</code
								></pre>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.theme-detail-container {
		padding: 2rem 0;
	}

	.back-link {
		display: inline-block;
		margin-bottom: 1.5rem;
		color: $text-muted;
		font-size: 0.9rem;

		&:hover {
			color: $text-primary;
		}
	}

	.layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2.5rem;
		align-items: start;

		@media (max-width: 900px) {
			grid-template-columns: 1fr;
		}
	}

	.left-col {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		position: sticky;
		top: 100px;
	}

	.slider {
		position: relative;
		border-radius: $radius-md;
		overflow: hidden;
		aspect-ratio: 16/9;
		background: rgba(0, 0, 0, 0.3);

		.slides {
			width: 100%;
			height: 100%;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
			}
		}

		.no-image {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 5rem;
			color: $text-muted;
			background: linear-gradient(135deg, $bg-dark, #1a1a24);
		}

		.slider-btn {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			background: rgba(0, 0, 0, 0.6);
			border: 1px solid $border-glass;
			color: white;
			width: 40px;
			height: 40px;
			border-radius: 50%;
			font-size: 1.5rem;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
			line-height: 1;
			backdrop-filter: blur(4px);

			&:hover {
				background: rgba($primary-glow, 0.3);
			}
			&.prev {
				left: 1rem;
			}
			&.next {
				right: 1rem;
			}
		}

		.dots {
			position: absolute;
			bottom: 1rem;
			left: 50%;
			transform: translateX(-50%);
			display: flex;
			gap: 0.5rem;

			.dot {
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.3);
				border: none;
				cursor: pointer;
				transition: all 0.2s;

				&.active {
					background: $primary-glow;
					transform: scale(1.3);
				}
			}
		}
	}

	.creator {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.5rem;

		.creator-avatar {
			flex-shrink: 0;
			width: 48px;
			height: 48px;
			border-radius: 50%;
			overflow: hidden;
			border: 2px solid rgba($primary-glow, 0.3);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.avatar-fallback {
				width: 100%;
				height: 100%;
				background: linear-gradient(
					135deg,
					$primary-glow,
					$secondary-glow
				);
				display: flex;
				align-items: center;
				justify-content: center;
				font-weight: 700;
				color: white;
			}
		}

		.creator-label {
			margin: 0;
			font-size: 0.8rem;
			color: $text-muted;
		}

		.creator-name {
			margin: 0;
			font-weight: 700;
			color: $text-primary;
		}
	}

	.right-col {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;

		h1 {
			font-size: 2.5rem;
			margin: 0;
			@include glow-text($primary-glow);
			line-height: 1.1;
		}

		.actions-group {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.icon-action-btn {
				display: flex;
				align-items: center;
				justify-content: center;
				width: 40px;
				height: 40px;
				border-radius: $radius-sm;
				background: rgba(255, 255, 255, 0.05);
				border: 1px solid var(--border-glass);
				color: var(--text-secondary);
				cursor: pointer;
				transition: all 0.2s;

				&:hover {
					background: rgba(255, 255, 255, 0.1);
					color: var(--text-primary);
				}

				&.edit:hover {
					color: $primary-glow;
					border-color: rgba($primary-glow, 0.3);
				}

				&.delete:hover {
					color: #ff4d4d;
					border-color: rgba(255, 77, 77, 0.3);
					background: rgba(255, 77, 77, 0.1);
				}
			}
		}

		.install-btn {
			@include premium-button;
			background: linear-gradient(135deg, $primary-glow, $secondary-glow);
			color: white;
			white-space: nowrap;
		}
	}

	.stats {
		display: flex;
		align-items: center;
		padding: 1.25rem 1.5rem;
		gap: 0;

		.stat-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.25rem;

			.stat-value {
				font-size: 1.1rem;
				font-weight: 700;
				color: $text-primary;
			}

			.stat-label {
				font-size: 0.75rem;
				color: $text-muted;
			}
		}

		.stat-divider {
			width: 1px;
			height: 40px;
			background: $border-glass;
		}
	}

	.section {
		h3 {
			margin: 0 0 0.75rem 0;
			font-size: 1rem;
			color: $text-secondary;
			text-transform: uppercase;
			letter-spacing: 0.05em;
			font-weight: 600;
		}

		.description {
			margin: 0;
			color: $text-secondary;
			line-height: 1.7;
		}
	}

	.tabs {
		display: flex;
		gap: 0.5rem;

		button {
			background: transparent;
			border: 1px solid $border-glass;
			color: $text-muted;
			font-weight: 600;
			padding: 0.5rem 1.25rem;
			cursor: pointer;
			transition: all 0.2s;
			border-radius: $radius-sm;
			font-size: 0.9rem;

			&:hover {
				color: $text-primary;
				border-color: rgba($primary-glow, 0.3);
			}
			&.active {
				color: $primary-glow;
				background: rgba($primary-glow, 0.1);
				border-color: rgba($primary-glow, 0.3);
			}
		}
	}

	.code-block {
		padding: 1.5rem;

		pre {
			margin: 0;
			overflow-x: auto;
			font-size: 0.875rem;
			color: $primary-glow;
			line-height: 1.6;

			code {
				font-family: "Fira Code", "Consolas", monospace;
			}
		}
	}

	.loading-state {
		text-align: center;
		padding: 10rem 0;
		color: $text-muted;

		.spinner {
			width: 48px;
			height: 48px;
			border: 3px solid rgba($primary-glow, 0.1);
			border-top-color: $primary-glow;
			border-radius: 50%;
			margin: 0 auto 1.5rem;
			animation: spin 1s linear infinite;
		}
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
