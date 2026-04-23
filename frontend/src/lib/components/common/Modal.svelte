<script lang="ts">
    import { ui } from "$lib/core/ui.svelte";
    import { fade, fly } from "svelte/transition";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    let modal = $derived(ui.modal);

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") ui.closeModal();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if modal.show}
    <div
        class="modal-backdrop"
        onclick={() => ui.closeModal()}
        onkeydown={() => {}}
        role="button"
        tabindex="-1"
        transition:fade={{ duration: 200 }}
    ></div>

    <div
        class="modal-container"
        in:fly={{ y: 20, duration: 400, opacity: 0 }}
        out:fade={{ duration: 200 }}
    >
        <div class="modal-content glass-panel {modal.type}">
            <button
                class="close-btn"
                onclick={() => ui.closeModal()}
                aria-label="Close"
            >
                <MaterialIcon name="close" size={16} />
            </button>

            <div class="modal-header">
                <div class="icon-wrapper {modal.type}">
                    {#if modal.type === "error"}
                        <MaterialIcon name="warning" size={50} />
                    {:else if modal.type === "warning"}
                        <MaterialIcon name="error_outline" size={50} />
                    {:else if modal.type === "success"}
                        <MaterialIcon name="check_circle" size={50} />
                    {:else}
                        <MaterialIcon name="info" size={50} />
                    {/if}
                </div>
                <h2 class="premium-font">{modal.title}</h2>
            </div>

            <div class="modal-body">
                <p>{modal.message}</p>
            </div>

            <div class="modal-footer">
                {#if modal.onConfirm}
                    <button
                        class="action-btn secondary-btn"
                        onclick={() => ui.closeModal()}
                    >
                        Cancel
                    </button>
                    <button
                        class="action-btn premium-button confirm {modal.type}"
                        onclick={() => {
                            modal.onConfirm?.();
                            ui.closeModal();
                        }}
                    >
                        Confirm
                    </button>
                {:else}
                    <button
                        class="action-btn premium-button"
                        onclick={() => ui.closeModal()}
                    >
                        Dismiss
                    </button>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style lang="scss">
    .modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(6px);
        z-index: 9999;
    }

    .modal-container {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        pointer-events: none;
        padding: 1rem;
    }

    .modal-content {
        width: 100%;
        max-width: 420px;
        padding: 2rem;
        pointer-events: auto;
        position: relative;
        overflow: hidden;

        &::before {
            display: none;
        }
    }

    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: var(--text-muted);
        cursor: pointer;
        width: 32px;
        height: 32px;
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;

        &:hover {
            background: rgba(255, 255, 255, 0.12);
            color: var(--text-primary);
            transform: rotate(90deg);
        }
    }

    .modal-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.25rem;
        text-align: center;

        h2 {
            font-size: 1.6rem;
            margin: 0;
        }
    }

    .icon-wrapper {
        width: 60px;
        height: 60px;
        border-radius: var(--radius-md);
        display: flex;
        align-items: center;
        justify-content: center;
        background: none !important;
        border: none !important;
        color: var(--text-primary) !important;
    }

    .modal-body {
        margin-bottom: 1.75rem;
        text-align: center;
        color: var(--text-secondary);
        line-height: 1.6;

        p {
            margin: 0;
            font-size: 0.95rem;
            word-break: break-word;
        }
    }

    .modal-footer {
        display: flex;
        gap: 0.75rem;
        justify-content: center;

        .action-btn {
            flex: 1;
            max-width: 180px;
            padding: 0.75rem 1.25rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            font-size: 0.9rem;

            &.secondary-btn {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid var(--border-glass);
                color: var(--text-secondary);

                &:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--text-primary);
                }
            }

            &.confirm {
                &.warning,
                &.error {
                    background: #ff4d4d;
                    color: white;
                    border: none;

                    &:hover {
                        background: #ff3232;
                        box-shadow: 0 0 20px rgba(255, 77, 77, 0.3);
                    }
                }
            }
        }
    }
</style>
