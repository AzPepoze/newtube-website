<script lang="ts">
    import { onMount } from "svelte";
    import MarkdownEditor from "$lib/components/editor/MarkdownEditor.svelte";
    import FormField from "$lib/components/common/FormField.svelte";
    import ImageDropZone from "$lib/components/editor/ImageDropZone.svelte";
    import ImageUrlInput from "$lib/components/editor/ImageUrlInput.svelte";
    import ImageGrid from "$lib/components/editor/ImageGrid.svelte";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import { validateTitle, LIMITS } from "$lib/utils/validation";
    import { PUBLIC_API_URL } from "$lib/constants/index";

    let {
        themeName = $bindable(""),
        description = $bindable(""),
        images = $bindable([]),
        coverImage = $bindable(""),
        pendingImages = $bindable<File[]>([]),
        errorMessage = $bindable(""),
        coverImagePending = $bindable(null),
        tagNames = $bindable<string[]>([]),
        categoryId = $bindable(""),
    }: {
        themeName: string;
        description: string;
        images: string[];
        coverImage: string;
        pendingImages: File[];
        errorMessage: string;
        coverImagePending: File | null;
        tagNames: string[];
        categoryId: string;
    } = $props();

    let titleError = $state("");
    let isNameDisabled = $state(false);
    let tagInput = $state("");
    let availableTags = $state<
        Array<{ id: string; name: string; slug: string }>
    >([]);
    let categories = $state<Array<{ id: string; name: string; slug: string }>>(
        [],
    );
    let tagsAndCategoriesError = $state("");

    $effect(() => {
        const validation = validateTitle(themeName);
        titleError = validation.message || "";
        isNameDisabled = themeName.length >= LIMITS.title;
    });

    function validateAndAddFiles(
        files: File[],
        target: "cover" | "screenshots",
    ) {
        const validFiles = files.filter((file) => {
            if (!file.type.startsWith("image/")) {
                errorMessage = "Please upload only image files.";
                return false;
            }
            return true;
        });

        if (target === "cover") {
            if (validFiles.length > 0) coverImagePending = validFiles[0];
        } else {
            pendingImages = [...pendingImages, ...validFiles];
        }
    }

    function normalizeTag(value: string) {
        return value.trim().replace(/\s+/g, " ").toLowerCase();
    }

    function addTag() {
        const tag = normalizeTag(tagInput);
        if (!tag) return;
        if (
            !availableTags.some(
                (availableTag) => normalizeTag(availableTag.name) === tag,
            )
        ) {
            tagsAndCategoriesError = "Select a tag from the available tags.";
            return;
        }
        if (tagNames.includes(tag)) {
            tagInput = "";
            return;
        }
        if (tagNames.length >= 10) {
            tagsAndCategoriesError = "A theme can have at most 10 tags.";
            return;
        }
        tagNames = [...tagNames, tag];
        tagInput = "";
        tagsAndCategoriesError = "";
    }

    function removeTag(tag: string) {
        tagNames = tagNames.filter((value) => value !== tag);
    }

    async function loadTagsAndCategories() {
        try {
            const [tagsResponse, categoriesResponse] = await Promise.all([
                fetch(`${PUBLIC_API_URL}/tags`, { credentials: "include" }),
                fetch(`${PUBLIC_API_URL}/categories`, {
                    credentials: "include",
                }),
            ]);
            if (tagsResponse.ok) availableTags = await tagsResponse.json();
            if (categoriesResponse.ok) {
                categories = await categoriesResponse.json();
                const existing = categories.find(
                    (category) =>
                        category.name === categoryId ||
                        category.slug === categoryId,
                );
                if (existing) categoryId = existing.id;
            }
        } catch {
            tagsAndCategoriesError =
                "Tags and categories could not be loaded. Please try again.";
        }
    }

    onMount(loadTagsAndCategories);
</script>

<div class="card glass-panel quick-scroll-section" id="basic-info">
    <h3>Basic Information</h3>
    <FormField
        label="Name"
        id="themeName"
        error={titleError}
        currentLength={themeName.length}
        maxLength={LIMITS.title}
    >
        <input
            id="themeName"
            type="text"
            bind:value={themeName}
            placeholder="Theme Name"
            disabled={isNameDisabled}
            required
        />
    </FormField>

    <FormField label="Description (Markdown Supported)" id="description">
        <MarkdownEditor bind:value={description} />
        <div class="highlight-note">
            <MaterialIcon name="info" size={14} />
            <span
                >Supported highlighting in code blocks: <code>py</code>,
                <code>js</code>, <code>ts</code>, <code>html</code>,
                <code>css</code>, <code>json</code>, <code>bash</code></span
            >
        </div>
    </FormField>

    <div class="tags-and-categories">
        <div class="tags-and-categories-heading">
            <label for="theme-tags">Tags</label><span>{tagNames.length}/10</span
            >
        </div>
        <div class="tag-entry">
            <select id="theme-tags" bind:value={tagInput}>
                <option value="">Select a tag</option>
                {#each availableTags as tag (tag.id)}<option
                        value={tag.name}
                        disabled={tagNames.includes(normalizeTag(tag.name))}
                        >{tag.name}</option
                    >{/each}
            </select>
            <button
                type="button"
                onclick={addTag}
                disabled={!tagInput || tagNames.length >= 10}>Add</button
            >
        </div>
        {#if tagNames.length}<div class="tag-list">
                {#each tagNames as tag (tag)}<button
                        type="button"
                        class="tag"
                        onclick={() => removeTag(tag)}
                        >{tag}<span aria-hidden="true">×</span><span
                            class="sr-only">Remove {tag}</span
                        ></button
                    >{/each}
            </div>{/if}
        <label class="category-label" for="theme-category">Category</label>
        <select id="theme-category" bind:value={categoryId}>
            <option value="">No category</option>
            {#each categories as category (category.id)}<option
                    value={category.id}>{category.name}</option
                >{/each}
        </select>
        {#if tagsAndCategoriesError}<p
                class="tags-and-categories-error"
                role="status"
            >
                {tagsAndCategoriesError}
            </p>{/if}
    </div>
</div>

<div class="card glass-panel quick-scroll-section" id="cover-image">
    <div class="card-header">
        <h3>Cover Image</h3>
        <p class="hint">One image for your theme card preview</p>
    </div>

    <ImageDropZone
        onFilesSelected={(files) => validateAndAddFiles(files, "cover")}
    />

    <ImageUrlInput onAddUrl={(url) => (coverImage = url)} />

    <ImageGrid
        images={coverImage ? [coverImage] : []}
        pendingImages={coverImagePending ? [coverImagePending] : []}
        onRemoveImage={() => (coverImage = "")}
        onRemovePending={() => (coverImagePending = null)}
    />
</div>

<div class="card glass-panel quick-scroll-section" id="screenshots">
    <div class="card-header">
        <h3>Screenshots</h3>
        <p class="hint">Upload up to 5 screenshots of your theme</p>
    </div>

    <ImageDropZone
        multiple
        onFilesSelected={(files) => validateAndAddFiles(files, "screenshots")}
    />

    <ImageUrlInput
        onAddUrl={(url) => {
            if (!images.includes(url)) images = [...images, url];
        }}
    />

    <ImageGrid
        {images}
        {pendingImages}
        onRemoveImage={(index) =>
            (images = images.filter((_, i) => i !== index))}
        onRemovePending={(index) =>
            (pendingImages = pendingImages.filter((_, i) => i !== index))}
    />
</div>

<style lang="scss">
    .card {
        padding: 2.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2rem;

        h3 {
            margin: 0;
            font-size: 1.25rem;
            font-weight: 700;
            color: var(--text-primary);
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-wrap: wrap;
            margin-bottom: 0.5rem;

            .hint {
                margin: 0;
                font-size: 0.9rem;
                color: var(--text-secondary);
            }
        }

        .highlight-note {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.75rem;
            font-size: 0.8rem;
            color: var(--text-muted);

            code {
                background: rgba(var(--text-primary-rgb), 0.05);
                padding: 0.1rem 0.3rem;
                border-radius: 4px;
                color: var(--text-primary);
                font-family: "Fira Code", monospace;
            }
        }
    }

    input {
        background: rgba(var(--text-primary-rgb), 0.03);
        border: 1px solid var(--border-glass);
        padding: 1rem 1.25rem;
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 1.1rem;
        transition: all 0.2s;
        width: 100%;

        &::placeholder {
            color: var(--text-muted);
        }

        &:focus {
            outline: none;
            border-color: var(--text-primary);
            background: rgba(var(--text-primary-rgb), 0.05);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            background: rgba(var(--text-primary-rgb), 0.01);
        }
    }

    .tags-and-categories {
        display: grid;
        gap: 0.65rem;
        padding-top: 0.25rem;
    }
    .tags-and-categories-heading {
        display: flex;
        justify-content: space-between;
        color: var(--text-secondary);
        font-size: 0.9rem;
    }
    .tag-entry {
        display: flex;
        gap: 0.6rem;
    }
    .tag-entry button,
    .tag {
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(var(--text-primary-rgb), 0.06);
        color: var(--text-primary);
        cursor: pointer;
        font: inherit;
        font-weight: 600;
    }
    .tag-entry button {
        padding: 0 0.9rem;
    }
    .tag-entry button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .tag-list {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
    }
    .tag {
        padding: 0.35rem 0.55rem;
        display: flex;
        gap: 0.35rem;
        align-items: center;
    }
    .tag span:first-child {
        font-size: 1rem;
        line-height: 1;
    }
    .category-label {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-top: 0.25rem;
    }
    select {
        background: rgba(var(--text-primary-rgb), 0.03);
        border: 1px solid var(--border-glass);
        padding: 0.8rem 1rem;
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font: inherit;
    }
    select option {
        color: #111;
    }
    .tags-and-categories-error {
        margin: 0;
        color: #ff9696;
        font-size: 0.85rem;
    }
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
    }
</style>
