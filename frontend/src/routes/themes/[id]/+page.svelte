<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { fade, fly, scale } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { ui } from "$lib/core/ui.svelte";
    import { getUserId } from "$lib/utils/auth";
    import ThemeDetailHeader from "$lib/components/theme/ThemeDetailHeader.svelte";
    import ThemeDetailGallery from "$lib/components/theme/ThemeDetailGallery.svelte";
    import ThemeDetailCodePreview from "$lib/components/theme/ThemeDetailCodePreview.svelte";
    import ThemeDetailStats from "$lib/components/theme/ThemeDetailStats.svelte";
    import UserAvatar from "$lib/components/common/UserAvatar.svelte";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import MarkdownViewer from "$lib/components/common/MarkdownViewer.svelte";
    import QuickScrollNav, {
        type QuickScrollItem,
    } from "$lib/components/common/QuickScrollNav.svelte";

    const navigationItems: QuickScrollItem[] = [
        { id: "overview", label: "Overview" },
        { id: "description", label: "Description" },
        { id: "settings", label: "Settings" },
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
                            <div class="creator glass-panel">
                                <UserAvatar
                                    userId={theme.ownerId}
                                    name={theme.creatorName}
                                    avatarUrl={theme.creatorAvatar}
                                    size="md"
                                    showLabel={true}
                                />
                                <div class="theme-dates">
                                    <div class="date-item" title="Created Date">
                                        <MaterialIcon
                                            name="calendar_today"
                                            size={16}
                                        />
                                        <span
                                            >Created: {formatDate(
                                                theme.createdAt,
                                            )}</span
                                        >
                                    </div>
                                    <div class="date-item" title="Last Updated">
                                        <MaterialIcon name="update" size={16} />
                                        <span
                                            >Updated: {formatDate(
                                                theme.updatedAt,
                                            )}</span
                                        >
                                    </div>
                                </div>

                                {#if currentUser === theme.ownerId}
                                    <div class="creator-actions">
                                        <a
                                            href="/themes/edit/{theme.themeId}"
                                            class="edit-theme-btn premium-button"
                                        >
                                            <MaterialIcon
                                                name="edit"
                                                size={16}
                                            />
                                            <span>Edit Theme</span>
                                        </a>
                                    </div>
                                {/if}
                            </div>

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
                </div>
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

    .detail-layout {
        display: grid;
        grid-template-columns: minmax(160px, 210px) minmax(0, 1fr);
        gap: 2rem;
        align-items: start;

        aside {
            min-width: 0;
            height: 100%;
        }
    }

    .overview {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .quick-scroll-section {
        min-width: 0;
        scroll-margin-top: 12rem;
    }

    #settings :global(.section) {
        margin: 0;
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
        padding: 1.25rem 2rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 2rem;
        flex-wrap: wrap;

        .theme-dates {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding-left: 2rem;
            border-left: 1px solid var(--border-glass);

            @media (max-width: 600px) {
                border-left: none;
                padding-left: 0;
                padding-top: 1rem;
                border-top: 1px solid var(--border-glass);
                width: 100%;
                justify-content: space-between;
            }

            .date-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                color: var(--text-primary);
                white-space: nowrap;

                :global(span.material-icons) {
                    color: var(--text-primary);
                    opacity: 0.8;
                }
            }
        }

        .creator-actions {
            margin-left: auto;

            .edit-theme-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.6rem 1.25rem;
                font-size: 0.85rem;
                font-weight: 700;
                border-radius: var(--radius-sm);
                background: rgba(var(--text-primary-rgb), 0.05);
                border: 1px solid var(--border-glass);
                color: var(--text-primary);
                transition: all 0.3s ease;

                &:hover {
                    background: var(--text-primary);
                    color: var(--bg-dark);
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(var(--text-primary-rgb), 0.2);
                }
            }

            @media (max-width: 850px) {
                margin-left: 0;
                width: 100%;

                .edit-theme-btn {
                    justify-content: center;
                }
            }
        }
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

            :global(img) {
                border-radius: var(--radius-sm);
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

    @media (max-width: 900px) {
        .detail-layout {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;

            aside,
            .layout-single {
                width: 100%;
            }

            aside {
                display: contents;
            }
        }

        .quick-scroll-section {
            scroll-margin-top: 15rem;
        }
    }
</style>
