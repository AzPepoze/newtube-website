<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    export type Review = {
        id: string;
        userId: string;
        rating: number;
        body?: string;
        createdAt?: string;
        updatedAt?: string;
        user?: { name?: string; avatarUrl?: string };
    };

    let {
        reviews,
        currentUser,
        formatDate,
        deleteReview,
    }: {
        reviews: Review[];
        currentUser: string;
        formatDate: (value?: string) => string;
        deleteReview: () => void;
    } = $props();
</script>

<div class="review-list">
    {#each reviews as review (review.id)}
        <article class="review-card">
            <div class="review-header">
                <div class="author">
                    {#if review.user?.avatarUrl}
                        <img
                            src={review.user.avatarUrl}
                            alt=""
                            class="avatar"
                        />
                    {:else}
                        <div class="avatar fallback">
                            {(review.user?.name || review.userId).charAt(0)}
                        </div>
                    {/if}
                    <div>
                        <strong
                            >{review.user?.name || "Community Member"}</strong
                        >
                        <div class="meta">{formatDate(review.createdAt)}</div>
                    </div>
                </div>
                <div class="review-stars">
                    {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
            </div>
            {#if review.body}<p>{review.body}</p>{/if}
            {#if review.userId === currentUser}
                <div class="review-actions">
                    <button
                        type="button"
                        class="quiet-action"
                        onclick={deleteReview}
                    >
                        <MaterialIcon name="delete" size={16} /> Delete my review
                    </button>
                </div>
            {/if}
        </article>
    {/each}
</div>

<style lang="scss">
    .review-list {
        display: grid;
        gap: 1rem;
        margin-top: 1.5rem;
    }
    .review-card {
        padding: 1rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.02);
    }
    .review-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }
    .author {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
    }
    .avatar.fallback {
        display: grid;
        place-items: center;
        background: var(--border-glass);
        font-weight: 700;
    }
    .meta {
        font-size: 0.8rem;
        color: var(--text-muted);
    }
    .review-stars {
        color: #f5c451;
    }
    .review-actions {
        margin-top: 0.75rem;
    }
    .quiet-action {
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;

        &:hover {
            color: var(--text-primary);
        }
    }
</style>
