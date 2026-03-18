<script lang="ts">
	import { ui } from "$lib/ui.svelte";
	import type { Theme } from "$lib/types";
	import EditIcon from "$lib/icons/EditIcon.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import CheckIcon from "$lib/icons/CheckIcon.svelte";
	import PlusIcon from "$lib/icons/PlusIcon.svelte";
	import LockIcon from "$lib/icons/LockIcon.svelte";
	import SaveIcon from "$lib/icons/SaveIcon.svelte";
	import { SUPPORTED_DOMAINS } from "$lib/constants";
	import { extensionState, dispatchThemeInstallation, dispatchThemeSave } from "$lib/extension.svelte";

	interface ThemeDetail extends Theme {
		creatorName?: string;
		creatorAvatar?: string;
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

	function confirmDelete() {
		ui.showModal(
			"Delete Theme",
			`Are you sure you want to delete "${theme.themeName}"? This action cannot be undone.`,
			"warning",
			deleteTheme,
		);
	}

	let isInstalled = $derived(extensionState.installedThemeId === theme.themeId);

	function handleInstall() {
		if (extensionState.isExtensionReady) {
			dispatchThemeInstallation(theme.themeId, theme.themeName, [...SUPPORTED_DOMAINS]);
		}
	}

	function handleSave() {
		if (extensionState.isExtensionReady) {
			dispatchThemeSave(theme.themeId, theme.themeName, SUPPORTED_DOMAINS[0]);
		}
	}
</script>

<div class="title-row">
	<div class="title-container">
		<h1 class="premium-font">{theme.themeName}</h1>
		{#if theme.settings?.customStyleShift}
			<div class="custom-badge" title="This theme contains custom style features">
				<CheckIcon size={24} />
			</div>
		{/if}
	</div>
	<div class="actions-group">
		{#if currentUser === theme.ownerId}
			<a
				href="/themes/edit/{theme.themeId}"
				class="icon-action-btn edit"
				title="Edit Theme"
			>
				<EditIcon size={18} />
			</a>
			<button
				class="icon-action-btn delete"
				title="Delete Theme"
				onclick={confirmDelete}
			>
				<TrashIcon size={18} />
			</button>
		{/if}
		{#if isInstalled}
			<div class="installed-status">
				<CheckIcon size={18} />
				<span>Installed</span>
			</div>
			<button
				class="icon-action-btn save"
				class:locked={!extensionState.isExtensionReady}
				title={extensionState.isExtensionReady ? "Save Theme" : "Extension Required"}
				disabled={!extensionState.isExtensionReady}
				onclick={handleSave}
			>
				<SaveIcon size={18} />
			</button>
		{:else}
			<button
				class="icon-action-btn save"
				class:locked={!extensionState.isExtensionReady}
				title={extensionState.isExtensionReady ? "Save Theme" : "Extension Required"}
				disabled={!extensionState.isExtensionReady}
				onclick={handleSave}
			>
				<SaveIcon size={18} />
			</button>
			<button
				class="install-btn premium-button"
				class:locked={!extensionState.isExtensionReady}
				title={extensionState.isExtensionReady ? "Install Theme" : "Extension Required"}
				disabled={!extensionState.isExtensionReady}
				onclick={handleInstall}
			>
				{#if !extensionState.isExtensionReady}
					<LockIcon size={18} />
					Need Extension
				{:else}
					<PlusIcon size={18} />
					Install Theme
				{/if}
			</button>
		{/if}
	</div>
</div>

<style lang="scss">
	.title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;

		.title-container {
			display: flex;
			align-items: center;
			gap: 1rem;

			h1 {
				margin: 0;
				font-size: 2.5rem;
				line-height: 1.1;
			}

			.custom-badge {
				flex-shrink: 0;
				color: #00e5ff;
				background: rgba(0, 229, 255, 0.1);
				padding: 8px;
				border-radius: 50%;
				display: flex;
				align-items: center;
				justify-content: center;
				border: 1px solid rgba(0, 229, 255, 0.2);
				box-shadow: 0 0 20px rgba(0, 229, 255, 0.2);
			}
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

				&.save:hover {
					color: var(--secondary-glow);
					border-color: rgba(var(--secondary-glow-rgb, 100, 150, 255), 0.3);
				}

				&.locked {
					opacity: 0.5;
					cursor: not-allowed;
					
					&:hover {
						background: rgba(255, 255, 255, 0.05); /* maintain original state */
						color: var(--text-secondary);
						border-color: var(--border-glass);
					}
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
			transition: all 0.2s;
			
			&.locked {
				opacity: 0.5;
				cursor: not-allowed;
				background: rgba(255, 255, 255, 0.1);
				color: var(--text-secondary);
				border: 1px solid var(--border-glass);
			}

			&:not(.locked):hover {
				transform: translateY(-2px);
				box-shadow: 0 5px 15px rgba(var(--primary-glow-rgb), 0.3);
			}
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
</style>
