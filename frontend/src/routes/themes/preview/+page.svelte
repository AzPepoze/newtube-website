<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { fly } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import ThemeCard from "$lib/components/theme/ThemeCard.svelte";
    import ThemeDetailCodePreview from "$lib/components/theme/ThemeDetailCodePreview.svelte";
    import YouTubeMockupIframe from "$lib/components/theme/YouTubeMockupIframe.svelte";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import LoadingState from "$lib/components/common/LoadingState.svelte";
    import PreviewTopControlBar from "$lib/components/theme/preview/PreviewTopControlBar.svelte";
    import ThemeJsonInputModal from "$lib/components/theme/preview/ThemeJsonInputModal.svelte";
    import { SUPPORTED_DOMAINS } from "$lib/constants/index";
    import {
        extensionState,
        dispatchThemeInstallation,
        dispatchThemeSave,
    } from "$lib/core/extension.svelte";
    import {
        parseThemeFromUrl,
        normalizeThemePayload,
        encodeThemeToBase64,
    } from "$lib/utils/themePreview";

    let theme = $state<Theme | null>(null);
    let loading = $state(true);
    let error = $state("");
    let sourceType = $state<"id" | "setting" | "data" | "manual" | "none">(
        "none",
    );

    let viewMode = $state<
        "watch" | "home" | "channel" | "grid" | "card" | "code"
    >("watch");
    let showRawModal = $state(false);
    let rawInputCode = $state("");
    let copySuccess = $state("");

    async function initPreview() {
        loading = true;
        error = "";
        const result = await parseThemeFromUrl(page.url.searchParams);

        if (result.error) {
            error = result.error;
            theme = null;
        } else if (result.theme) {
            theme = result.theme;
            sourceType = result.source;
            rawInputCode = JSON.stringify(result.theme.settings, null, 2);
        } else {
            sourceType = "none";
            theme = null;
        }
        loading = false;
    }

    onMount(() => {
        initPreview();

        function handleMessage(event: MessageEvent) {
            if (!event.data || typeof event.data !== "object") return;
            if (event.data.type === "SET_THEME_PREVIEW" && event.data.theme) {
                theme = normalizeThemePayload(
                    event.data.theme,
                    "postmessage-theme",
                );
                sourceType = "manual";
                rawInputCode = JSON.stringify(theme.settings, null, 2);
            } else if (
                event.data.type === "SET_THEME_SETTINGS" &&
                event.data.settings
            ) {
                theme = normalizeThemePayload(
                    { settings: event.data.settings },
                    "postmessage-theme",
                );
                sourceType = "manual";
                rawInputCode = JSON.stringify(theme.settings, null, 2);
            }
        }

        window.addEventListener("message", handleMessage);
        return () => window.removeEventListener("message", handleMessage);
    });

    function handleInstall() {
        if (!theme) return;
        if (extensionState.isExtensionReady) {
            dispatchThemeInstallation(theme.themeId, theme.themeName, [
                ...SUPPORTED_DOMAINS,
            ]);
        }
    }

    function handleSave() {
        if (!theme) return;
        if (extensionState.isExtensionReady) {
            dispatchThemeSave(
                theme.themeId,
                theme.themeName,
                SUPPORTED_DOMAINS[0],
            );
        }
    }

    function copyJsonSettings() {
        if (!theme) return;
        const jsonString = JSON.stringify(theme.settings, null, 2);
        navigator.clipboard.writeText(jsonString).then(() => {
            copySuccess = "Settings JSON copied to clipboard!";
            setTimeout(() => (copySuccess = ""), 3000);
        });
    }

    function sharePreviewLink() {
        if (!theme) return;
        let shareUrl = window.location.origin + "/themes/preview";

        if (sourceType === "id" && theme.themeId) {
            shareUrl += `?id=${encodeURIComponent(theme.themeId)}`;
        } else {
            const base64 = encodeThemeToBase64(theme);
            if (base64) shareUrl += `?data=${base64}`;
        }

        navigator.clipboard.writeText(shareUrl).then(() => {
            copySuccess = "Preview link copied to clipboard!";
            setTimeout(() => (copySuccess = ""), 3000);
        });
    }

    function applyManualJson() {
        try {
            const parsed = JSON.parse(rawInputCode);
            theme = normalizeThemePayload(parsed, "manual-theme");
            sourceType = "manual";
            error = "";
            showRawModal = false;
        } catch (e) {
            alert("Invalid JSON code. Please check your syntax.");
        }
    }
</script>

<svelte:head>
    <title
        >{theme
            ? `${theme.themeName} - Theme Preview`
            : "Theme Preview - NewTube Store"}</title
    >
</svelte:head>

<div class="fullpage-preview-container">
    <!-- Top Fullscreen Control Navigation Bar -->
    <PreviewTopControlBar
        {theme}
        {sourceType}
        bind:viewMode
        onOpenModal={() => (showRawModal = true)}
        onShare={sharePreviewLink}
        onCopyJson={copyJsonSettings}
        onSave={handleSave}
        onInstall={handleInstall}
    />

    {#if copySuccess}
        <div class="toast-notification" in:fly={{ y: -10, duration: 200 }}>
            <MaterialIcon name="check_circle" size={18} />
            <span>{copySuccess}</span>
        </div>
    {/if}

    <!-- Main Fullscreen Stage -->
    <main class="preview-stage">
        {#if loading}
            <LoadingState text="Loading theme preview..." />
        {:else if theme}
            {#if viewMode === "watch" || viewMode === "home" || viewMode === "channel"}
                <div class="single-iframe-stage">
                    <YouTubeMockupIframe
                        {theme}
                        pageMode={viewMode}
                        height="calc(100vh - 58px)"
                    />
                </div>
            {:else if viewMode === "grid"}
                <div class="grid-iframe-stage">
                    <div class="stage-card">
                        <div class="card-label">
                            <MaterialIcon name="movie" size={16} /> Watch Page
                        </div>
                        <YouTubeMockupIframe
                            {theme}
                            pageMode="watch"
                            height="calc(100vh - 110px)"
                        />
                    </div>
                    <div class="stage-card">
                        <div class="card-label">
                            <MaterialIcon name="home" size={16} /> Home Feed Grid
                        </div>
                        <YouTubeMockupIframe
                            {theme}
                            pageMode="home"
                            height="calc(100vh - 110px)"
                        />
                    </div>
                    <div class="stage-card">
                        <div class="card-label">
                            <MaterialIcon name="person" size={16} /> Channel Page
                        </div>
                        <YouTubeMockupIframe
                            {theme}
                            pageMode="channel"
                            height="calc(100vh - 110px)"
                        />
                    </div>
                </div>
            {:else if viewMode === "card"}
                <div class="centered-stage">
                    <div class="card-preview-wrapper">
                        <ThemeCard {theme} />
                    </div>
                </div>
            {:else if viewMode === "code"}
                <div class="code-stage">
                    <ThemeDetailCodePreview {theme} />
                </div>
            {/if}
        {:else}
            <div class="empty-state">
                <MaterialIcon name="palette" size={56} />
                <h2>No Theme Provided</h2>
                <p>
                    {error ||
                        "Provide a theme ID via ?id=YOUR_ID or input setting JSON directly."}
                </p>
                <button
                    class="install-action-btn"
                    onclick={() => (showRawModal = true)}
                >
                    <MaterialIcon name="edit" size={18} />
                    <span>Input Setting JSON</span>
                </button>
            </div>
        {/if}
    </main>

    <!-- Raw Setting Modal -->
    <ThemeJsonInputModal
        bind:show={showRawModal}
        bind:rawInputCode
        onApply={applyManualJson}
    />
</div>

<style lang="scss">
    .fullpage-preview-container {
        display: flex;
        flex-direction: column;
        width: 100vw;
        height: 100vh;
        background: #09090b;
        color: #fff;
        overflow: hidden;
        position: relative;
    }

    .toast-notification {
        position: fixed;
        top: 68px;
        right: 20px;
        z-index: 1000;
        background: rgba(0, 255, 204, 0.15);
        border: 1px solid rgba(0, 255, 204, 0.4);
        color: #00ffcc;
        padding: 0.6rem 1.2rem;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.85rem;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
    }

    .preview-stage {
        flex: 1;
        width: 100%;
        height: calc(100vh - 56px);
        overflow: hidden;

        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 1rem;
            color: #aaa;
            text-align: center;
            padding: 2rem;
        }

        .install-action-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.55rem 1.25rem;
            border-radius: 8px;
            border: none;
            background: #fff;
            color: #000;
            font-weight: 700;
            font-size: 0.85rem;
            cursor: pointer;
        }

        .single-iframe-stage {
            width: 100%;
            height: 100%;
        }

        .grid-iframe-stage {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            padding: 1rem;
            height: 100%;
            box-sizing: border-box;

            @media (max-width: 1100px) {
                grid-template-columns: 1fr;
                overflow-y: auto;
            }

            .stage-card {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                .card-label {
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #aaa;
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                }
            }
        }

        .centered-stage {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 2rem;

            .card-preview-wrapper {
                width: 100%;
                max-width: 360px;
            }
        }

        .code-stage {
            padding: 1.5rem;
            height: 100%;
            overflow-y: auto;
            box-sizing: border-box;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
