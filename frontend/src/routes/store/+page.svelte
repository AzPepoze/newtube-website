<script lang="ts">
    import { onMount } from "svelte";
    import ThemeCard from "$lib/components/ThemeCard.svelte";
    import type { Theme } from "$lib/types";
    import { fade, fly } from "svelte/transition";
    import { env } from "$env/dynamic/public";
    import { page } from "$app/state";
    import SearchIcon from "$lib/icons/SearchIcon.svelte";
    import CrossIcon from "$lib/icons/CrossIcon.svelte";

    import CustomDropdown from "$lib/components/CustomDropdown.svelte";

    let themes = $state<Theme[]>([]);
    let searchQuery = $state("");
    let sortBy = $state("popular");
    let loading = $state(true);

    const sortOptions = [
        { value: "popular", label: "Most Popular" },
        { value: "newest", label: "Recently Added" },
        { value: "alpha", label: "Alphabetical" },
    ];

    const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

    async function fetchThemes() {
        loading = true;
        try {
            const response = await fetch(
                `${PUBLIC_API_URL}/themes?q=${searchQuery}&sort=${sortBy}`,
            );
            themes = await response.json();
        } catch (error) {
            console.error("Failed to fetch themes:", error);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        searchQuery = page.url.searchParams.get("q") || "";
        fetchThemes();
    });

    $effect(() => {
        if (sortBy) fetchThemes();
    });
</script>

<div class="store-container">
    <div class="store-controls">
        <div class="controls-left">
            <div class="search-wrapper glass-panel">
                <SearchIcon size={18} />
                <input
                    type="text"
                    placeholder="Search themes..."
                    bind:value={searchQuery}
                    onkeydown={(e) => e.key === "Enter" && fetchThemes()}
                />
                {#if searchQuery}
                    <button
                        class="clear-search"
                        onclick={() => {
                            searchQuery = "";
                            fetchThemes();
                        }}
                    >
                        <CrossIcon size={14} />
                    </button>
                {/if}
            </div>
        </div>

        <div class="sort-wrapper">
            <span>Sort by:</span>
            <CustomDropdown options={sortOptions} bind:value={sortBy} />
        </div>
    </div>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Curating themes for you...</p>
        </div>
    {:else}
        <div class="theme-grid" in:fade={{ duration: 600 }}>
            {#each themes as theme (theme.id)}
                <div in:fly={{ y: 20, duration: 500 }}>
                    <ThemeCard {theme} />
                </div>
            {/each}
        </div>

        {#if themes.length === 0}
            <div class="empty-state">
                <p>No themes found</p>
                <button
                    class="clear-btn"
                    onclick={() => {
                        searchQuery = "";
                        window.location.href = "/store";
                    }}
                >
                    <CrossIcon size={16} /> Clear Search
                </button>
            </div>
        {/if}
    {/if}
</div>

<style lang="scss">
    .store-container {
        padding: 2rem 0;
    }

    .store-controls {
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
            width: 100%;

            @media (max-width: 900px) {
                flex-direction: column;
                align-items: flex-start;
                gap: 1rem;
            }
        }

        h2 {
            margin: 0;
            font-size: 1.75rem;
            color: var(--text-secondary);
            white-space: nowrap;
        }

        .search-wrapper {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.6rem 1.2rem;
            background: rgba(var(--text-primary-rgb), 0.05);
            border-radius: var(--radius-sm);
            flex: 1;
            transition: all 0.3s;
            color: var(--text-secondary);
            @include glassmorphism;

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
                background: transparent;
                border: none;
                color: inherit;
                font-family: inherit;
                font-size: 0.95rem;
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
        font-size: 0.95rem;
    }

    .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2.5rem;
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

    .empty-state {
        text-align: center;
        padding: 5rem 0;

        p {
            font-size: 1.25rem;
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }

        button.clear-btn {
            @include premium-button;
            @include glassmorphism;
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 2rem;
            font-size: 1rem;
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
