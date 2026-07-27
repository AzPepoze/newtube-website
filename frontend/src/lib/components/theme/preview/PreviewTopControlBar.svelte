<script lang="ts">
    import type { Theme } from "$lib/types/index";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    import { extensionState } from "$lib/core/extension.svelte";

    let {
        theme,
        sourceType,
        viewMode = $bindable("watch"),
        onOpenModal,
        onShare,
        onCopyJson,
        onSave,
        onInstall,
    }: {
        theme: Theme | null;
        sourceType: "id" | "setting" | "data" | "manual" | "none";
        viewMode: "watch" | "home" | "channel" | "grid" | "card" | "code";
        onOpenModal: () => void;
        onShare: () => void;
        onCopyJson: () => void;
        onSave: () => void;
        onInstall: () => void;
    } = $props();

    let isInstalled = $derived(
        Boolean(theme && extensionState.installedThemeId === theme.themeId),
    );
    let isInstalling = $derived(
        Boolean(theme && extensionState.installingThemeId === theme.themeId),
    );
</script>

<header class="top-control-bar">
    <div class="bar-left">
        <a href="/discover" class="back-link" title="Return to Store">
            <MaterialIcon name="arrow_back" size={20} />
            <span>Store</span>
        </a>

        {#if theme}
            <div class="title-meta">
                <span class="theme-title">{theme.themeName}</span>
                <span class="source-tag">{sourceType}</span>
                <span
                    class="notice-tag"
                    title="Interactive preview mockup — actual YouTube rendering may vary"
                >
                    <MaterialIcon name="info" size={14} /> Mockup Preview
                </span>
            </div>
        {/if}
    </div>

    <!-- Page View Buttons -->
    {#if theme}
        <div class="page-view-buttons">
            <button
                class="view-btn"
                class:active={viewMode === "watch"}
                onclick={() => (viewMode = "watch")}
                title="Watch Page View"
            >
                <MaterialIcon name="movie" size={16} />
                <span>Watch Page</span>
            </button>

            <button
                class="view-btn"
                class:active={viewMode === "home"}
                onclick={() => (viewMode = "home")}
                title="Home Feed Grid View"
            >
                <MaterialIcon name="home" size={16} />
                <span>Home Grid</span>
            </button>

            <button
                class="view-btn"
                class:active={viewMode === "channel"}
                onclick={() => (viewMode = "channel")}
                title="Channel Page View"
            >
                <MaterialIcon name="person" size={16} />
                <span>Channel Page</span>
            </button>

            <button
                class="view-btn"
                class:active={viewMode === "grid"}
                onclick={() => (viewMode = "grid")}
                title="All Pages Grid View"
            >
                <MaterialIcon name="grid_view" size={16} />
                <span>All Pages Grid</span>
            </button>

            <button
                class="view-btn"
                class:active={viewMode === "code"}
                onclick={() => (viewMode = "code")}
                title="Settings Code View"
            >
                <MaterialIcon name="code" size={16} />
                <span>JSON</span>
            </button>
        </div>
    {/if}

    <!-- Action Buttons -->
    <div class="bar-right">
        <button
            class="icon-action-btn"
            onclick={onOpenModal}
            title="Edit Setting JSON"
        >
            <MaterialIcon name="edit" size={18} />
        </button>

        {#if theme}
            <button
                class="icon-action-btn"
                onclick={onShare}
                title="Share Link"
            >
                <MaterialIcon name="share" size={18} />
            </button>
            <button
                class="icon-action-btn"
                onclick={onCopyJson}
                title="Copy JSON"
            >
                <MaterialIcon name="content_copy" size={18} />
            </button>
            <button class="icon-action-btn" onclick={onSave} title="Save Theme">
                <MaterialIcon name="save" size={18} />
            </button>
            <button
                class="install-action-btn"
                class:installed={isInstalled}
                class:installing={isInstalling}
                class:locked={!extensionState.isExtensionReady}
                disabled={!extensionState.isExtensionReady || isInstalling}
                onclick={onInstall}
                title={!extensionState.isExtensionReady
                    ? "Extension Required"
                    : isInstalling
                      ? "Installing Theme..."
                      : isInstalled
                        ? "Theme Installed"
                        : "Install Theme"}
            >
                {#if !extensionState.isExtensionReady}
                    <MaterialIcon name="lock" size={18} />
                    <span>Need Extension</span>
                {:else if isInstalling}
                    <MaterialIcon name="sync" size={18} class="spin-icon" />
                    <span>Installing...</span>
                {:else if isInstalled}
                    <MaterialIcon name="check" size={18} />
                    <span>Installed</span>
                {:else}
                    <MaterialIcon name="download" size={18} />
                    <span>Install</span>
                {/if}
            </button>
        {/if}
    </div>
</header>

<style lang="scss">
    @keyframes spin {
        from {
            transform: rotate(0deg);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .top-control-bar {
        height: 56px;
        background: rgba(18, 18, 20, 0.95);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1rem;
        gap: 1rem;
        z-index: 100;
        flex-shrink: 0;

        .bar-left {
            display: flex;
            align-items: center;
            gap: 1rem;

            .back-link {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                color: var(--text-secondary, #aaa);
                text-decoration: none;
                font-weight: 600;
                font-size: 0.9rem;
                transition: color 0.2s;

                &:hover {
                    color: #fff;
                }
            }

            .title-meta {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .theme-title {
                    font-weight: 700;
                    font-size: 1rem;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 200px;
                }

                .source-tag {
                    font-size: 0.7rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    padding: 2px 6px;
                    border-radius: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    color: #aaa;
                }

                .notice-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 12px;
                    background: rgba(255, 170, 0, 0.15);
                    color: #ffb700;
                    border: 1px solid rgba(255, 170, 0, 0.3);
                }
            }
        }

        .page-view-buttons {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(0, 0, 0, 0.4);
            padding: 3px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);

            .view-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                padding: 0.4rem 0.75rem;
                border-radius: 6px;
                border: none;
                background: transparent;
                color: #aaa;
                font-size: 0.82rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    color: #fff;
                }

                &.active {
                    background: rgba(255, 255, 255, 0.15);
                    color: #fff;
                }

                @media (max-width: 900px) {
                    span {
                        display: none;
                    }
                }
            }
        }

        .bar-right {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .icon-action-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 8px;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #ccc;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    background: rgba(255, 255, 255, 0.15);
                    color: #fff;
                }
            }

            .install-action-btn {
                display: inline-flex;
                align-items: center;
                gap: 0.4rem;
                padding: 0.45rem 1rem;
                border-radius: 8px;
                border: none;
                background: #fff;
                color: #000;
                font-weight: 700;
                font-size: 0.85rem;
                cursor: pointer;
                transition: all 0.2s;

                :global(.spin-icon) {
                    animation: spin 1s linear infinite;
                }

                &.installing {
                    opacity: 0.8;
                    cursor: wait;
                }

                &.installed {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                }

                &.locked {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: rgba(255, 255, 255, 0.1);
                    color: #888;
                }

                &:hover:not(:disabled) {
                    transform: translateY(-1px);
                    filter: brightness(1.1);
                }
            }
        }
    }
</style>
