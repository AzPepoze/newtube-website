<script lang="ts">
    import { fade } from "svelte/transition";

    let {
        success,
        isEdit,
        infoMessage,
        errorMessage,
        clearDraft,
    }: {
        success: boolean;
        isEdit: boolean;
        infoMessage: string;
        errorMessage: string;
        clearDraft: () => void;
    } = $props();
</script>

{#if success}
    <div class="status-banner success" in:fade>
        {isEdit ? "Theme updated!" : "Theme published!"} Redirecting...
    </div>
{/if}

{#if infoMessage}
    <div class="status-banner info" in:fade>
        <div class="message-content">
            <span>✨ {infoMessage}</span>
            {#if infoMessage === "Browser backup restored from your last session."}
                <button type="button" class="action-btn" onclick={clearDraft}>
                    Discard Draft
                </button>
            {/if}
        </div>
    </div>
{/if}

{#if errorMessage}
    <div class="status-banner error" in:fade>
        ⚠️ {errorMessage}
    </div>
{/if}

<style lang="scss">
    .status-banner {
        padding: 1rem;
        border-radius: var(--radius-md);
        margin-bottom: 1.5rem;
        font-weight: 600;

        &.success {
            background: rgba(0, 255, 150, 0.1);
            color: #00ff96;
            border: 1px solid rgba(0, 255, 150, 0.2);
        }
        &.error {
            background: rgba(255, 50, 50, 0.1);
            color: #ff3232;
            border: 1px solid rgba(255, 50, 50, 0.2);
        }
        &.info {
            background: rgba(var(--text-primary-rgb), 0.05);
            color: var(--text-primary);
            border: 1px solid var(--border-glass);
            backdrop-filter: blur(10px);
        }

        .message-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;

            .action-btn {
                background: var(--text-primary);
                color: var(--bg-dark);
                border: none;
                padding: 0.4rem 0.8rem;
                border-radius: var(--radius-sm);
                font-size: 0.85rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
            }
        }
    }
</style>
