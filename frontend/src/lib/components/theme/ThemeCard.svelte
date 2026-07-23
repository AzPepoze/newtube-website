<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import ThemeCardActions from "$lib/components/theme/ThemeCardActions.svelte";
    import { SUPPORTED_DOMAINS } from "$lib/constants/index";
    import {
        extensionState,
        dispatchThemeInstallation,
        dispatchThemeSave,
    } from "$lib/core/extension.svelte";

    let { theme }: { theme: Theme } = $props();

    let currentImageIndex = $state(0);
    let hoverTimer: ReturnType<typeof setInterval> | null = $state(null);
    const displayImages = $derived(theme.images || []);

    function startImageCarousel() {
        if (displayImages.length <= 1) return;
        hoverTimer = setInterval(() => {
            currentImageIndex = (currentImageIndex + 1) % displayImages.length;
        }, 2000);
    }

    function stopImageCarousel() {
        if (hoverTimer) {
            clearInterval(hoverTimer);
            hoverTimer = null;
        }
        currentImageIndex = 0;
    }

    function getDisplayImage(): string {
        if (hoverTimer && displayImages.length > 0) {
            return displayImages[currentImageIndex] || "";
        }
        if (theme.coverImage) {
            return theme.coverImage;
        }
        return displayImages[0] || "";
    }

    let isInstalled = $derived(
        extensionState.installedThemeId === theme.themeId,
    );
    const visibleTags = $derived(theme.tags?.slice(0, 3) ?? []);
    const remainingTagCount = $derived(
        (theme.tags?.length ?? 0) - visibleTags.length,
    );
    const rating = $derived(
        typeof theme.rating === "number" && Number.isFinite(theme.rating)
            ? theme.rating
            : null,
    );

    function handleInstall(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        if (extensionState.isExtensionReady) {
            dispatchThemeInstallation(theme.themeId, theme.themeName, [
                ...SUPPORTED_DOMAINS,
            ]);
        }
    }

    function handleSave(e: Event) {
        e.preventDefault();
        e.stopPropagation();

        if (extensionState.isExtensionReady) {
            dispatchThemeSave(
                theme.themeId,
                theme.themeName,
                SUPPORTED_DOMAINS[0],
            );
        }
    }
</script>

<a
    href="/themes/{theme.themeId}"
    class="theme-card-wrapper"
    onmouseenter={startImageCarousel}
    onmouseleave={stopImageCarousel}
>
    <div class="theme-card glass-panel">
        <div class="card-image">
            {#if displayImages.length > 0 || theme.coverImage}
                {#key currentImageIndex}
                    <img
                        src={getDisplayImage()}
                        alt={theme.themeName}
                        in:fade={{ duration: 300 }}
                    />
                {/key}
            {:else}
                <div class="placeholder">
                    <span class="premium-font">{theme.themeName.charAt(0)}</span
                    >
                </div>
            {/if}
            <div class="overlay">
                <span class="view-tag">View Details</span>
            </div>
        </div>

        <div class="card-content">
            <div class="header">
                <div class="title-container">
                    <h3>{theme.themeName}</h3>
                    {#if theme.settings?.addOnStyleShiftItems}
                        <div
                            class="custom-badge"
                            title="This theme contains custom style features"
                        >
                            <MaterialIcon name="check" size={14} />
                        </div>
                    {/if}
                </div>
                <span class="downloads">
                    <MaterialIcon name="download" size={14} />
                    {theme.downloads}
                </span>
                <span class="header-divider" aria-hidden="true"></span>
                <span
                    class="rating"
                    title={rating === null
                        ? "No ratings yet"
                        : `${rating.toFixed(1)} out of 5 stars`}
                >
                    <MaterialIcon name="star" size={14} />
                    {rating === null ? "New" : rating.toFixed(1)}
                    {#if theme.ratingCount}
                        <span class="rating-count">({theme.ratingCount})</span>
                    {/if}
                </span>
            </div>
            {#if visibleTags.length > 0}
                <div class="metadata" aria-label="Theme tags">
                    {#each visibleTags as tag}
                        <span class="tag-chip">#{tag}</span>
                    {/each}
                    {#if remainingTagCount > 0}
                        <span class="tag-chip">+{remainingTagCount}</span>
                    {/if}
                </div>
            {/if}
            <p>{theme.description || "No description provided."}</p>
            <ThemeCardActions
                ownerId={theme.ownerId}
                {isInstalled}
                {handleSave}
                {handleInstall}
            />
        </div>
    </div>
</a>

<style lang="scss">
    .theme-card-wrapper {
        text-decoration: none;
        color: inherit;
        display: block;
        height: 100%;
    }

    .theme-card {
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        height: 100%;
        display: flex;
        flex-direction: column;

        &:hover {
            transform: translateY(-4px);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow:
                0 10px 30px rgba(0, 0, 0, 0.4),
                0 0 15px rgba(255, 255, 255, 0.05);

            .overlay {
                opacity: 1;
            }

            .card-image img {
                transform: scale(1.05);
            }
        }
    }

    .card-image {
        position: relative;
        width: 100%;
        height: 200px;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.2);

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.4s ease;
        }

        .placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(
                135deg,
                rgba(var(--text-primary-rgb), 0.05) 0%,
                rgba(var(--text-primary-rgb), 0.15) 100%
            );

            span {
                font-size: 4rem;
                opacity: 0.3;
            }
        }

        .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(2px);
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.3s ease;

            .view-tag {
                padding: 0.6rem 1.2rem;
                background: var(--text-primary);
                color: var(--bg-dark);
                border-radius: var(--radius-lg);
                font-weight: 700;
                font-size: 0.9rem;
                transform: translateY(10px);
                transition: transform 0.3s ease;
            }
        }
    }

    .card-content {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        flex: 1;

        .header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.75rem;

            .title-container {
                display: flex;
                align-items: center;
                gap: 0.4rem;
                min-width: 0;
                flex: 1;

                h3 {
                    margin: 0;
                    font-size: 1.25rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .custom-badge {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-glow);
                }
            }

            .downloads,
            .rating {
                display: flex;
                align-items: center;
                gap: 0.25rem;
                font-size: 0.85rem;
                color: var(--text-muted);
                white-space: nowrap;
            }

            .rating {
                color: #f5c451;
            }

            .rating-count {
                font-size: 0.75rem;
                color: var(--text-muted);
                margin-left: 0.1rem;
            }

            .header-divider {
                width: 1px;
                height: 12px;
                background: var(--border-glass);
            }
        }

        .metadata {
            display: flex;
            gap: 0.4rem;
            flex-wrap: wrap;
            margin-bottom: 0.75rem;

            .tag-chip {
                font-size: 0.75rem;
                padding: 0.15rem 0.45rem;
                border-radius: var(--radius-sm);
                background: rgba(var(--text-primary-rgb), 0.05);
                color: var(--text-secondary);
                border: 1px solid var(--border-glass);
            }
        }

        p {
            margin: 0 0 1.25rem;
            font-size: 0.9rem;
            color: var(--text-secondary);
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            line-height: 1.5;
        }
    }
</style>
