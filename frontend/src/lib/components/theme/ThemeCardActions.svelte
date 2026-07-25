<script lang="ts">
	import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
	import UserAvatar from "$lib/components/common/UserAvatar.svelte";
	import { extensionState } from "$lib/core/extension.svelte";

	let {
		themeId,
		ownerId,
		isInstalled,
		handleSave,
		handleInstall,
		onPreview,
	}: {
		themeId?: string;
		ownerId: string;
		isInstalled: boolean;
		handleSave: (e: Event) => void;
		handleInstall: (e: Event) => void;
		onPreview?: (e: Event) => void;
	} = $props();
</script>

<div class="footer">
	<UserAvatar userId={ownerId} size="sm" />
	<div class="actions">
		{#if themeId}
			{#if onPreview}
				<button
					type="button"
					class="action-btn icon-btn preview-btn"
					title="Preview Theme Popup"
					onclick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onPreview(e);
					}}
				>
					<MaterialIcon name="visibility" size={18} />
				</button>
			{:else}
				<a
					href="/themes/preview?id={themeId}"
					class="action-btn icon-btn preview-btn"
					title="Preview Theme Page"
					onclick={(e) => e.stopPropagation()}
				>
					<MaterialIcon name="visibility" size={18} />
				</a>
			{/if}
		{/if}
		<button
			class="action-btn icon-btn save-btn"
			class:locked={!extensionState.isExtensionReady}
			title={extensionState.isExtensionReady
				? "Save Theme"
				: "Extension Required"}
			disabled={!extensionState.isExtensionReady}
			onclick={handleSave}
		>
			<MaterialIcon name="save" size={18} />
		</button>

		<button
			class="action-btn install-btn"
			class:installed={isInstalled}
			class:locked={!extensionState.isExtensionReady}
			disabled={!extensionState.isExtensionReady}
			onclick={handleInstall}
		>
			{#if !extensionState.isExtensionReady}
				<MaterialIcon name="lock" size={16} />
			{:else if isInstalled}
				<MaterialIcon name="check" size={16} />
			{:else}
				<MaterialIcon name="download" size={16} />
			{/if}
			<span>{isInstalled ? "Installed" : "Install"}</span>
		</button>
	</div>
</div>

<style lang="scss">
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 1rem;
		border-top: 1px solid var(--border-glass);

		.actions {
			display: flex;
			align-items: center;
			gap: 0.5rem;

			.action-btn {
				display: inline-flex;
				align-items: center;
				justify-content: center;

				&.icon-btn {
					width: 36px;
					height: 36px;
					padding: 0;
					border-radius: var(--radius-md);
					background: rgba(var(--text-primary-rgb), 0.05);
					border: 1px solid var(--border-glass);
					color: var(--text-secondary);
					transition: all 0.2s ease;
					text-decoration: none;
					cursor: pointer;

					&:hover:not(:disabled) {
						background: rgba(var(--text-primary-rgb), 0.1);
						color: var(--text-primary);
						border-color: rgba(var(--text-primary-rgb), 0.2);
					}

					&.preview-btn:hover {
						color: var(--color-primary, #ff0055);
						border-color: rgba(255, 0, 85, 0.4);
					}

					&.locked {
						opacity: 0.4;
						cursor: not-allowed;
					}
				}

				&.install-btn {
					height: 36px;
					padding: 0 1rem;
					gap: 0.5rem;
					border-radius: var(--radius-md);
					background: var(--text-primary);
					color: var(--bg-dark);
					font-weight: 600;
					font-size: 0.85rem;
					border: none;
					cursor: pointer;
					transition: all 0.2s ease;

					&:hover:not(:disabled) {
						transform: translateY(-2px);
						box-shadow: 0 4px 12px rgba(var(--text-primary-rgb), 0.3);
					}

					&.installed {
						background: rgba(var(--text-primary-rgb), 0.1);
						color: var(--text-primary);
						border: 1px solid var(--border-glass);
					}

					&.locked {
						opacity: 0.5;
						cursor: not-allowed;
						background: rgba(var(--text-primary-rgb), 0.1);
						color: var(--text-muted);

						&:hover {
							transform: none;
							box-shadow: none;
						}
					}
				}
			}
		}
	}
</style>
