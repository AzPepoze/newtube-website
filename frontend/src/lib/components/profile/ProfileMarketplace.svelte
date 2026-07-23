<script lang="ts">
    import ThemeCard from "$lib/components/theme/ThemeCard.svelte";

    let {
        reviews = [],
        drafts = [],
    }: {
        reviews?: any[];
        drafts?: any[];
    } = $props();

    function formatDate(value?: string) {
        return value
            ? new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
              })
            : "Recently";
    }
</script>

<section class="marketplace-section">
    <div class="section-heading">
        <div>
            <p class="eyebrow">Keep creating</p>
            <h2 class="premium-font">Drafts</h2>
        </div>
    </div>
    {#if drafts.length}
        <div class="theme-grid">
            {#each drafts as draft (draft.themeId)}
                <div class="draft-card">
                    <ThemeCard theme={draft} /><a
                        class="edit"
                        href={`/themes/edit/${draft.themeId}`}
                        >Continue editing</a
                    >
                </div>
            {/each}
        </div>
    {:else}
        <p class="empty">
            No server drafts. Save a draft from the editor to return to it on
            any device.
        </p>
    {/if}
</section>

<section class="marketplace-section">
    <div class="section-heading">
        <div>
            <p class="eyebrow">Your voice</p>
            <h2 class="premium-font">Review activity</h2>
        </div>
    </div>
    {#if reviews.length}
        <ul class="activity-list">
            {#each reviews as review (review.id)}
                <li class="glass-panel">
                    <div>
                        <strong
                            >{review.theme?.themeName ||
                                review.themeName ||
                                "Theme review"}</strong
                        ><span>{"★".repeat(review.rating || 0)}</span
                        >{#if review.body}<p>{review.body}</p>{/if}
                    </div>
                    <time
                        >{formatDate(
                            review.updatedAt || review.createdAt,
                        )}</time
                    >
                </li>
            {/each}
        </ul>
    {:else}
        <p class="empty">Your published reviews will appear here.</p>
    {/if}
</section>

<style lang="scss">
    .marketplace-section {
        margin-top: 4.5rem;
    }
    .section-heading {
        margin-bottom: 1.25rem;
    }
    .section-heading h2 {
        margin: 0;
        font-size: 1.75rem;
        color: var(--text-secondary);
    }
    .eyebrow {
        margin: 0 0 0.35rem;
        color: var(--text-muted);
        text-transform: uppercase;
        font-size: 0.75rem;
        letter-spacing: 0.08em;
    }
    .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1.5rem;
    }
    .draft-card {
        display: grid;
        gap: 0.6rem;
    }
    .edit {
        text-align: center;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(var(--text-primary-rgb), 0.05);
        color: var(--text-primary);
        padding: 0.65rem 0.85rem;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        text-decoration: none;
    }
    .activity-list {
        list-style: none;
        padding: 0;
        display: grid;
        gap: 0.75rem;
    }
    .activity-list li {
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
    }
    .activity-list strong {
        display: block;
    }
    .activity-list span {
        color: #f5c451;
        font-size: 0.85rem;
    }
    .activity-list p {
        margin: 0.45rem 0 0;
        color: var(--text-secondary);
    }
    time,
    .empty {
        color: var(--text-muted);
    }
    @media (max-width: 700px) {
        .activity-list li {
            flex-direction: column;
        }
    }
</style>
