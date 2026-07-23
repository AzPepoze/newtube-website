<script lang="ts">
    import { fly } from "svelte/transition";
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
        validateTagNames,
    } from "$lib/utils/validation";
    import ThemeEditorBasicInfo from "$lib/components/editor/ThemeEditorBasicInfo.svelte";
    import ThemeEditorSettings from "$lib/components/editor/ThemeEditorSettings.svelte";
    import ThemeEditorPreview from "$lib/components/editor/ThemeEditorPreview.svelte";
    import ThemeEditorBanners from "$lib/components/editor/ThemeEditorBanners.svelte";
    import ThemeEditorActions from "$lib/components/editor/ThemeEditorActions.svelte";
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
    let availableTags = $state<
        Array<{ id: string; name: string; slug: string; groupName: string }>
    >([]);

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

        const titleValidation = validateTitle(themeName);
        if (!titleValidation.valid) {
            errorMessage = titleValidation.message || "Invalid themeName";
            return;
        }

        const descriptionValidation = validateDescription(description);
        if (!descriptionValidation.valid) {
            errorMessage =
                descriptionValidation.message || "Invalid description";
            return;
        }

        const jsonValidation = validateSettingsJSON(settingsCode);
        if (!jsonValidation.valid) {
            errorMessage = jsonValidation.message || "Invalid JSON settings";
            return;
        }

        if (jsonError) {
            errorMessage = "Please fix the JSON settings before saving.";
            return;
        }

        const tagValidation = validateTagNames(tagNames, availableTags);
        if (!tagValidation.valid) {
            errorMessage = tagValidation.message || "Invalid tag selection";
            return;
        }

        submitting = true;
        errorMessage = "";

        try {
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

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        data.error ||
                        `Operation failed (HTTP ${response.status})`,
                );
            }

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

    <ThemeEditorBanners
        {success}
        {isEdit}
        {infoMessage}
        {errorMessage}
        {clearDraft}
    />

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
                        bind:availableTags
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

            <ThemeEditorActions
                {themeName}
                {description}
                {images}
                {coverImage}
                {clearDraft}
                {submitting}
                {jsonError}
                {titleError}
                {descriptionError}
                {isEdit}
                {isServerDraft}
                {handleSubmit}
            />
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
