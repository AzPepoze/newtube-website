<script lang="ts">
    import { onMount } from "svelte";
    import { afterNavigate, goto } from "$app/navigation";
    import ThemeCard from "$lib/components/theme/ThemeCard.svelte";
    import type { Theme } from "$lib/types/index";
    import { fade, fly, scale } from "svelte/transition";
    import { page } from "$app/state";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import { debounce } from "$lib/utils/debounce";
    import DiscoverControls from "./DiscoverControls.svelte";
    import DiscoverPagination from "./DiscoverPagination.svelte";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import {
        asOffset,
        buildSearchParams as createParams,
        matchesLegacyFilters,
        parseFilterValues,
        slugify,
    } from "./discoverUtils";

    const PAGE_SIZE = 12;
    let themes = $state<Theme[]>([]);
    let searchQuery = $state("");
    let sortBy = $state("popular");
    let selectedTags = $state<string[]>([]);
    let offset = $state(0);
    let total = $state(0);
    let pageLimit = $state(PAGE_SIZE);
    let loading = $state(true);
    let errorMessage = $state<string | null>(null);
    let initialized = false;
    let requestId = 0;
    let controller: AbortController | null = null;
    let filterRequestVersion = 0;
    const localNavigationHrefs = new Set<string>();
    let availableTags = $state<
        Array<{ name: string; slug: string; groupName?: string }>
    >([]);

    const sortOptions = [
        { value: "popular", label: "Most Popular" },
        { value: "newest", label: "Recently Added" },
        { value: "alpha", label: "Alphabetical" },
    ];

    const tagOptions = $derived(
        (availableTags.length
            ? availableTags
            : [...new Set(themes.flatMap((theme) => theme.tags ?? []))].map(
                  (name) => ({ name, slug: slugify(name), groupName: "" }),
              )
        ).map(({ name, slug, groupName }) => ({
            label: name,
            value: slug,
            group: groupName || "",
        })),
    );

    const currentPage = $derived(Math.floor(offset / pageLimit) + 1);
    const totalPages = $derived(Math.max(1, Math.ceil(total / pageLimit)));
    const hasActiveFilters = $derived(
        Boolean(searchQuery || selectedTags.length),
    );
    const pageNumbers = $derived.by(() => {
        const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
        const end = Math.min(totalPages, start + 4);
        return Array.from(
            { length: end - start + 1 },
            (_, index) => start + index,
        );
    });

    function syncStateFromUrl(params: URLSearchParams) {
        searchQuery = params.get("q") ?? "";
        sortBy = sortOptions.some(
            (option) => option.value === params.get("sort"),
        )
            ? (params.get("sort") ?? "popular")
            : "popular";
        selectedTags = parseFilterValues(params.get("tag"));
        offset = asOffset(params.get("offset"));
    }

    function buildSearchParams() {
        return createParams(
            searchQuery,
            sortBy,
            selectedTags,
            PAGE_SIZE,
            offset,
        );
    }

    async function loadTagsAndCategories() {
        try {
            const tagsResponse = await fetch(`${PUBLIC_API_URL}/tags`, {
                credentials: "include",
            });
            if (tagsResponse.ok) availableTags = await tagsResponse.json();
        } catch {
            // Fallback
        }
    }

    function updateUrl() {
        const params = buildSearchParams();
        const href = `/discover?${params.toString()}`;
        localNavigationHrefs.add(href);
        void goto(href, {
            replaceState: true,
            keepFocus: true,
            noScroll: true,
        }).catch(() => localNavigationHrefs.delete(href));
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

            if (Array.isArray(data)) {
                const matchingThemes = (data as Theme[]).filter((theme) =>
                    matchesLegacyFilters(theme, selectedTags),
                );
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
                    typeof result.total === "number" &&
                    Number.isFinite(result.total)
                        ? Math.max(0, result.total)
                        : result.items.length;
                pageLimit =
                    result.limit && result.limit > 0 ? result.limit : PAGE_SIZE;
                offset =
                    typeof result.offset === "number" && result.offset >= 0
                        ? result.offset
                        : offset;
            } else {
                throw new Error(
                    "The themes API returned an unexpected response.",
                );
            }
        } catch (error) {
            if ((error as DOMException).name === "AbortError") return;
            if (thisRequest !== requestId) return;
            errorMessage =
                "We couldn't load themes right now. Please try again.";
            themes = [];
            total = 0;
        } finally {
            if (thisRequest === requestId) loading = false;
        }
    }

    onMount(() => {
        syncStateFromUrl(page.url.searchParams);
        initialized = true;
        loadTagsAndCategories();
        fetchThemes();
        return () => {
            filterRequestVersion += 1;
            controller?.abort();
        };
    });

    function applyFilters() {
        filterRequestVersion += 1;
        offset = 0;
        updateUrl();
        fetchThemes();
    }

    const debouncedFilterChange = debounce((version: number) => {
        if (version === filterRequestVersion) fetchThemes();
    }, 500);

    function queueFilterChange() {
        filterRequestVersion += 1;
        offset = 0;
        updateUrl();
        debouncedFilterChange(filterRequestVersion);
    }

    afterNavigate((navigation) => {
        if (!initialized || navigation.type === "enter") return;

        const href = `${page.url.pathname}${page.url.search}`;
        if (
            navigation.type !== "popstate" &&
            localNavigationHrefs.delete(href)
        ) {
            return;
        }

        localNavigationHrefs.clear();
        filterRequestVersion += 1;
        syncStateFromUrl(page.url.searchParams);
        fetchThemes();
    });

    function goToPage(pageNumber: number) {
        const nextOffset = (pageNumber - 1) * pageLimit;
        if (nextOffset === offset || pageNumber < 1 || pageNumber > totalPages)
            return;
        filterRequestVersion += 1;
        offset = nextOffset;
        updateUrl();
        fetchThemes();
    }

    function clearFilters() {
        searchQuery = "";
        selectedTags = [];
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
    <DiscoverControls
        bind:searchQuery
        bind:selectedTags
        bind:sortBy
        {tagOptions}
        {sortOptions}
        {applyFilters}
        {queueFilterChange}
        {clearSearch}
    />

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Curating themes for you...</p>
        </div>
    {:else if errorMessage}
        <div class="empty-state error-state" role="alert">
            <MaterialIcon name="error" size={28} />
            <p>{errorMessage}</p>
            <button
                class="clear-btn premium-button glass-panel"
                onclick={fetchThemes}
            >
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
                    <button
                        class="clear-btn premium-button glass-panel"
                        onclick={clearFilters}
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
            {goToPage}
        />
    {/if}
</div>

<style lang="scss">
    .discover-container {
        padding: 2rem 0;
    }

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

    @media (max-width: 768px) {
        .discover-container {
            padding-top: 1rem;
        }
    }
</style>
