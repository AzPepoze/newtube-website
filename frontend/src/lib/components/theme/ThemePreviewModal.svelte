<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import { SUPPORTED_DOMAINS } from "$lib/constants/index";
    import {
        dispatchThemeInstallation,
        extensionState,
    } from "$lib/core/extension.svelte";
    import type { Theme } from "$lib/types/index";
    import { fade, scale } from "svelte/transition";
    import ThemePreviewMockup from "./ThemePreviewMockup.svelte";

    let {
        theme = $bindable<Theme | null>(null),
        onClose,
    }: {
        theme: Theme | null;
        onClose: () => void;
    } = $props();

    function handleInstall() {
        if (!theme) return;
        if (extensionState.isExtensionReady) {
            dispatchThemeInstallation(theme.themeId, theme.themeName, [
                ...SUPPORTED_DOMAINS,
            ]);
        }
    }
</script>

{#if theme}
    <div
        class="preview-modal-backdrop"
        in:fade={{ duration: 150 }}
        onclick={onClose}
        role="presentation"
    >
        <div
            class="preview-modal-card glass-panel"
            in:scale={{ start: 0.95, duration: 200 }}
            onclick={(e) => e.stopPropagation()}
            role="presentation"
        >
            <header class="modal-header">
                <div class="header-left">
                    <span class="theme-title">{theme.themeName}</span>
                    <span class="preview-badge">
                        <MaterialIcon name="visibility" size={14} /> Live Preview
                    </span>
                </div>

                <div class="header-right">
                    <a
                        href="/themes/preview?id={theme.themeId}"
                        target="_blank"
                        class="icon-action-btn"
                        title="Open Fullscreen Preview Page"
                    >
                        <MaterialIcon name="open_in_new" size={18} />
                    </a>

                    <button
                        class="install-btn"
                        onclick={handleInstall}
                        title="Install Theme"
                    >
                        <MaterialIcon name="download" size={16} /> Install
                    </button>

                    <button
                        class="close-btn"
                        onclick={onClose}
                        title="Close Preview"
                    >
                        <MaterialIcon name="close" size={20} />
                    </button>
                </div>
            </header>

            <main class="modal-body">
                <ThemePreviewMockup {theme} />
            </main>
        </div>
    </div>
{/if}

<style lang="scss">
    .preview-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(12px);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1.5rem;
    }

    .preview-modal-card {
        width: 100%;
        max-width: 1280px;
        max-height: 88vh;
        background: #0d0d0f;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 20px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.7);

        .modal-header {
            height: 56px;
            padding: 0 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            background: rgba(20, 20, 24, 0.95);
            flex-shrink: 0;

            .header-left {
                display: flex;
                align-items: center;
                gap: 0.75rem;

                .theme-title {
                    font-weight: 700;
                    font-size: 1.05rem;
                    color: #fff;
                }

                .preview-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 2px 8px;
                    border-radius: 12px;
                    background: rgba(255, 255, 255, 0.1);
                    color: #aaa;
                }
            }

            .header-right {
                display: flex;
                align-items: center;
                gap: 0.6rem;

                .icon-action-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 34px;
                    height: 34px;
                    border-radius: 8px;
                    background: rgba(255, 255, 255, 0.06);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #ccc;
                    text-decoration: none;
                    transition: all 0.2s;

                    &:hover {
                        background: rgba(255, 255, 255, 0.15);
                        color: #fff;
                    }
                }

                .install-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.4rem 0.85rem;
                    border-radius: 8px;
                    border: none;
                    background: #fff;
                    color: #000;
                    font-weight: 700;
                    font-size: 0.82rem;
                    cursor: pointer;
                    transition: transform 0.2s;

                    &:hover {
                        transform: translateY(-1px);
                    }
                }

                .close-btn {
                    background: transparent;
                    border: none;
                    color: #aaa;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;

                    &:hover {
                        color: #fff;
                    }
                }
            }
        }

        .modal-body {
            flex: 1;
            width: 100%;
            overflow-y: auto;
            padding: 1.25rem;
            box-sizing: border-box;
        }
    }
</style>
