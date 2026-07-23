<script lang="ts">
    import { onMount } from "svelte";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { getUserId } from "$lib/utils/auth";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import ThemeVersionList from "./ThemeVersionList.svelte";
    import ThemeReportForm from "./ThemeReportForm.svelte";
    import ThemeReviewForm from "./ThemeReviewForm.svelte";
    import ThemeReviewList from "./ThemeReviewList.svelte";

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

    async function deleteReview() {
        if (!currentUser) return;
        submitting = true;
        feedback = "";
        try {
            const response = await fetch(
                `${PUBLIC_API_URL}/themes/${themeId}/review`,
                {
                    method: "DELETE",
                    credentials: "include",
                },
            );
            if (!response.ok) throw new Error("Unable to delete review");
            rating = 0;
            body = "";
            feedback = "Your review has been removed.";
            await loadCommunity();
        } catch (error) {
            feedback =
                error instanceof Error
                    ? error.message
                    : "Unable to delete review.";
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
        <ThemeReviewForm bind:rating bind:body {submitting} {saveReview} />
    {:else}
        <p class="hint">Sign in to rate and review this theme.</p>
    {/if}

    {#if loading}
        <p class="hint">Loading community feedback…</p>
    {:else if reviews.length}
        <ThemeReviewList {reviews} {currentUser} {formatDate} {deleteReview} />
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
    <ThemeVersionList {versions} {formatDate} />

    <ThemeReportForm
        bind:showReport
        bind:reportReason
        bind:reportDetails
        {submitting}
        {submitReport}
    />
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
    .hint {
        color: var(--text-muted);
        margin: 1rem 0 0;
    }
    .quiet-action {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        border: 1px solid var(--border-glass);
        background: transparent;
        color: var(--text-secondary);
        border-radius: var(--radius-sm);
        padding: 0.6rem 0.85rem;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
    }
    .feedback {
        color: var(--text-secondary);
        margin: 1rem 0 0;
    }
    @media (max-width: 600px) {
        .section-heading {
            align-items: flex-start;
            flex-direction: column;
        }
    }
</style>
