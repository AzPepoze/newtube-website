<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import type { Theme } from "$lib/types/index";
    import QuickScrollNav, {
        type QuickScrollItem,
    } from "$lib/components/common/QuickScrollNav.svelte";
    import { getSessionId } from "$lib/utils/auth";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { ui } from "$lib/core/ui.svelte";
    import { compressImage } from "$lib/utils/image";
    import {
        validateTitle,
        validateDescription,
        validateSettingsJSON,
    } from "$lib/utils/validation";
    import ThemeEditorBasicInfo from "$lib/components/editor/ThemeEditorBasicInfo.svelte";
    import ThemeEditorSettings from "$lib/components/editor/ThemeEditorSettings.svelte";
    import ThemeEditorPreview from "$lib/components/editor/ThemeEditorPreview.svelte";
    import { defaultDescription } from "$lib/core/theme.svelte";
    let props: { initialData?: Partial<Theme>; isEdit?: boolean } = $props();
    let isEdit = $derived(props.isEdit ?? false);
    let initialData = $derived(props.initialData);

    let userId = getSessionId();
    let themeName = $state("");
    let description = $state(defaultDescription);
    let images = $state<string[]>([]);
    let coverImage = $state("");
    let coverImagePending = $state<File | null>(null);
    let pendingImages = $state<File[]>([]);
    let settingsCode = $state("");
    let tagNames = $state<string[]>([]);

    let submitting = $state(false);
    let success = $state(false);
    let errorMessage = $state("");
    let infoMessage = $state("");
    let jsonError = $state("");
    let titleError = $state("");
    let descriptionError = $state("");

    const NEW_DRAFT_KEY = "newtube_theme_draft";
    let draftKey = $derived(
        props.initialData?.themeId
            ? `newtube_theme_draft_${props.initialData.themeId}`
            : NEW_DRAFT_KEY,
    );
    let isServerDraft = $derived((initialData as any)?.isPublic === false);
    const navigationItems: QuickScrollItem[] = [
        { id: "basic-info", label: "Basic Info" },
        { id: "cover-image", label: "Cover Image" },
        { id: "screenshots", label: "Screenshots" },
        { id: "theme-settings", label: "Theme Settings" },
        { id: "preview", label: "Preview" },
    ];
    let hasRestored = false;

    // Initialize form with provided data or draft
    $effect(() => {
        if (hasRestored) return;
        if (initialData) {
            themeName = initialData.themeName || "";
            description = initialData.description || "";
            images = initialData.images || [];
            coverImage = initialData.coverImage || "";
            settingsCode = JSON.stringify(initialData.settings ?? {}, null, 2);
            tagNames = (initialData as any).tags || [];
        }

        // A browser backup is deliberately separate from the server draft. It
        // restores unsaved typing after a refresh or a dropped connection.
        const savedDraft = localStorage.getItem(draftKey);
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                themeName = draft.themeName || "";
                description = draft.description || "";
                images = draft.images || [];
                coverImage = draft.coverImage || "";
                settingsCode = draft.settingsCode || "";
                tagNames = draft.tagNames || [];
                if (themeName || description || settingsCode) {
                    success = false;
                    infoMessage =
                        "Browser backup restored from your last session.";
                    setTimeout(() => {
                        if (
                            infoMessage ===
                            "Browser backup restored from your last session."
                        )
                            infoMessage = "";
                    }, 15000);
                }
            } catch (e) {
                ui.showModal(
                    "Draft Error",
                    "Failed to load your browser backup. It may be corrupted.",
                    "warning",
                );
            }
        }
        hasRestored = true;
    });

    // Auto-save draft
    $effect(() => {
        const draft = {
            themeName,
            description,
            images,
            coverImage,
            settingsCode,
            tagNames,
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
    });

    // Track validation state for submit button
    $effect(() => {
        const titleValidation = validateTitle(themeName);
        titleError = titleValidation.message || "";

        const descriptionValidation = validateDescription(description);
        descriptionError = descriptionValidation.message || "";
    });

    function clearDraft() {
        localStorage.removeItem(draftKey);
        window.location.reload();
    }

    async function handleSubmit(e: Event, publish = true) {
        e.preventDefault();
        if (!userId) {
            errorMessage = "You must be logged in to save a theme.";
            return;
        }

        // Validate title
        const titleValidation = validateTitle(themeName);
        if (!titleValidation.valid) {
            errorMessage = titleValidation.message || "Invalid themeName";
            return;
        }

        // Validate description
        const descriptionValidation = validateDescription(description);
        if (!descriptionValidation.valid) {
            errorMessage =
                descriptionValidation.message || "Invalid description";
            return;
        }

        // Validate JSON settings
        const jsonValidation = validateSettingsJSON(settingsCode);
        if (!jsonValidation.valid) {
            errorMessage = jsonValidation.message || "Invalid JSON settings";
            return;
        }

        if (jsonError) {
            errorMessage = "Please fix the JSON settings before saving.";
            return;
        }

        submitting = true;
        errorMessage = "";

        try {
            // Compress pending images
            const pendingImagesData = [];
            for (const file of pendingImages) {
                try {
                    const compressed = await compressImage(file);
                    pendingImagesData.push(compressed);
                } catch (error) {
                    const detail =
                        error instanceof Error ? error.message : String(error);
                    throw new Error(`Image compression failed: ${detail}`);
                }
            }

            // Compress pending cover image
            let pendingCoverImageData = null;
            if (coverImagePending) {
                try {
                    pendingCoverImageData =
                        await compressImage(coverImagePending);
                } catch (error) {
                    const detail =
                        error instanceof Error ? error.message : String(error);
                    throw new Error(
                        `Cover image compression failed: ${detail}`,
                    );
                }
            }

            const payload: any = {
                themeName,
                description,
                imgs: images,
                coverImage,
                pendingImages: pendingImagesData,
                pendingCoverImage: pendingCoverImageData,
                settings: JSON.parse(settingsCode),
                isPublic: publish,
                tagNames,
            };

            const method = isEdit ? "PUT" : "POST";
            const url = isEdit
                ? `${PUBLIC_API_URL}/themes/${props.initialData?.themeId}`
                : `${PUBLIC_API_URL}/themes`;

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => "");
                throw new Error(
                    `[${response.status}] ${errorBody || response.statusText}`,
                );
            }

            const data = await response
                .json()
                .catch(() => ({ themeId: props.initialData?.themeId }));

            if (!publish) {
                localStorage.removeItem(draftKey);
                const draftId = data.themeId || props.initialData?.themeId;
                infoMessage =
                    "Draft saved. It will be available from your profile on any device.";
                if (!isEdit && draftId) {
                    setTimeout(() => {
                        window.location.href = `/themes/edit/${draftId}`;
                    }, 600);
                }
                return;
            }

            localStorage.removeItem(draftKey);

            success = true;
            setTimeout(() => {
                window.location.href = `/themes/${data.themeId || props.initialData?.themeId}`;
            }, 1000);
        } catch (error) {
            const detail =
                error instanceof Error ? error.message : String(error);
            ui.showModal("Operation Failed", detail, "error");
            errorMessage = detail;
        } finally {
            submitting = false;
        }
    }
</script>

<div class="editor-container">
    <div class="header">
        <h1 class="premium-font">
            {isEdit ? "Edit" : "Create"} <span class="glow">Theme</span>
        </h1>
    </div>

    {#if success}
        <div class="status-banner success" in:fade>
            {isEdit ? "Theme updated!" : "Theme published!"} Redirecting...
        </div>
    {/if}

    {#if infoMessage}
        <div class="status-banner info" in:fade>
            <div class="message-content">
                <span>✨ {infoMessage}</span>
                {#if infoMessage === "Browser backup restored from your last session."}
                    <button
                        type="button"
                        class="action-btn"
                        onclick={clearDraft}
                    >
                        Discard Draft
                    </button>
                {/if}
            </div>
        </div>
    {/if}

    {#if errorMessage}
        <div class="status-banner error" in:fade>
            ⚠️ {errorMessage}
        </div>
    {/if}

    <div class="editor-layout">
        <aside>
            <QuickScrollNav
                items={navigationItems}
                label="Theme editor sections"
            />
        </aside>

        <form onsubmit={handleSubmit} class="editor-grid">
            <div class="sections-wrapper">
                <div
                    class="editor-main"
                    in:fly={{ y: 20, duration: 400, delay: 150 }}
                >
                    <ThemeEditorBasicInfo
                        bind:themeName
                        bind:description
                        bind:images
                        bind:coverImage
                        bind:coverImagePending
                        bind:pendingImages
                        bind:errorMessage
                        bind:tagNames
                    />
                    <ThemeEditorSettings bind:settingsCode bind:jsonError />
                    <ThemeEditorPreview
                        {themeName}
                        {description}
                        {images}
                        {coverImage}
                        {coverImagePending}
                        {settingsCode}
                    />
                </div>
            </div>

            <div class="actions">
                {#if themeName || description !== defaultDescription || images.length > 0 || coverImage}
                    <button
                        type="button"
                        class="clear-btn"
                        onclick={clearDraft}
                        disabled={submitting}
                    >
                        Clear Draft
                    </button>
                {/if}
                <button
                    type="submit"
                    class="submit-btn premium-button"
                    disabled={submitting ||
                        !!jsonError ||
                        !!titleError ||
                        !!descriptionError}
                >
                    {submitting
                        ? "Saving..."
                        : isEdit
                          ? isServerDraft
                              ? "Publish Theme"
                              : "Update Theme"
                          : "Publish Theme"}
                </button>
                {#if !isEdit || isServerDraft}
                    <button
                        type="button"
                        class="draft-btn"
                        onclick={(event) => handleSubmit(event, false)}
                        disabled={submitting ||
                            !!jsonError ||
                            !!titleError ||
                            !!descriptionError}
                    >
                        Save Draft
                    </button>
                {/if}
            </div>
        </form>
    </div>
</div>

<style lang="scss">
    .editor-container {
        margin: 0 auto;
        padding-bottom: 5rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 2rem;

        h1 {
            margin: 0;
            font-size: 3rem;
        }
    }

    .status-banner {
        padding: 1rem;
        border-radius: var(--radius-md);
        margin-bottom: 1.5rem;
        font-weight: 600;

        &.success {
            background: rgba(0, 255, 150, 0.1);
            color: #00ff96;
            border: 1px solid rgba(0, 255, 150, 0.2);
        }
        &.error {
            background: rgba(255, 50, 50, 0.1);
            color: #ff3232;
            border: 1px solid rgba(255, 50, 50, 0.2);
        }
        &.info {
            background: rgba(var(--text-primary-rgb), 0.05);
            color: var(--text-primary);
            border: 1px solid var(--border-glass);
            backdrop-filter: blur(10px);
        }

        .message-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;

            .action-btn {
                background: var(--text-primary);
                color: var(--bg-dark);
                border: none;
                padding: 0.4rem 0.8rem;
                border-radius: var(--radius-sm);
                font-size: 0.85rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;

                &:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
            }
        }
    }

    .editor-layout {
        display: grid;
        grid-template-columns: 200px minmax(0, 1fr);
        gap: 2rem;
        align-items: start;

        aside {
            min-width: 0;
            height: 100%;
        }
    }

    .editor-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .sections-wrapper {
        min-width: 0;
        width: 100%;
        overflow: hidden;
    }

    .editor-main {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .actions {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;

        .submit-btn {
            flex: 1;
            padding: 1.5rem 2rem;
            font-size: 1.1rem;
            margin: 0;
        }

        .clear-btn {
            padding: 0 2rem;
            background: transparent;
            border: 1px solid var(--border-glass);
            color: var(--text-muted);
            border-radius: var(--radius-md);
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;

            &:hover {
                background: rgba(var(--text-primary-rgb), 0.05);
                color: var(--text-primary);
            }

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }

        .draft-btn {
            padding: 0 1.25rem;
            background: rgba(var(--text-primary-rgb), 0.05);
            border: 1px solid var(--border-glass);
            color: var(--text-primary);
            border-radius: var(--radius-md);
            font-weight: 700;
            cursor: pointer;

            &:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        }
    }

    :global(.quick-scroll-section) {
        scroll-margin-top: 12rem;
    }

    @media (max-width: 900px) {
        .header h1 {
            font-size: clamp(2rem, 10vw, 3rem);
        }

        .editor-layout {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;

            aside,
            .editor-grid {
                width: 100%;
            }

            aside {
                display: contents;
            }
        }

        :global(.quick-scroll-section) {
            scroll-margin-top: 15rem;
        }
    }
</style>
