<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    let {
        rating = $bindable(),
        body = $bindable(),
        submitting,
        saveReview,
    }: {
        rating: number;
        body: string;
        submitting: boolean;
        saveReview: () => void;
    } = $props();
</script>

<form
    class="review-form"
    onsubmit={(event) => {
        event.preventDefault();
        saveReview();
    }}
>
    <div class="rating-picker" role="radiogroup" aria-label="Theme rating">
        {#each [1, 2, 3, 4, 5] as star}
            <button
                type="button"
                class="star-button"
                class:active={rating >= star}
                onclick={() => (rating = star)}
                aria-label="{star} stars"
            >
                <MaterialIcon
                    name={rating >= star ? "star" : "star_outline"}
                    size={22}
                />
            </button>
        {/each}
    </div>
    <textarea
        bind:value={body}
        maxlength="2000"
        placeholder="Share what works well or what could be improved"
    ></textarea>
    <button class="primary-action" type="submit" disabled={submitting}>
        Submit review
    </button>
</form>

<style lang="scss">
    .review-form {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.025);
    }
    .rating-picker {
        display: flex;
        gap: 0.35rem;

        .star-button {
            border: none;
            background: transparent;
            color: var(--text-muted);
            cursor: pointer;
            padding: 0;

            &.active {
                color: #f5c451;
            }
        }
    }
    textarea {
        width: 100%;
        min-height: 4.5rem;
        box-sizing: border-box;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(0, 0, 0, 0.15);
        color: var(--text-primary);
        padding: 0.7rem;
        font: inherit;
    }
    .primary-action {
        border: none;
        background: var(--text-primary);
        color: var(--bg-dark);
        padding: 0.5rem 1rem;
        border-radius: var(--radius-sm);
        font-weight: 600;
        cursor: pointer;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
</style>
