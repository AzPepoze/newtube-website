<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { fade, fly } from "svelte/transition";
    import type { Theme } from "$lib/types";
    import { PUBLIC_API_URL } from "$lib/constants";
    import { ui } from "$lib/ui.svelte";
    import { getUserId } from "$lib/auth";
    import { renderMarkdown } from "$lib/markdown";

    import ThemeDetailHeader from "$lib/components/ThemeDetailHeader.svelte";
    import ThemeDetailGallery from "$lib/components/ThemeDetailGallery.svelte";
    import ThemeDetailCodePreview from "$lib/components/ThemeDetailCodePreview.svelte";
    import ThemeDetailStats from "$lib/components/ThemeDetailStats.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";

    interface ThemeDetail extends Theme {
        creatorName?: string;
        creatorAvatar?: string;
    }

    let theme = $state<ThemeDetail | null>(null);
    let loading = $state(true);
    let currentUser = $state("");

    async function fetchTheme() {
        currentUser = getUserId() || "";
        const id = page.params.id;
        loading = true;
        try {
            const response = await fetch(`${PUBLIC_API_URL}/themes/${id}`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Theme not found");
            theme = await response.json();
        } catch (error) {
            ui.showModal("Error", "Failed to fetch theme details.", "error");
            theme = null;
        } finally {
            loading = false;
        }
    }

    async function deleteTheme() {
        if (!theme || !confirm("Are you sure you want to delete this theme?"))
            return;
        try {
            const res = await fetch(`${PUBLIC_API_URL}/themes/${theme.id}`, {
                method: "DELETE",
                credentials: "include",
            });
            if (res.ok) {
                window.location.href = "/discover";
            } else {
                ui.showModal(
                    "Delete Failed",
                    "Failed to delete theme.",
                    "error",
                );
            }
        } catch (e) {
            ui.showModal(
                "Delete Error",
                "An error occurred while deleting the theme.",
                "error",
            );
        }
    }

    onMount(() => {
        fetchTheme();
    });
</script>

<div class="theme-detail-container">
    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading theme details...</p>
        </div>
    {:else if theme}
        <div in:fade={{ duration: 400 }}>
            <a href="/discover" class="back-link">← Back to Discover</a>

            <div class="layout-single" in:fly={{ y: 20, duration: 600 }}>
                <ThemeDetailHeader {theme} {currentUser} {deleteTheme} />

                <div class="gallery-wrapper">
                    <ThemeDetailGallery {theme} />
                </div>

                <div class="info-row">
                    <div class="creator glass-panel">
                        <UserAvatar
                            userId={theme.ownerId}
                            name={theme.creatorName}
                            avatarUrl={theme.creatorAvatar}
                            size="md"
                            showLabel={true}
                        />
                    </div>

                    <ThemeDetailStats {theme} />
                </div>

                <!-- Description -->
                <div class="section glass-panel description-panel">
                    <h3>Description</h3>
                    <div class="description-content markdown-content">
                        {@html renderMarkdown(
                            theme.description || "*No description provided.*",
                        )}
                    </div>
                </div>

                <ThemeDetailCodePreview {theme} />
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .theme-detail-container {
        padding: 2rem 0;
        max-width: 1200px;
        margin: 0 auto;
    }

    .back-link {
        display: inline-block;
        margin-bottom: 1.5rem;
        color: var(--text-muted);
        font-size: 0.9rem;

        &:hover {
            color: var(--text-primary);
        }
    }

    .layout-single {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .gallery-wrapper {
        width: 100%;
        border-radius: var(--radius-md);
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }

    .info-row {
        display: flex;
        gap: 1.5rem;
        flex-wrap: wrap;

        & > * {
            flex: 1;
            min-width: 300px;
        }
    }

    .creator {
        padding: 1.25rem 1.5rem;
    }

    .description-panel {
        padding: 1.5rem;
    }

    .section {
        h3 {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
        }

        .description-content {
            margin: 0;
            color: var(--text-primary);
            line-height: 1.7;

            :global(p) {
                margin-top: 0;
            }
        }
    }

    .loading-state {
        text-align: center;
        padding: 10rem 0;
        color: var(--text-muted);

        .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(var(--primary-glow-rgb), 0.1);
            border-top-color: var(--primary-glow);
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            animation: spin 1s linear infinite;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
