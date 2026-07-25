<script lang="ts">
	import type { Theme } from "$lib/types/index";
	import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
	import YouTubeMockupIframe from "./YouTubeMockupIframe.svelte";

	let { theme }: { theme: Theme } = $props();

	let layoutMode = $state<"grid" | "single">("grid");
	let singleFocusMode = $state<"watch" | "home" | "channel">("watch");
</script>

<div class="theme-preview-wrapper">
	<!-- Layout Mode Switcher Toolbar -->
	<div class="preview-toolbar glass-panel">
		<div class="toolbar-section">
			<span class="toolbar-title">Preview Layout:</span>
			<div class="button-group">
				<button
					class="toggle-btn"
					class:active={layoutMode === "grid"}
					onclick={() => (layoutMode = "grid")}
				>
					<MaterialIcon name="grid_view" size={16} /> All Pages Grid
				</button>
				<button
					class="toggle-btn"
					class:active={layoutMode === "single"}
					onclick={() => (layoutMode = "single")}
				>
					<MaterialIcon name="search" size={16} /> Single Page Focus
				</button>
			</div>
		</div>

		{#if layoutMode === "single"}
			<div class="toolbar-section">
				<span class="toolbar-title">Target Page:</span>
				<div class="button-group">
					<button
						class="toggle-btn"
						class:active={singleFocusMode === "watch"}
						onclick={() => (singleFocusMode = "watch")}
					>
						<MaterialIcon name="movie" size={16} /> Watch
					</button>
					<button
						class="toggle-btn"
						class:active={singleFocusMode === "home"}
						onclick={() => (singleFocusMode = "home")}
					>
						<MaterialIcon name="home" size={16} /> Home Grid
					</button>
					<button
						class="toggle-btn"
						class:active={singleFocusMode === "channel"}
						onclick={() => (singleFocusMode = "channel")}
					>
						<MaterialIcon name="person" size={16} /> Channel
					</button>
				</div>
			</div>
		{/if}
	</div>

	<!-- Preview Views -->
	{#if layoutMode === "grid"}
		<!-- Multi-Page Grid View -->
		<div class="multipage-grid">
			<!-- 1. Watch Page Card -->
			<div class="page-card glass-panel">
				<div class="card-header">
					<div class="header-title">
						<MaterialIcon name="movie" size={18} />
						<h3>Watch Page View</h3>
					</div>
					<button
						class="expand-btn"
						onclick={() => {
							layoutMode = "single";
							singleFocusMode = "watch";
						}}
					>
						Expand ↗
					</button>
				</div>
				<YouTubeMockupIframe {theme} pageMode="watch" height="420px" />
			</div>

			<!-- 2. Home Feed Grid Card -->
			<div class="page-card glass-panel">
				<div class="card-header">
					<div class="header-title">
						<MaterialIcon name="home" size={18} />
						<h3>Home Feed Grid View</h3>
					</div>
					<button
						class="expand-btn"
						onclick={() => {
							layoutMode = "single";
							singleFocusMode = "home";
						}}
					>
						Expand ↗
					</button>
				</div>
				<YouTubeMockupIframe {theme} pageMode="home" height="420px" />
			</div>

			<!-- 3. Channel Page Card -->
			<div class="page-card glass-panel">
				<div class="card-header">
					<div class="header-title">
						<MaterialIcon name="person" size={18} />
						<h3>Channel Page View</h3>
					</div>
					<button
						class="expand-btn"
						onclick={() => {
							layoutMode = "single";
							singleFocusMode = "channel";
						}}
					>
						Expand ↗
					</button>
				</div>
				<YouTubeMockupIframe {theme} pageMode="channel" height="420px" />
			</div>
		</div>
	{:else}
		<!-- Single Page Focus View -->
		<div class="single-focus-container">
			<div class="page-card glass-panel">
				<div class="card-header">
					<div class="header-title">
						<MaterialIcon
							name={singleFocusMode === "watch"
								? "movie"
								: singleFocusMode === "home"
									? "home"
									: "person"}
							size={18}
						/>
						<h3>
							{#if singleFocusMode === "watch"}Watch Page Focus
							{:else if singleFocusMode === "home"}Home Feed Grid Focus
							{:else}Channel Page Focus{/if}
						</h3>
					</div>
				</div>
				<YouTubeMockupIframe
					{theme}
					pageMode={singleFocusMode}
					height="680px"
				/>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
	.theme-preview-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		width: 100%;
	}

	.preview-toolbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		padding: 0.75rem 1.25rem;
		border-radius: var(--radius-lg, 16px);
		border: 1px solid var(--border-glass);

		.toolbar-section {
			display: flex;
			align-items: center;
			gap: 0.75rem;

			.toolbar-title {
				font-size: 0.85rem;
				font-weight: 700;
				color: var(--text-secondary);
			}
		}

		.button-group {
			display: flex;
			align-items: center;
			gap: 0.35rem;
			background: rgba(0, 0, 0, 0.25);
			padding: 0.2rem;
			border-radius: var(--radius-md, 8px);
			border: 1px solid var(--border-glass);
		}

		.toggle-btn {
			display: inline-flex;
			align-items: center;
			gap: 0.35rem;
			padding: 0.4rem 0.85rem;
			border-radius: 6px;
			border: none;
			background: transparent;
			color: var(--text-secondary);
			font-size: 0.82rem;
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				color: var(--text-primary);
			}

			&.active {
				background: rgba(var(--text-primary-rgb), 0.15);
				color: var(--text-primary);
			}
		}
	}

	.multipage-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		gap: 1.5rem;
		width: 100%;
	}

	.page-card {
		padding: 1rem;
		border-radius: var(--radius-lg, 16px);
		border: 1px solid var(--border-glass);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		.card-header {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.header-title {
				display: flex;
				align-items: center;
				gap: 0.5rem;

				h3 {
					margin: 0;
					font-size: 1rem;
					font-weight: 700;
				}
			}

			.expand-btn {
				background: rgba(255, 255, 255, 0.05);
				border: 1px solid var(--border-glass);
				border-radius: 6px;
				color: var(--text-secondary);
				font-size: 0.78rem;
				font-weight: 600;
				padding: 0.3rem 0.6rem;
				cursor: pointer;
				transition: all 0.2s;

				&:hover {
					background: rgba(255, 255, 255, 0.12);
					color: var(--text-primary);
				}
			}
		}
	}

	.single-focus-container {
		width: 100%;
	}
</style>
