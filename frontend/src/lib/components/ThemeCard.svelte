<script lang="ts">
	import { fade } from "svelte/transition";
	import type { Theme } from "$lib/types";
	import DownloadIcon from "$lib/icons/DownloadIcon.svelte";
	import CheckIcon from "$lib/icons/CheckIcon.svelte";
	import PlusIcon from "$lib/icons/PlusIcon.svelte";
	import UserAvatar from "$lib/components/UserAvatar.svelte";
	import { extensionState, dispatchThemeInstallation } from "$lib/extension.svelte";

	let { theme }: { theme: Theme } = $props();

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

	let isInstalled = $state(false);

	$effect(() => {
		const checkInstalled = () => {
			const activeId = localStorage.getItem("activeThemeId");
			isInstalled = activeId === theme.id;
		};
		checkInstalled();
		window.addEventListener("storage", checkInstalled);
		return () => window.removeEventListener("storage", checkInstalled);
	});

	function handleInstall(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		if (extensionState.isExtensionReady) {
			dispatchThemeInstallation(theme.id, theme.name, $state.snapshot(theme));
		}

		localStorage.setItem("activeThemeId", theme.id);
		isInstalled = true;
		// Trigger custom event for other cards
		window.dispatchEvent(new Event("storage"));
	}
</script>

<a
	href="/themes/{theme.id}"
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
						alt={theme.name}
						in:fade={{ duration: 300 }}
					/>
				{/key}
			{:else}
				<div class="placeholder">
					<span class="premium-font">{theme.name.charAt(0)}</span>
				</div>
			{/if}
			<div class="overlay">
				<span class="view-tag">View Details</span>
			</div>
		</div>

		<div class="card-content">
			<div class="header">
				<h3>{theme.name}</h3>
				<span class="downloads">
					<DownloadIcon size={14} />
					{theme.downloads}
				</span>
			</div>
			<p>{theme.description || "No description provided."}</p>
			<div class="footer">
				<UserAvatar userId={theme.ownerId} size="sm" />
				{#if isInstalled}
					<div class="installed-badge">
						<CheckIcon size={14} />
						<span>Installed</span>
					</div>
				{:else}
					<button
						class="install-btn icon-btn"
						title="Install Theme"
						onclick={handleInstall}
					>
						<PlusIcon size={18} />
					</button>
				{/if}
			</div>
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
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
		height: 100%;
		display: flex;
		flex-direction: column;

		&:hover {
			transform: translateY(-4px);
			border-color: rgba(255, 255, 255, 0.3);
			box-shadow:
				0 10px 30px rgba(0, 0, 0, 0.4),
				0 0 15px rgba(255, 255, 255, 0.05);

			.overlay {
				opacity: 1;
			}

			img {
				transform: scale(1.1);
			}
		}

		.card-image {
			position: relative;
			aspect-ratio: 16/9;
			overflow: hidden;
			background: rgba(0, 0, 0, 0.2);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				transition: transform 0.6s ease;
			}

			.placeholder {
				width: 100%;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
				background: linear-gradient(135deg, #0a0a0a, #1a1a1a);
				font-size: 3rem;
				opacity: 0.5;
			}

			.overlay {
				position: absolute;
				inset: 0;
				background: rgba(0, 0, 0, 0.6);
				display: flex;
				align-items: center;
				justify-content: center;
				opacity: 0;
				transition: opacity 0.3s ease;
				.view-tag {
					color: white;
					border: 1px solid rgba(255, 255, 255, 0.2);
					pointer-events: none;
				}
			}
		}

		.card-content {
			padding: 1.5rem;
			flex: 1;
			display: flex;
			flex-direction: column;
			gap: 0.75rem;

			.header {
				display: flex;
				justify-content: space-between;
				align-items: center;

				h3 {
					margin: 0;
					font-size: 1.25rem;
					font-weight: 700;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
				}

				.downloads {
					font-size: 0.85rem;
					color: var(--text-muted);
					white-space: nowrap;
					display: flex;
					align-items: center;
					gap: 0.35rem;
				}
			}

			p {
				margin: 0;
				font-size: 0.95rem;
				color: var(--text-secondary);
				display: -webkit-box;
				-webkit-line-clamp: 2;
				line-clamp: 2;
				-webkit-box-orient: vertical;
				overflow: hidden;
				line-height: 1.5;
				flex: 1;
			}

			.footer {
				display: flex;
				justify-content: space-between;
				align-items: center;
				margin-top: 0.5rem;
				gap: 0.75rem;

				.installed-badge {
					display: flex;
					align-items: center;
					gap: 0.35rem;
					color: #00ff96;
					font-size: 0.85rem;
					font-weight: 700;
					background: rgba(0, 255, 150, 0.1);
					padding: 6px 12px;
					border-radius: var(--radius-sm);
					border: 1px solid rgba(0, 255, 150, 0.2);
				}

				.install-btn {
					&.icon-btn {
						width: 40px;
						height: 40px;
						padding: 0;
						display: flex;
						align-items: center;
						justify-content: center;
						border-radius: 50%;
						background: var(--text-primary);
						color: var(--bg-dark);
						border: 1px solid var(--border-glass);
						box-shadow: none;
						transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

						:global(.light) & {
							background: #1a1a1a;
							color: #ffffff;
						}

						&:hover {
							transform: scale(1.1) rotate(90deg);
							box-shadow: 0 8px 25px
								rgba(var(--text-primary-rgb), 0.25);
						}

						&:active {
							transform: scale(0.95);
						}
					}
				}
			}
		}
	}
</style>
