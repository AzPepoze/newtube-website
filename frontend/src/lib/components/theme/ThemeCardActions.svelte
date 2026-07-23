<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import UserAvatar from "$lib/components/common/UserAvatar.svelte";
    import { extensionState } from "$lib/core/extension.svelte";

    let {
        ownerId,
        isInstalled,
        handleSave,
        handleInstall,
    }: {
        ownerId: string;
        isInstalled: boolean;
        handleSave: (e: Event) => void;
        handleInstall: (e: Event) => void;
    } = $props();
</script>

<div class="footer">
    <UserAvatar userId={ownerId} size="sm" />
    <div class="actions">
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

        {#if isInstalled}
            <div class="installed-badge">
                <MaterialIcon name="check" size={14} />
                <span>Installed</span>
            </div>
        {:else}
            <button
                class="action-btn icon-btn install-btn"
                class:locked={!extensionState.isExtensionReady}
                title={extensionState.isExtensionReady
                    ? "Install Theme"
                    : "Extension Required"}
                disabled={!extensionState.isExtensionReady}
                onclick={handleInstall}
            >
                {#if !extensionState.isExtensionReady}
                    <MaterialIcon name="lock" size={18} />
                {:else}
                    <MaterialIcon name="add" size={18} />
                {/if}
            </button>
        {/if}
    </div>
</div>

<style lang="scss">
    .footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
        padding-top: 1rem;
        border-top: 1px solid var(--border-glass);

        .actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .action-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.4rem;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-glass);
            background: rgba(var(--text-primary-rgb), 0.05);
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.2s;

            &:hover:not(:disabled) {
                background: rgba(var(--text-primary-rgb), 0.15);
                transform: translateY(-1px);
            }

            &.locked {
                opacity: 0.5;
                cursor: not-allowed;
            }

            &.save-btn:hover:not(:disabled) {
                color: var(--primary-glow);
            }

            &.install-btn:hover:not(:disabled) {
                background: var(--text-primary);
                color: var(--bg-dark);
            }
        }

        .installed-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            padding: 0.3rem 0.6rem;
            border-radius: var(--radius-sm);
            background: rgba(0, 255, 150, 0.15);
            color: #00ff96;
            border: 1px solid rgba(0, 255, 150, 0.3);
            font-size: 0.75rem;
            font-weight: 700;
        }
    }
</style>
