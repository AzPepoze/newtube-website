<script lang="ts">
	import { fade } from "svelte/transition";
	import type { Theme } from "$lib/types/index";
	import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
	import ThemeCardActions from "$lib/components/theme/ThemeCardActions.svelte";
	import { SUPPORTED_DOMAINS } from "$lib/constants/index";
	import {
		extensionState,
		dispatchThemeInstallation,
		dispatchThemeSave,
	} from "$lib/core/extension.svelte";

	let {
		theme,
		onPreview,
	}: {
		theme: Theme;
		onPreview?: (theme: Theme, e: Event) => void;
	} = $props();

	let currentImageIndex = $state(0);
	let hoverTimer: ReturnType<typeof setInterval> | null = $state(null);
	const displayImages = $derived(theme.images || []);

	function startImageCarousel() {
		if (displayImages.length <= 1) return;
		hoverTimer = setInterval(() => {
			currentImageIndex = (currentImageIndex + 1) % displayImages.length;
		}, 2000);
	}

	function stopImageCarousel() {
		if (hoverTimer) {
			clearInterval(hoverTimer);
			hoverTimer = null;
		}
		currentImageIndex = 0;
	}

	function getDisplayImage(): string {
		if (hoverTimer && displayImages.length > 0) {
			return displayImages[currentImageIndex] || "";
		}
		if (theme.coverImage) {
			return theme.coverImage;
		}
		return displayImages[0] || "";
	}

	let isInstalled = $derived(
		extensionState.installedThemeId === theme.themeId
	);
	const visibleTags = $derived(theme.tags?.slice(0, 3) ?? []);
	const remainingTagCount = $derived(
		(theme.tags?.length ?? 0) - visibleTags.length
	);
	const rating = $derived(
		typeof theme.rating === "number" && Number.isFinite(theme.rating)
			? theme.rating
			: null
	);

	function handleInstall(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		if (extensionState.isExtensionReady) {
			dispatchThemeInstallation(theme.themeId, theme.themeName, [
				...SUPPORTED_DOMAINS,
			]);
		}
	}

	function handleSave(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		if (extensionState.isExtensionReady) {
			dispatchThemeSave(
				theme.themeId,
				theme.themeName,
				SUPPORTED_DOMAINS[0]
			);
		}
	}
</script>

<a
	href="/themes/{theme.themeId}"
	class="theme-card-wrapper"
	onmouseenter={startImageCarousel}
	onmouseleave={stopImageCarousel}
>
	<div class="theme-card glass-panel">
		<div class="card-image">
			{#if displayImages.length > 0 || theme.coverImage}
				{#key currentImageIndex}
					<img
						src={getDisplayImage()}
						alt={theme.themeName}
						in:fade={{ duration: 300 }}
					/>
				{/key}
			{:else}
				<div class="placeholder">
					<span class="premium-font">{theme.themeName.charAt(0)}</span>
				</div>
			{/if}
			<div class="overlay">
				<span class="view-tag">View Details</span>
			</div>
		</div>

		<div class="card-content">
			<div class="header">
				<h3>{theme.themeName}</h3>
				<span
					class="rating-badge"
					class:rated={rating !== null}
					title={rating === null
						? "No ratings yet"
						: `${rating.toFixed(1)} out of 5 stars`}
				>
					<MaterialIcon name="star" size={14} />
					{rating === null ? "New" : rating.toFixed(1)}
					{#if theme.ratingCount}
						<span class="rating-count">({theme.ratingCount})</span>
					{/if}
				</span>
			</div>
			{#if visibleTags.length > 0}
				<div class="metadata" aria-label="Theme tags">
					{#each visibleTags as tag}
						<span class="tag-chip">#{tag}</span>
					{/each}
					{#if remainingTagCount > 0}
						<span class="tag-chip">+{remainingTagCount}</span>
					{/if}
				</div>
			{/if}
			<p>{theme.description || "No description provided."}</p>
			<ThemeCardActions
				themeId={theme.themeId}
				ownerId={theme.ownerId}
				{isInstalled}
				{handleSave}
				{handleInstall}
				onPreview={onPreview
					? (e) => {
							e.preventDefault();
							e.stopPropagation();
							onPreview(theme, e);
						}
					: undefined}
			/>
		</div>
	</div>
</a>

<style lang="scss">
	.theme-card-wrapper {
		text-decoration: none;
		color: inherit;
		display: block;
		height: 100%;
	}

	.theme-card {
		display: flex;
		flex-direction: column;
		height: 100%;
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
		position: relative;
		background: rgba(var(--bg-surface-rgb, 20, 20, 25), 0.6);
		border: 1px solid var(--border-glass);

		&:hover {
			transform: translateY(-6px) scale(1.01);
			border-color: rgba(var(--text-primary-rgb), 0.2);
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);

			.overlay {
				opacity: 1;
			}
		}

		.card-image {
			height: 180px;
			position: relative;
			overflow: hidden;
			background: rgba(0, 0, 0, 0.3);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
			}

			.placeholder {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(
					135deg,
					rgba(var(--text-primary-rgb), 0.05),
					rgba(var(--text-primary-rgb), 0.15)
				);

				span {
					font-size: 4rem;
					font-weight: 800;
					color: rgba(var(--text-primary-rgb), 0.2);
				}
			}

			.overlay {
				position: absolute;
				inset: 0;
				background: rgba(0, 0, 0, 0.4);
				backdrop-filter: blur(4px);
				display: flex;
				align-items: center;
				justify-content: center;
				opacity: 0;
				transition: opacity 0.3s ease;

				.view-tag {
					padding: 0.6rem 1.2rem;
					border-radius: var(--radius-full);
					background: rgba(255, 255, 255, 0.2);
					border: 1px solid rgba(255, 255, 255, 0.4);
					color: white;
					font-size: 0.85rem;
					font-weight: 600;
				}
			}
		}

		.card-content {
			padding: 1.25rem;
			display: flex;
			flex-direction: column;
			flex: 1;

			.header {
				display: flex;
				justify-content: space-between;
				align-items: flex-start;
				margin-bottom: 0.5rem;
				gap: 0.5rem;

				h3 {
					font-size: 1.1rem;
					font-weight: 700;
					margin: 0;
					line-height: 1.3;
				}

				.rating-badge {
					display: inline-flex;
					align-items: center;
					gap: 0.25rem;
					padding: 0.25rem 0.5rem;
					border-radius: var(--radius-sm);
					background: rgba(var(--text-primary-rgb), 0.05);
					font-size: 0.75rem;
					font-weight: 600;
					color: var(--text-muted);

					&.rated {
						background: rgba(255, 184, 0, 0.15);
						color: #ffb800;
					}

					.rating-count {
						opacity: 0.7;
						font-weight: 400;
					}
				}
			}

			.metadata {
				display: flex;
				flex-wrap: wrap;
				gap: 0.35rem;
				margin-bottom: 0.75rem;

				.tag-chip {
					font-size: 0.75rem;
					padding: 0.15rem 0.5rem;
					border-radius: var(--radius-sm);
					background: rgba(var(--text-primary-rgb), 0.05);
					color: var(--text-secondary);
				}
			}

			p {
				font-size: 0.85rem;
				color: var(--text-secondary);
				margin: 0 0 1.25rem;
				line-height: 1.5;
				display: -webkit-box;
				-webkit-line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				flex: 1;
			}
		}
	}
</style>
