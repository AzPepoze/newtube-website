<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { fade, fly, scale } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { ui } from "$lib/core/ui.svelte";
    import { getCurrentUser } from "$lib/utils/auth";
    import ThemeDetailHeader from "$lib/components/theme/ThemeDetailHeader.svelte";
    import ThemeDetailGallery from "$lib/components/theme/ThemeDetailGallery.svelte";
    import ThemeDetailCodePreview from "$lib/components/theme/ThemeDetailCodePreview.svelte";
    import ThemeDetailStats from "$lib/components/theme/ThemeDetailStats.svelte";
    import ThemeDetailCommunity from "$lib/components/theme/ThemeDetailCommunity.svelte";
    import ThemeCreatorCard from "$lib/components/theme/ThemeCreatorCard.svelte";
    import MarkdownViewer from "$lib/components/common/MarkdownViewer.svelte";
    import QuickScrollNav, {
        type QuickScrollItem,
    } from "$lib/components/common/QuickScrollNav.svelte";

    const navigationItems: QuickScrollItem[] = [
        { id: "overview", label: "Overview" },
        { id: "description", label: "Description" },
        { id: "settings", label: "Settings" },
        { id: "reviews", label: "Reviews" },
        { id: "versions", label: "Versions" },
    ];

    function formatDate(dateStr: string | undefined) {
        if (!dateStr) return "N/A";
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    interface ThemeDetail extends Theme {
        creatorName?: string;
        creatorAvatar?: string;
    }

    let theme = $state<ThemeDetail | null>(null);
    let loading = $state(true);
    let currentUser = $state("");
    let fetchError = $state("");

    async function fetchTheme() {
        const id = page.params.id;
        loading = true;
        currentUser = "";
        fetchError = "";
        try {
            const [response, viewer] = await Promise.all([
                fetch(`${PUBLIC_API_URL}/themes/${id}`, {
                    credentials: "include",
                }),
                getCurrentUser(),
            ]);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || errData.error || "Theme not found");
            }

            theme = await response.json();
            currentUser = viewer?.id ?? "";
        } catch (error) {
            fetchError = error instanceof Error ? error.message : "Failed to fetch theme details.";
            theme = null;
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchTheme();
    });

    async function deleteTheme() {
        if (!theme) return;
        try {
            const res = await fetch(
                `${PUBLIC_API_URL}/themes/${theme.themeId}`,
                {
                    method: "DELETE",
                    credentials: "include",
                },
            );
            if (res.ok) {
                setTimeout(() => {
                    window.location.href = "/discover";
                }, 200);
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
</script>

<div
    class="theme-detail-container"
    in:scale={{ delay: 200, start: 0.98, duration: 300 }}
    out:scale={{ start: 0.98, duration: 200 }}
>
    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading theme details...</p>
        </div>
    {:else if theme}
        <div in:fade={{ duration: 400 }}>
            <a href="/discover" class="back-link">← Back to Discover</a>

            <div class="detail-layout" in:fly={{ y: 20, duration: 600 }}>
                <aside>
                    <QuickScrollNav
                        items={navigationItems}
                        label="Theme detail sections"
                    />
                </aside>

                <div class="layout-single">
                    <section
                        id="overview"
                        class="overview quick-scroll-section"
                    >
                        <ThemeDetailHeader
                            {theme}
                            {currentUser}
                            {deleteTheme}
                        />

                        <div class="gallery-wrapper">
                            <ThemeDetailGallery {theme} />
                        </div>

                        <div class="info-row">
                            <ThemeCreatorCard
                                {theme}
                                {currentUser}
                                {formatDate}
                            />
                            <ThemeDetailStats {theme} />
                        </div>
                    </section>

                    <section
                        id="description"
                        class="section glass-panel description-panel quick-scroll-section"
                    >
                        <h3>Description</h3>
                        <div class="description-content">
                            <MarkdownViewer
                                content={theme.description ||
                                    "*No description provided.*"}
                            />
                        </div>
                    </section>

                    <section id="settings" class="quick-scroll-section">
                        <ThemeDetailCodePreview {theme} />
                    </section>

                    <ThemeDetailCommunity themeId={theme.themeId} />
                </div>
            </div>
        </div>
    {:else}
        <div class="error-state glass-panel" in:fade>
            <div class="error-icon">⚠️</div>
            <h2>Theme Not Found</h2>
            <p>{fetchError || "Failed to fetch theme details."}</p>
            <div class="error-actions">
                <a href="/discover" class="action-btn primary">Back to Discover</a>
                <a href="/" class="action-btn secondary">Back to Home</a>
            </div>
        </div>
    {/if}
</div>

<style lang="scss">
    .theme-detail-container {
        padding: 1.5rem 0 4rem;
    }

    .loading-state {
        text-align: center;
        padding: 6rem 0;
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

    .error-state {
        max-width: 480px;
        margin: 4rem auto;
        padding: 3rem 2rem;
        text-align: center;
        border-radius: var(--radius-lg, 16px);
        border: 1px solid var(--border-glass);
        background: rgba(var(--text-primary-rgb), 0.03);
        backdrop-filter: blur(10px);

        .error-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
        }

        h2 {
            margin: 0 0 0.5rem;
            font-size: 1.4rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        p {
            color: var(--text-secondary);
            margin: 0 0 2rem;
            font-size: 0.95rem;
        }

        .error-actions {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;

            .action-btn {
                padding: 0.7rem 1.4rem;
                border-radius: var(--radius-md, 8px);
                font-weight: 600;
                font-size: 0.9rem;
                text-decoration: none;
                transition: all 0.2s ease;

                &.primary {
                    background: var(--text-primary);
                    color: var(--bg-dark, #000);

                    &:hover {
                        transform: translateY(-2px);
                        filter: brightness(1.1);
                    }
                }

                &.secondary {
                    background: rgba(var(--text-primary-rgb), 0.08);
                    color: var(--text-primary);
                    border: 1px solid var(--border-glass);

                    &:hover {
                        background: rgba(var(--text-primary-rgb), 0.15);
                        transform: translateY(-2px);
                    }
                }
            }
        }
    }

    .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--text-secondary);
        font-weight: 600;
        margin-bottom: 2rem;
        transition: all 0.2s;

        &:hover {
            color: var(--text-primary);
            transform: translateX(-4px);
        }
    }

    .detail-layout {
        display: grid;
        grid-template-columns: 200px minmax(0, 1fr);
        gap: 2rem;
        align-items: start;

        aside {
            min-width: 0;
            height: 100%;
        }

        .layout-single {
            display: flex;
            flex-direction: column;
            gap: 3rem;
            min-width: 0;
        }

        .overview {
            display: flex;
            flex-direction: column;
            gap: 2rem;

            .gallery-wrapper {
                width: 100%;
            }

            .info-row {
                display: flex;
                flex-direction: column;
                gap: 1.5rem;
                width: 100%;
            }
        }

        .description-panel {
            padding: 2rem;
            border-radius: var(--radius-lg);

            h3 {
                margin: 0 0 1.5rem;
                font-size: 1.4rem;
                font-weight: 700;
            }
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    @media (max-width: 900px) {
        .detail-layout {
            display: flex;
            flex-direction: column;

            aside,
            .layout-single {
                width: 100%;
            }

            aside {
                display: contents;
            }
        }
    }
</style>
