<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    let {
        currentPage,
        totalPages,
        pageNumbers,
        goToPage,
    }: {
        currentPage: number;
        totalPages: number;
        pageNumbers: number[];
        goToPage: (page: number) => void;
    } = $props();
</script>

{#if totalPages > 1}
    <nav class="pagination" aria-label="Theme discovery pages">
        <button
            class="pagination-btn"
            onclick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
        >
            <MaterialIcon name="chevron_left" size={20} />
        </button>
        {#each pageNumbers as pageNumber}
            <button
                class="pagination-btn"
                class:active={pageNumber === currentPage}
                onclick={() => goToPage(pageNumber)}
                aria-current={pageNumber === currentPage ? "page" : undefined}
            >
                {pageNumber}
            </button>
        {/each}
        <button
            class="pagination-btn"
            onclick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next page"
        >
            <MaterialIcon name="chevron_right" size={20} />
        </button>
    </nav>
{/if}

<style lang="scss">
    .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.25rem;

        @media (max-width: 768px) {
            gap: 0.25rem;
            flex-wrap: wrap;
        }

        .pagination-btn {
            min-width: 2.5rem;
            height: 2.5rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border-glass);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            background: rgba(var(--text-primary-rgb), 0.05);
            cursor: pointer;

            &:hover:not(:disabled),
            &.active {
                background: var(--text-primary);
                color: var(--bg-dark);
            }

            &:disabled {
                cursor: not-allowed;
                opacity: 0.4;
            }
        }
    }
</style>
