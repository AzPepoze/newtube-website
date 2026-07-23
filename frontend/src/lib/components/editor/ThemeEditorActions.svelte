<script lang="ts">
    import { defaultDescription } from "$lib/core/theme.svelte";

    let {
        themeName,
        description,
        images,
        coverImage,
        clearDraft,
        submitting,
        jsonError,
        titleError,
        descriptionError,
        isEdit,
        isServerDraft,
        handleSubmit,
    }: {
        themeName: string;
        description: string;
        images: string[];
        coverImage: string;
        clearDraft: () => void;
        submitting: boolean;
        jsonError: string;
        titleError: string;
        descriptionError: string;
        isEdit: boolean;
        isServerDraft: boolean;
        handleSubmit: (e: Event, publish?: boolean) => void;
    } = $props();
</script>

<div class="actions">
    {#if themeName || description !== defaultDescription || images.length > 0 || coverImage}
        <button
            type="button"
            class="clear-btn"
            onclick={clearDraft}
            disabled={submitting}
        >
            Clear Draft
        </button>
    {/if}
    <button
        type="submit"
        class="submit-btn premium-button"
        disabled={submitting ||
            !!jsonError ||
            !!titleError ||
            !!descriptionError}
    >
        {submitting
            ? "Saving..."
            : isEdit
              ? isServerDraft
                  ? "Publish Theme"
                  : "Update Theme"
              : "Publish Theme"}
    </button>
    {#if !isEdit || isServerDraft}
        <button
            type="button"
            class="draft-btn"
            onclick={(event) => handleSubmit(event, false)}
            disabled={submitting ||
                !!jsonError ||
                !!titleError ||
                !!descriptionError}
        >
            Save Draft
        </button>
    {/if}
</div>

<style lang="scss">
    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;

        .submit-btn {
            flex: 1;
            padding: 1.5rem 2rem;
            font-size: 1.1rem;
            margin: 0;
        }

        .clear-btn {
            padding: 0 2rem;
            background: transparent;
            border: 1px solid var(--border-glass);
            color: var(--text-muted);
            border-radius: var(--radius-md);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: rgba(var(--text-primary-rgb), 0.05);
                color: var(--text-primary);
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }

        .draft-btn {
            padding: 0 1.25rem;
            background: rgba(var(--text-primary-rgb), 0.05);
            border: 1px solid var(--border-glass);
            color: var(--text-primary);
            border-radius: var(--radius-md);
            font-weight: 700;
            cursor: pointer;

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }
    }
</style>
