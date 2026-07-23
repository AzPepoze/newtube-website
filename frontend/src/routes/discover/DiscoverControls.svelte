<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import CustomDropdown from "$lib/components/common/CustomDropdown.svelte";

    let {
        searchQuery = $bindable(),
        selectedTags = $bindable(),
        sortBy = $bindable(),
        tagOptions,
        sortOptions,
        applyFilters,
        queueFilterChange,
        clearSearch,
    }: {
        searchQuery: string;
        selectedTags: string[];
        sortBy: string;
        tagOptions: Array<{ label: string; value: string; group: string }>;
        sortOptions: Array<{ label: string; value: string }>;
        applyFilters: () => void;
        queueFilterChange: () => void;
        clearSearch: () => void;
    } = $props();
</script>

<div class="discover-controls">
    <div class="controls-left">
        <div class="search-wrapper glass-panel">
            <MaterialIcon name="search" size={22} />
            <input
                type="text"
                placeholder="Search themes..."
                bind:value={searchQuery}
                onkeydown={(e) => e.key === "Enter" && applyFilters()}
                oninput={queueFilterChange}
            />
            {#if searchQuery}
                <button class="clear-search" onclick={clearSearch}>
                    <MaterialIcon name="close" size={14} />
                </button>
            {/if}
        </div>

        <div class="filter-dropdown">
            <CustomDropdown
                options={tagOptions}
                multiple={true}
                bind:selectedValues={selectedTags}
                placeholder="All tags"
                onValuesChange={queueFilterChange}
            />
        </div>
    </div>

    <div class="sort-wrapper">
        <span>Sort by:</span>
        <CustomDropdown
            options={sortOptions}
            bind:value={sortBy}
            onChange={applyFilters}
        />
    </div>
</div>

<style lang="scss">
    .discover-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        gap: 2rem;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 2rem;
        }

        .controls-left {
            display: flex;
            align-items: center;
            gap: 2rem;
            flex: 1;
            min-width: 0;
            width: 100%;

            @media (max-width: 1050px) {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }

            .filter-dropdown {
                width: min(100%, 14rem);

                @media (max-width: 768px) {
                    width: 100%;
                }

                :global(.dropdown-container),
                :global(.dropdown-trigger) {
                    width: 100%;
                }

                :global(.dropdown-trigger) {
                    min-height: 2.8rem;
                    border-radius: var(--radius-lg);
                }
            }
        }

        .search-wrapper {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.8rem 1.5rem;
            background: rgba(var(--text-primary-rgb), 0.05);
            border-radius: var(--radius-lg);
            flex: 1;
            min-width: 0;
            width: 100%;
            transition: all 0.3s;
            color: var(--text-secondary);

            @media (max-width: 768px) {
                padding: 0.75rem 1rem;
            }

            :global(.light) & {
                background: #ffffff;
                border-color: rgba(0, 0, 0, 0.1);
            }

            &:focus-within {
                background: rgba(var(--text-primary-rgb), 0.08);
                border-color: rgba(var(--text-primary-rgb), 0.2);
                color: var(--text-primary);

                :global(.light) & {
                    background: #ffffff;
                    border-color: rgba(0, 0, 0, 0.2);
                }
            }

            input {
                min-width: 0;
                background: transparent;
                border: none;
                color: inherit;
                font-family: inherit;
                font-size: 1.1rem;
                width: 100%;

                &::placeholder {
                    color: var(--text-muted);
                }

                &:focus {
                    outline: none;
                }
            }

            .clear-search {
                background: transparent;
                border: none;
                color: var(--text-muted);
                cursor: pointer;
                display: flex;
                padding: 4px;
                border-radius: 50%;
                transition: all 0.2s;

                &:hover {
                    background: rgba(var(--text-primary-rgb), 0.1);
                    color: var(--text-primary);
                }
            }
        }
    }

    .sort-wrapper {
        display: flex;
        align-items: center;
        gap: 1rem;
        color: var(--text-secondary);
        font-size: 1.1rem;

        @media (max-width: 768px) {
            width: 100%;
            justify-content: space-between;

            :global(.dropdown-container) {
                width: min(70%, 16rem);
            }
        }

        :global(.dropdown-container) {
            width: 13rem;
        }

        :global(.dropdown-trigger) {
            border-radius: var(--radius-lg);
        }
    }
</style>
