<script lang="ts">
    import { ui } from "$lib/ui.svelte";
    import { fade, fly } from "svelte/transition";
    import CrossIcon from "$lib/icons/CrossIcon.svelte";

    let modal = $derived(ui.modal);

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape") ui.closeModal();
    }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if modal.show}
    <!-- Backdrop -->
    <div
        class="modal-backdrop"
        onclick={() => ui.closeModal()}
        onkeydown={() => {}}
        role="button"
        tabindex="-1"
        transition:fade={{ duration: 200 }}
    ></div>

    <!-- Modal Content -->
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
                <CrossIcon size={18} />
            </button>

            <div class="modal-header">
                <div class="icon-wrapper">
                    {#if modal.type === "error"}
                        <span class="status-icon">⚠️</span>
                    {:else if modal.type === "warning"}
                        <span class="status-icon">⚡</span>
                    {:else if modal.type === "success"}
                        <span class="status-icon">✨</span>
                    {:else}
                        <span class="status-icon">ℹ️</span>
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
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
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
        max-width: 450px;
        padding: 2.5rem;
        pointer-events: auto;
        position: relative;
        overflow: hidden;

        &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
        }

        &.error::before {
            background: linear-gradient(90deg, #ff3232, #ff6b6b);
        }
        &.warning::before {
            background: linear-gradient(90deg, #ffd700, #ff8c00);
        }
        &.success::before {
            background: linear-gradient(90deg, #00ff96, #00d2ff);
        }
        &.info::before {
            background: linear-gradient(90deg, #00d2ff, #7a5fff);
        }
    }

    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: transparent;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 50%;
        transition: all 0.2s;

        &:hover {
            background: rgba(var(--text-primary-rgb), 0.1);
            color: var(--text-primary);
            transform: rotate(90deg);
        }
    }

    .modal-header {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1.5rem;
        text-align: center;

        .icon-wrapper {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        h2 {
            font-size: 1.75rem;
            margin: 0;
        }
    }

    .modal-body {
        margin-bottom: 2rem;
        text-align: center;
        color: var(--text-secondary);
        line-height: 1.6;

        p {
            margin: 0;
            font-size: 1.05rem;
        }
    }

    .modal-footer {
        display: flex;
        justify-content: center;

        .action-btn {
            width: 100%;
            max-width: 200px;
            padding: 0.8rem 1.5rem;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;

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
