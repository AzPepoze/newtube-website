<script lang="ts">
    import { onMount } from "svelte";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { getUserId } from "$lib/utils/auth";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    type Review = {
        id: string;
        userId: string;
        rating: number;
        body?: string;
        createdAt?: string;
        updatedAt?: string;
        user?: { name?: string; avatarUrl?: string };
    };

    type ThemeVersion = {
        id: string;
        versionNumber?: number;
        themeName?: string;
        description?: string;
        createdAt?: string;
    };

    let { themeId }: { themeId: string } = $props();
    let reviews = $state<Review[]>([]);
    let versions = $state<ThemeVersion[]>([]);
    let averageRating = $state<number | null>(null);
    let reviewCount = $state(0);
    let rating = $state(0);
    let body = $state("");
    let showReport = $state(false);
    let reportReason = $state("broken");
    let reportDetails = $state("");
    let feedback = $state("");
    let loading = $state(true);
    let submitting = $state(false);
    const currentUser = getUserId() || "";

    function unwrapList(data: any, preferred: string) {
        return Array.isArray(data)
            ? data
            : data?.[preferred] || data?.items || [];
    }

    function formatDate(value?: string) {
        return value
            ? new Date(value).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
              })
            : "Recently";
    }

    async function loadCommunity() {
        loading = true;
        try {
            const [reviewResponse, versionResponse] = await Promise.all([
                fetch(`${PUBLIC_API_URL}/themes/${themeId}/reviews`, {
                    credentials: "include",
                }),
                fetch(`${PUBLIC_API_URL}/themes/${themeId}/versions`, {
                    credentials: "include",
                }),
            ]);

            if (reviewResponse.ok) {
                const data = await reviewResponse.json();
                reviews = unwrapList(data, "reviews");
                reviewCount = Number(
                    data?.total ?? data?.count ?? reviews.length,
                );
                const value =
                    data?.rating ?? data?.averageRating ?? data?.average;
                averageRating = value == null ? null : Number(value);
                const mine = reviews.find(
                    (review) => review.userId === currentUser,
                );
                if (mine) {
                    rating = mine.rating;
                    body = mine.body || "";
                }
            }
            if (versionResponse.ok) {
                versions = unwrapList(await versionResponse.json(), "versions");
            }
        } finally {
            loading = false;
        }
    }

    async function saveReview() {
        if (!currentUser) {
            feedback = "Sign in to leave a review.";
            return;
        }
        if (!rating) {
            feedback = "Choose a rating first.";
            return;
        }
        submitting = true;
        feedback = "";
        try {
            const response = await fetch(
                `${PUBLIC_API_URL}/themes/${themeId}/review`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ rating, body }),
                },
            );
            if (!response.ok) throw new Error("Unable to save review");
            feedback = "Your review has been saved.";
            await loadCommunity();
        } catch (error) {
            feedback =
                error instanceof Error
                    ? error.message
                    : "Unable to save review.";
        } finally {
            submitting = false;
        }
    }

    async function submitReport() {
        if (!currentUser) {
            feedback = "Sign in to report a theme.";
            return;
        }
        submitting = true;
        try {
            const response = await fetch(
                `${PUBLIC_API_URL}/themes/${themeId}/reports`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reason: reportReason,
                        details: reportDetails,
                    }),
                },
            );
            if (!response.ok) throw new Error("Unable to submit report");
            feedback = "Thanks — your report has been submitted for review.";
            showReport = false;
            reportDetails = "";
        } catch (error) {
            feedback =
                error instanceof Error
                    ? error.message
                    : "Unable to submit report.";
        } finally {
            submitting = false;
        }
    }

    onMount(loadCommunity);
</script>

<section id="reviews" class="community-panel glass-panel quick-scroll-section">
    <div class="section-heading">
        <div>
            <p class="eyebrow">Community feedback</p>
            <h3>Reviews</h3>
        </div>
        {#if averageRating !== null}
            <div
                class="rating-summary"
                aria-label={`${averageRating.toFixed(1)} out of 5 stars`}
            >
                <strong>{averageRating.toFixed(1)}</strong><span>★</span><small
                    >{reviewCount}
                    {reviewCount === 1 ? "review" : "reviews"}</small
                >
            </div>
        {/if}
    </div>

    {#if currentUser}
        <form
            class="review-form"
            onsubmit={(event) => {
                event.preventDefault();
                saveReview();
            }}
        >
            <div class="star-picker" aria-label="Your rating">
                {#each [1, 2, 3, 4, 5] as star}
                    <button
                        type="button"
                        class:active={star <= rating}
                        aria-label={`${star} star${star === 1 ? "" : "s"}`}
                        onclick={() => (rating = star)}>★</button
                    >
                {/each}
            </div>
            <textarea
                bind:value={body}
                maxlength="2000"
                placeholder="Share what works well (optional)"
                aria-label="Review text"></textarea>
            <button class="primary-action" type="submit" disabled={submitting}
                >{submitting ? "Saving…" : "Save review"}</button
            >
        </form>
    {:else}
        <p class="hint">Sign in to rate and review this theme.</p>
    {/if}

    {#if loading}
        <p class="hint">Loading community feedback…</p>
    {:else if reviews.length}
        <div class="review-list">
            {#each reviews as review (review.id)}
                <article class="review">
                    <div class="review-meta">
                        <strong>{review.user?.name || "NewTube user"}</strong>
                        <span class="stars"
                            >{"★".repeat(review.rating)}{"☆".repeat(
                                5 - review.rating,
                            )}</span
                        >
                        <time
                            >{formatDate(
                                review.updatedAt || review.createdAt,
                            )}</time
                        >
                    </div>
                    {#if review.body}<p>{review.body}</p>{/if}
                </article>
            {/each}
        </div>
    {:else}
        <p class="hint">
            No reviews yet. Be the first to share your experience.
        </p>
    {/if}
</section>

<section id="versions" class="community-panel glass-panel quick-scroll-section">
    <div class="section-heading">
        <div>
            <p class="eyebrow">Creator history</p>
            <h3>Version history</h3>
        </div>
        <button
            type="button"
            class="quiet-action"
            onclick={() => (showReport = !showReport)}
            ><MaterialIcon name="flag" size={16} /> Report theme</button
        >
    </div>
    {#if versions.length}
        <ol class="version-list">
            {#each versions as version (version.id)}
                <li>
                    <strong>Version {version.versionNumber || "—"}</strong><span
                        >{version.themeName || "Theme snapshot"} · {formatDate(
                            version.createdAt,
                        )}</span
                    >
                </li>
            {/each}
        </ol>
    {:else if !loading}
        <p class="hint">
            Version history will appear after this theme is updated.
        </p>
    {/if}

    {#if showReport}
        <form
            class="report-form"
            onsubmit={(event) => {
                event.preventDefault();
                submitReport();
            }}
        >
            <label
                >Reason <select bind:value={reportReason}
                    ><option value="broken">Broken or unsafe</option><option
                        value="copyright">Copyright concern</option
                    ><option value="inappropriate">Inappropriate content</option
                    ><option value="malware">Malware or unsafe link</option
                    ><option value="spam">Spam</option><option value="other"
                        >Other</option
                    ></select
                ></label
            >
            <label
                >Details <textarea
                    bind:value={reportDetails}
                    maxlength="2000"
                    placeholder="Help moderators understand the issue"
                ></textarea></label
            >
            <div class="report-actions">
                <button
                    type="button"
                    class="quiet-action"
                    onclick={() => (showReport = false)}>Cancel</button
                ><button
                    class="primary-action"
                    type="submit"
                    disabled={submitting}>Submit report</button
                >
            </div>
        </form>
    {/if}
    {#if feedback}<p class="feedback" role="status">{feedback}</p>{/if}
</section>

<style lang="scss">
    .community-panel {
        padding: 1.5rem;
    }
    .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.25rem;
    }
    h3 {
        margin: 0;
        font-size: 1.1rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
    }
    .eyebrow {
        margin: 0 0 0.25rem;
        font-size: 0.75rem;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
    }
    .rating-summary {
        display: flex;
        gap: 0.35rem;
        align-items: baseline;
        color: #f5c451;
    }
    .rating-summary strong {
        font-size: 1.5rem;
    }
    .rating-summary small {
        color: var(--text-muted);
        margin-left: 0.35rem;
    }
    .review-form,
    .report-form {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.025);
    }
    textarea,
    select {
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
    select {
        min-height: 2.5rem;
    }
    label {
        display: grid;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: var(--text-secondary);
    }
    .star-picker {
        display: flex;
        gap: 0.2rem;
    }
    .star-picker button {
        border: 0;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 1.6rem;
        padding: 0;
    }
    .star-picker button.active {
        color: #f5c451;
    }
    .primary-action,
    .quiet-action {
        border-radius: var(--radius-sm);
        padding: 0.6rem 0.85rem;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
    }
    .primary-action {
        border: 0;
        background: var(--text-primary);
        color: var(--bg-dark);
        justify-self: start;
    }
    .quiet-action {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        border: 1px solid var(--border-glass);
        background: transparent;
        color: var(--text-secondary);
    }
    .review-list {
        display: grid;
        gap: 1rem;
        margin-top: 1.25rem;
    }
    .review {
        border-top: 1px solid var(--border-glass);
        padding-top: 1rem;
    }
    .review p {
        margin: 0.6rem 0 0;
        line-height: 1.6;
    }
    .review-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
        align-items: baseline;
        font-size: 0.85rem;
    }
    .stars {
        color: #f5c451;
        letter-spacing: 0.05em;
    }
    time,
    .hint {
        color: var(--text-muted);
    }
    .hint {
        margin: 1rem 0 0;
    }
    .version-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        gap: 0.75rem;
    }
    .version-list li {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.8rem 0;
        border-top: 1px solid var(--border-glass);
    }
    .version-list span {
        color: var(--text-muted);
        font-size: 0.9rem;
        text-align: right;
    }
    .report-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
    .feedback {
        color: var(--text-secondary);
        margin: 1rem 0 0;
    }
    @media (max-width: 600px) {
        .section-heading,
        .version-list li {
            align-items: flex-start;
            flex-direction: column;
        }
        .version-list span {
            text-align: left;
        }
    }
</style>
