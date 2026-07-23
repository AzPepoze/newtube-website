<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import ThemeCard from "$lib/components/theme/ThemeCard.svelte";
    import type { Theme } from "$lib/types/index";
    import { fade, fly, scale } from "svelte/transition";
    import { page } from "$app/state";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import CustomDropdown from "$lib/components/common/CustomDropdown.svelte";
    import { debounce } from "$lib/utils/debounce";

    const PAGE_SIZE = 12;
    let themes = $state<Theme[]>([]);
    let searchQuery = $state("");
    let sortBy = $state("popular");
    let selectedTags = $state<string[]>([]);
    let selectedCategories = $state<string[]>([]);
    let offset = $state(0);
    let total = $state(0);
    let pageLimit = $state(PAGE_SIZE);
    let loading = $state(true);
    let errorMessage = $state<string | null>(null);
    let initialized = false;
    let requestId = 0;
    let controller: AbortController | null = null;
    let taxonomyTags = $state<Array<{ name: string; slug: string }>>([]);
    let taxonomyCategories = $state<Array<{ name: string; slug: string }>>([]);

    const sortOptions = [
        { value: "popular", label: "Most Popular" },
        { value: "newest", label: "Recently Added" },
        { value: "alpha", label: "Alphabetical" },
    ];

    import { PUBLIC_API_URL } from "$lib/constants/index";

    function slugify(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    const tagOptions = $derived(
        (taxonomyTags.length
            ? taxonomyTags
            : [...new Set(themes.flatMap((theme) => theme.tags ?? []))].map(
                  (name) => ({ name, slug: slugify(name) }),
              )
        )
            .map(({ name, slug }) => ({ label: name, value: slug }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    );
    const categoryOptions = $derived(
        (taxonomyCategories.length
            ? taxonomyCategories
            : [
                  ...new Set(
                      themes
                          .map((theme) => theme.category)
                          .filter(
                              (category): category is string =>
                                  Boolean(category),
                          ),
                  ),
              ].map((name) => ({ name, slug: slugify(name) }))
        )
            .map(({ name, slug }) => ({ label: name, value: slug }))
            .sort((a, b) => a.label.localeCompare(b.label)),
    );
    const currentPage = $derived(Math.floor(offset / pageLimit) + 1);
    const totalPages = $derived(Math.max(1, Math.ceil(total / pageLimit)));
    const hasActiveFilters = $derived(
        Boolean(
            searchQuery || selectedTags.length || selectedCategories.length,
        ),
    );
    const pageNumbers = $derived.by(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    });

    function asOffset(value: string | null) {
        const parsed = Number.parseInt(value ?? "0", 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }

    function parseFilterValues(value: string | null) {
        return value
            ? [...new Set(value.split(",").map(slugify).filter(Boolean))]
            : [];
    }

    function syncStateFromUrl(params: URLSearchParams) {
        searchQuery = params.get("q") ?? "";
        sortBy = sortOptions.some((option) => option.value === params.get("sort"))
            ? (params.get("sort") ?? "popular")
            : "popular";
        selectedTags = parseFilterValues(params.get("tag"));
        selectedCategories = parseFilterValues(params.get("category"));
        offset = asOffset(params.get("offset"));
    }

    function stateSignature() {
        return [
            searchQuery,
            sortBy,
            selectedTags.join(","),
            selectedCategories.join(","),
            offset,
        ].join("\u0000");
    }

    function urlSignature(params: URLSearchParams) {
        return [
            params.get("q") ?? "",
            params.get("sort") ?? "popular",
            parseFilterValues(params.get("tag")).join(","),
            parseFilterValues(params.get("category")).join(","),
            asOffset(params.get("offset")),
        ].join("\u0000");
    }

    function buildSearchParams() {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (sortBy !== "popular") params.set("sort", sortBy);
        if (selectedTags.length) params.set("tag", selectedTags.join(","));
        if (selectedCategories.length) {
            params.set("category", selectedCategories.join(","));
        }
        params.set("limit", String(PAGE_SIZE));
        if (offset > 0) params.set("offset", String(offset));
        return params;
    }

    async function loadTaxonomy() {
        try {
            const [tagsResponse, categoriesResponse] = await Promise.all([
                fetch(`${PUBLIC_API_URL}/tags`, { credentials: "include" }),
                fetch(`${PUBLIC_API_URL}/categories`, { credentials: "include" }),
            ]);
            if (tagsResponse.ok) taxonomyTags = await tagsResponse.json();
            if (categoriesResponse.ok) taxonomyCategories = await categoriesResponse.json();
        } catch {
            // Existing theme metadata remains a useful fallback for older deployments.
        }
    }

    function updateUrl() {
        const params = buildSearchParams();
        void goto(`/discover?${params.toString()}`, {
            replaceState: true,
            keepFocus: true,
            noScroll: true,
        });
    }

    function matchesLegacyFilters(theme: Theme) {
        const tags = new Set(selectedTags);
        const categories = new Set(selectedCategories);
        return (
            (!tags.size ||
                (theme.tags ?? []).some((value) => tags.has(slugify(value)))) &&
            (!categories.size ||
                (theme.category && categories.has(slugify(theme.category))))
        );
    }

    async function fetchThemes() {
        const thisRequest = ++requestId;
        controller?.abort();
        controller = new AbortController();
        loading = true;
        errorMessage = null;
        try {
            const params = buildSearchParams();
            const response = await fetch(`${PUBLIC_API_URL}/themes?${params}`, {
                credentials: "include",
                signal: controller.signal,
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    `Failed to fetch themes: ${response.status} ${errorText}`,
                );
            }
            const data: unknown = await response.json();
            if (thisRequest !== requestId) return;

            // Older deployments return Theme[]; preserve useful pagination and
            // tag/category filtering locally until the paginated API is deployed.
            if (Array.isArray(data)) {
                const matchingThemes = (data as Theme[]).filter(matchesLegacyFilters);
                total = matchingThemes.length;
                pageLimit = PAGE_SIZE;
                themes = matchingThemes.slice(offset, offset + pageLimit);
            } else if (
                data &&
                typeof data === "object" &&
                Array.isArray((data as { items?: unknown }).items)
            ) {
                const result = data as {
                    items: Theme[];
                    total?: number;
                    limit?: number;
                    offset?: number;
                };
                themes = result.items;
                total =
                    typeof result.total === "number" && Number.isFinite(result.total)
                        ? Math.max(0, result.total)
                        : result.items.length;
                pageLimit = result.limit && result.limit > 0 ? result.limit : PAGE_SIZE;
                offset =
                    typeof result.offset === "number" && result.offset >= 0
                        ? result.offset
                        : offset;
            } else {
                throw new Error("The themes API returned an unexpected response.");
            }
        } catch (error) {
            if ((error as DOMException).name === "AbortError") return;
            if (thisRequest !== requestId) return;
            errorMessage = "We couldn't load themes right now. Please try again.";
            themes = [];
            total = 0;
        } finally {
            if (thisRequest === requestId) loading = false;
        }
    }

    onMount(() => {
        syncStateFromUrl(page.url.searchParams);
        initialized = true;
        loadTaxonomy();
        fetchThemes();
        return () => controller?.abort();
    });

    function applyFilters() {
        offset = 0;
        updateUrl();
        fetchThemes();
    }

    const debouncedFilterChange = debounce(applyFilters, 500);

    function queueFilterChange() {
        debouncedFilterChange();
    }

    $effect(() => {
        const params = page.url.searchParams;
        if (initialized && urlSignature(params) !== stateSignature()) {
            syncStateFromUrl(params);
            fetchThemes();
        }
    });

    function goToPage(pageNumber: number) {
        const nextOffset = (pageNumber - 1) * pageLimit;
        if (nextOffset === offset || pageNumber < 1 || pageNumber > totalPages) return;
        offset = nextOffset;
        updateUrl();
        fetchThemes();
    }

    function clearFilters() {
        searchQuery = "";
        selectedTags = [];
        selectedCategories = [];
        applyFilters();
    }

    function clearSearch() {
        searchQuery = "";
        applyFilters();
    }
</script>

<div
    class="discover-container"
    in:scale={{ delay: 200, start: 0.98, duration: 300 }}
    out:scale={{ start: 0.98, duration: 200 }}
>
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
                    <button
                        class="clear-search"
                        onclick={clearSearch}
                    >
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

            <div class="filter-dropdown">
                <CustomDropdown
                    options={categoryOptions}
                    multiple={true}
                    bind:selectedValues={selectedCategories}
                    placeholder="All categories"
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

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Curating themes for you...</p>
        </div>
    {:else if errorMessage}
        <div class="empty-state error-state" role="alert">
            <MaterialIcon name="error" size={28} />
            <p>{errorMessage}</p>
            <button class="clear-btn premium-button glass-panel" onclick={fetchThemes}>
                <MaterialIcon name="refresh" size={16} /> Try Again
            </button>
        </div>
    {:else}
        <div class="theme-grid" in:fade={{ duration: 600 }}>
            {#each themes as theme (theme.themeId)}
                <div in:fly={{ y: 20, duration: 500 }}>
                    <ThemeCard {theme} />
                </div>
            {/each}
        </div>

        {#if themes.length === 0}
            <div class="empty-state">
                <MaterialIcon name="search_off" size={28} />
                <p>No themes match those filters.</p>
                {#if hasActiveFilters}
                    <button class="clear-btn premium-button glass-panel" onclick={clearFilters}>
                        <MaterialIcon name="close" size={16} /> Clear Filters
                    </button>
                {/if}
            </div>
        {:else}
            <div class="results-summary" aria-live="polite">
                Showing {offset + 1}–{Math.min(offset + themes.length, total)} of {total} themes
            </div>
        {/if}

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
                    >{pageNumber}</button>
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
    {/if}
</div>

<style lang="scss">
    .discover-container {
        padding: 2rem 0;
    }

    .discover-controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 3rem;
        gap: 2rem;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: flex-start;
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

        :global(.dropdown-container) {
            width: 13rem;
        }

        :global(.dropdown-trigger) {
            border-radius: var(--radius-lg);
        }
    }

    .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr));
        gap: 3rem;
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

    .pagination {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 1.25rem;

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

    @media (max-width: 768px) {
        .discover-container {
            padding-top: 1rem;
        }

        .discover-controls {
            gap: 1rem;
            margin-bottom: 2rem;

            .controls-left {
                width: 100%;

                .filter-dropdown {
                    width: 100%;
                }
            }

            .search-wrapper {
                padding: 0.75rem 1rem;
            }
        }

        .sort-wrapper {
            width: 100%;
            justify-content: space-between;

            :global(.dropdown-container) {
                width: min(70%, 16rem);
            }
        }

        .theme-grid {
            gap: 1rem;
        }

        .pagination {
            gap: 0.25rem;
            flex-wrap: wrap;
        }
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
