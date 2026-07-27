<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import ThemeCard from "$lib/components/theme/ThemeCard.svelte";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import DiscoverPagination from "./DiscoverPagination.svelte";

    let {
        themes,
        loading,
        errorMessage,
        hasActiveFilters,
        offset,
        total,
        currentPage,
        totalPages,
        pageNumbers,
        onRetry,
        onClearFilters,
        onGoToPage,
        onPreview,
    }: {
        themes: Theme[];
        loading: boolean;
        errorMessage: string | null;
        hasActiveFilters: boolean;
        offset: number;
        total: number;
        currentPage: number;
        totalPages: number;
        pageNumbers: number[];
        onRetry: () => void;
        onClearFilters: () => void;
        onGoToPage: (pageNumber: number) => void;
        onPreview?: (theme: Theme) => void;
    } = $props();
</script>

{#if loading}
    <div class="loading-state">
        <div class="spinner"></div>
        <p>Curating themes for you...</p>
    </div>
{:else if errorMessage}
    <div class="empty-state error-state" role="alert">
        <MaterialIcon name="error" size={28} />
        <p>{errorMessage}</p>
        <button class="clear-btn premium-button glass-panel" onclick={onRetry}>
            <MaterialIcon name="refresh" size={16} /> Try Again
        </button>
    </div>
{:else}
    <div class="theme-grid" in:fade={{ duration: 600 }}>
        {#each themes as theme (theme.themeId)}
            <div in:fly={{ y: 20, duration: 500 }}>
                <ThemeCard {theme} onPreview={(t) => onPreview?.(t)} />
            </div>
        {/each}
    </div>

    {#if themes.length === 0}
        <div class="empty-state">
            <MaterialIcon name="search_off" size={28} />
            <p>No themes match those filters.</p>
            {#if hasActiveFilters}
                <button
                    class="clear-btn premium-button glass-panel"
                    onclick={onClearFilters}
                >
                    <MaterialIcon name="close" size={16} /> Clear Filters
                </button>
            {/if}
        </div>
    {:else}
        <div class="results-summary" aria-live="polite">
            Showing {offset + 1}–{Math.min(offset + themes.length, total)} of
            {total} themes
        </div>
    {/if}

    <DiscoverPagination
        {currentPage}
        {totalPages}
        {pageNumbers}
        goToPage={onGoToPage}
    />
{/if}

<style lang="scss">
    .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        gap: 3rem;

        @media (max-width: 768px) {
            gap: 1rem;
        }
    }

    .loading-state {
        text-align: center;
        padding: 5rem 0;
        color: var(--text-muted);

        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(var(--text-primary-rgb, 255, 255, 255), 0.1);
            border-top-color: var(--primary-glow);
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            animation: spin 1s linear infinite;
        }
    }

    .results-summary {
        margin-top: 2rem;
        color: var(--text-muted);
        font-size: 0.9rem;
        text-align: center;
    }

    .empty-state {
        text-align: center;
        padding: 5rem 0;

        p {
            font-size: 1.25rem;
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }

        button.clear-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1.2rem 2.5rem;
            font-size: 1.1rem;
            background: var(--text-primary);
            color: var(--bg-dark);
            border: none;

            &:hover {
                transform: translateY(-2px);
                background: var(--text-primary);
                opacity: 0.9;
            }
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
