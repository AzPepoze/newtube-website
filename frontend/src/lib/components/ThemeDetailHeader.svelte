<script lang="ts">
	import type { Theme } from "$lib/types";
	import EditIcon from "$lib/icons/EditIcon.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import DownloadIcon from "$lib/icons/DownloadIcon.svelte";
	import EyeIcon from "$lib/icons/EyeIcon.svelte";
	import SettingsIcon from "$lib/icons/SettingsIcon.svelte";
	import CheckIcon from "$lib/icons/CheckIcon.svelte";
	import PlusIcon from "$lib/icons/PlusIcon.svelte";

	interface ThemeDetail extends Theme {
		creator_name?: string;
		creator_avatar?: string;
	}

	let {
		theme,
		currentUser,
		deleteTheme,
	}: {
		theme: ThemeDetail;
		currentUser: string;
		deleteTheme: () => void;
	} = $props();

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

	function handleInstall() {
		localStorage.setItem("activeThemeId", theme.id);
		isInstalled = true;
		window.dispatchEvent(new Event("storage"));
	}
</script>

<div class="title-row">
	<h1 class="premium-font">{theme.name}</h1>
	<div class="actions-group">
		{#if currentUser === theme.ownerId}
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
		{#if isInstalled}
			<div class="installed-status">
				<CheckIcon size={18} />
				<span>Installed</span>
			</div>
		{:else}
			<button class="install-btn premium-button" onclick={handleInstall}>
				<PlusIcon size={18} />
				Install Theme
			</button>
		{/if}
	</div>
</div>

<div class="stats glass-panel">
	<div class="stat-item">
		<span class="stat-value">
			<DownloadIcon size={20} />
			{theme.downloads.toLocaleString()}
		</span>
		<span class="stat-label">Downloads</span>
	</div>
	<div class="stat-divider"></div>
	<div class="stat-item">
		<span class="stat-value">
			<EyeIcon size={20} />
			{theme.images?.length ?? 0}
		</span>
		<span class="stat-label">Screenshots</span>
	</div>
	<div class="stat-divider"></div>
	<div class="stat-item">
		<span class="stat-value">
			<SettingsIcon size={20} />
			{Object.keys(theme.settings || {}).length}
		</span>
		<span class="stat-label">Settings</span>
	</div>
</div>

<style lang="scss">
	.title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;

		h1 {
			margin: 0;
			font-size: 2.5rem;
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
				border-radius: var(--radius-sm);
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
					color: var(--primary-glow);
					border-color: rgba(var(--text-primary-rgb), 0.3);
				}

				&.delete:hover {
					color: #ff4d4d;
					border-color: rgba(255, 77, 77, 0.3);
					background: rgba(255, 77, 77, 0.1);
				}
			}
		}

		.install-btn {
			background: linear-gradient(
				135deg,
				var(--primary-glow),
				var(--secondary-glow)
			);
			color: var(--bg-dark);
			white-space: nowrap;
			border: none;
			padding: 0.75rem 1.5rem;
			border-radius: var(--radius-sm);
			font-weight: 600;
			font-family: inherit;
			cursor: pointer;
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}

		.installed-status {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			color: #00ff96;
			font-size: 1rem;
			font-weight: 700;
			background: rgba(0, 255, 150, 0.1);
			padding: 0.75rem 1.5rem;
			border-radius: var(--radius-sm);
			border: 1px solid rgba(0, 255, 150, 0.2);
		}
	}

	.stats {
		display: flex;
		align-items: center;
		padding: 1.25rem 1.5rem;
		gap: 0;
		border-radius: var(--radius-md);

		.stat-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 0.25rem;

			.stat-value {
				font-size: 1.15rem;
				font-weight: 700;
				color: var(--text-primary);
				display: flex;
				align-items: center;
				gap: 0.5rem;
			}

			.stat-label {
				font-size: 0.75rem;
				color: var(--text-muted);
			}
		}

		.stat-divider {
			width: 1px;
			height: 40px;
			background: var(--border-glass);
		}
	}
</style>
