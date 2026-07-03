<script lang="ts">
    import MarkdownEditor from "$lib/components/editor/MarkdownEditor.svelte";
    import FormField from "$lib/components/common/FormField.svelte";
    import ImageDropZone from "$lib/components/editor/ImageDropZone.svelte";
    import ImageUrlInput from "$lib/components/editor/ImageUrlInput.svelte";
    import ImageGrid from "$lib/components/editor/ImageGrid.svelte";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import { validateTitle, LIMITS } from "$lib/utils/validation";

    let {
        themeName = $bindable(""),
        description = $bindable(""),
        images = $bindable([]),
        coverImage = $bindable(""),
        pendingImages = $bindable<File[]>([]),
        errorMessage = $bindable(""),
        coverImagePending = $bindable(null),
    }: {
        themeName: string;
        description: string;
        images: string[];
        coverImage: string;
        pendingImages: File[];
        errorMessage: string;
        coverImagePending: File | null;
    } = $props();

    let titleError = $state("");
    let isNameDisabled = $state(false);

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
</script>

<div class="card glass-panel">
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
</div>

<div class="card glass-panel">
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

<div class="card glass-panel">
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
</style>
