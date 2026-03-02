<script lang="ts">
    import { onMount } from "svelte";
    import { fade, fly } from "svelte/transition";
    import { env } from "$env/dynamic/public";
    import { getUserId } from "$lib/auth";
    import type { Theme } from "$lib/types";
    import EditIcon from "$lib/icons/EditIcon.svelte";
    import EyeIcon from "$lib/icons/EyeIcon.svelte";
    import PlusIcon from "$lib/icons/PlusIcon.svelte";
    import TrashIcon from "$lib/icons/TrashIcon.svelte";
    import UploadIcon from "$lib/icons/UploadIcon.svelte";
    import LinkIcon from "$lib/icons/LinkIcon.svelte";

    let {
        initialData,
        isEdit = false,
    }: { initialData?: Partial<Theme>; isEdit?: boolean } = $props();

    const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

    let userId = getUserId();
    let name = $state(initialData?.name || "");
    let description = $state(initialData?.description || "");
    let images = $state<string[]>(initialData?.images || []);
    let newImageUrl = $state("");
    let settingsCode = $state(
        JSON.stringify(
            initialData?.settings || {
                MainThemeColor: "#ffffff",
                EnableBackground: true,
                EnableAnimationsTransitions: true,
            },
            null,
            2,
        ),
    );

    let submitting = $state(false);
    let success = $state(false);
    let errorMessage = $state("");
    let activeTab = $state<"info" | "preview">("info");
    let jsonError = $state("");
    let isDragging = $state(false);

    function handleFile(file: File) {
        if (!file.type.startsWith("image/")) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result && !images.includes(result)) {
                images = [...images, result];
            }
        };
        reader.readAsDataURL(file);
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;

        if (e.dataTransfer?.files) {
            Array.from(e.dataTransfer.files).forEach(handleFile);
        }
    }

    function handleFileSelect(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input.files) {
            Array.from(input.files).forEach(handleFile);
        }
    }

    function addImage() {
        const url = newImageUrl.trim();
        if (!url || images.includes(url)) return;
        images = [...images, url];
        newImageUrl = "";
    }

    function removeImage(index: number) {
        images = images.filter((_, i) => i !== index);
    }

    $effect(() => {
        try {
            JSON.parse(settingsCode);
            jsonError = "";
        } catch (e: any) {
            jsonError = e.message;
        }
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!userId) {
            errorMessage = "You must be logged in to save a theme.";
            return;
        }

        if (jsonError) {
            errorMessage = "Please fix the JSON settings before saving.";
            return;
        }

        submitting = true;
        errorMessage = "";

        const payload = {
            owner_id: userId,
            name,
            description,
            imgs: images, // Backend expects 'imgs' for POST/PUT
            settings: JSON.parse(settingsCode),
            customStyleshiftItems: initialData?.custom_styleshift || [],
        };

        try {
            const method = isEdit ? "PUT" : "POST";
            const url = isEdit
                ? `${PUBLIC_API_URL}/themes/${initialData?.id}`
                : `${PUBLIC_API_URL}/themes`;

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok)
                throw new Error(
                    `Failed to ${isEdit ? "update" : "create"} theme`,
                );

            const data = await response
                .json()
                .catch(() => ({ id: initialData?.id }));
            success = true;
            setTimeout(() => {
                window.location.href = `/themes/${data.id || initialData?.id}`;
            }, 1000);
        } catch (error) {
            console.error(error);
            errorMessage = `Failed to ${isEdit ? "update" : "create"} theme. Please try again.`;
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
        <div class="tabs">
            <button
                class:active={activeTab === "info"}
                onclick={() => (activeTab = "info")}
            >
                <EditIcon size={16} /> Editor
            </button>
            <button
                class:active={activeTab === "preview"}
                onclick={() => (activeTab = "preview")}
            >
                <EyeIcon size={16} /> Preview
            </button>
        </div>
    </div>

    {#if success}
        <div class="status-banner success" in:fade>
            {isEdit ? "Theme updated!" : "Theme published!"} Redirecting...
        </div>
    {/if}

    {#if errorMessage}
        <div class="status-banner error" in:fade>
            ⚠️ {errorMessage}
        </div>
    {/if}

    <form onsubmit={handleSubmit} class="editor-grid">
        {#if activeTab === "info"}
            <div class="editor-main" in:fly={{ y: 20, duration: 400 }}>
                <div class="card glass-panel">
                    <h3>Basic Information</h3>
                    <div class="field">
                        <label for="name">Name</label>
                        <input
                            id="name"
                            type="text"
                            bind:value={name}
                            placeholder="Cyberpunk Neon"
                            required
                        />
                    </div>
                    <div class="field">
                        <label for="description">Description</label>
                        <textarea
                            id="description"
                            bind:value={description}
                            rows="3"
                            placeholder="A futuristic theme with glowing colors."
                            required
                        ></textarea>
                    </div>
                </div>

                <div class="card glass-panel">
                    <div class="card-header">
                        <h3>Screenshots</h3>
                        <p class="hint">
                            Upload up to 5 screenshots of your theme
                        </p>
                    </div>

                    <div
                        class="drop-zone"
                        class:dragging={isDragging}
                        role="button"
                        tabindex="0"
                        ondragover={(e) => {
                            e.preventDefault();
                            isDragging = true;
                        }}
                        ondragleave={() => (isDragging = false)}
                        ondrop={handleDrop}
                    >
                        <UploadIcon size={32} />
                        <div class="drop-text">
                            <p>Drag & Drop images here or</p>
                            <label class="browse-btn">
                                Browse Files
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onchange={handleFileSelect}
                                    hidden
                                />
                            </label>
                        </div>
                    </div>

                    <div class="url-input-wrapper">
                        <div class="icon-input">
                            <LinkIcon size={16} />
                            <input
                                type="url"
                                bind:value={newImageUrl}
                                placeholder="Or paste an image URL..."
                                onkeydown={(e) =>
                                    e.key === "Enter" &&
                                    (e.preventDefault(), addImage())}
                            />
                        </div>
                        <button
                            type="button"
                            class="add-url-btn"
                            onclick={addImage}
                        >
                            Add URL
                        </button>
                    </div>

                    <div class="images-grid">
                        {#each images as url, i}
                            <div class="image-item glass-panel" in:fade>
                                <img src={url} alt="Screenshot {i + 1}" />
                                <button
                                    type="button"
                                    class="remove-btn"
                                    onclick={() => removeImage(i)}
                                    title="Remove Screenshot"
                                >
                                    <TrashIcon size={14} />
                                </button>
                            </div>
                        {/each}
                    </div>
                </div>

                <div class="card glass-panel">
                    <div class="card-header">
                        <h3>Theme Settings (JSON)</h3>
                        {#if jsonError}
                            <span class="json-error">{jsonError}</span>
                        {:else}
                            <span class="json-valid">✓ Valid JSON</span>
                        {/if}
                    </div>
                    <textarea
                        class="json-editor"
                        bind:value={settingsCode}
                        rows="10"
                        spellcheck="false"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    class="submit-btn"
                    disabled={submitting || !!jsonError}
                >
                    {submitting
                        ? "Saving..."
                        : isEdit
                          ? "Update Theme"
                          : "Publish Theme"}
                </button>
            </div>
        {:else}
            <div class="preview-main" in:fly={{ y: 20, duration: 400 }}>
                <div class="preview-card glass-panel">
                    <h3>Card Preview</h3>
                    <div class="mock-card glass-panel">
                        <div class="mock-image">
                            {#if images[0]}
                                <img src={images[0]} alt="Preview" />
                            {:else}
                                <div class="placeholder">
                                    {name.charAt(0) || "T"}
                                </div>
                            {/if}
                        </div>
                        <div class="mock-content">
                            <h4>{name || "Theme Name"}</h4>
                            <p>
                                {description ||
                                    "Description will appear here..."}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="preview-card glass-panel">
                    <h3>Raw Data</h3>
                    <pre><code
                            >{JSON.stringify(
                                {
                                    name,
                                    description,
                                    images,
                                    settings: JSON.parse(settingsCode || "{}"),
                                },
                                null,
                                2,
                            )}</code
                        ></pre>
                </div>
            </div>
        {/if}
    </form>
</div>

<style lang="scss">
    .editor-container {
        max-width: 1000px;
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
            font-size: 2.5rem;
            .glow {
                @include glow-text;
            }
        }
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        background: rgba(255, 255, 255, 0.03);
        padding: 0.3rem;
        border-radius: $radius-md;
        border: 1px solid $border-glass;

        button {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            border: none;
            background: transparent;
            color: $text-muted;
            font-family: inherit;
            font-weight: 600;
            cursor: pointer;
            border-radius: $radius-sm;
            transition: all 0.2s;

            &.active {
                background: var(--text-primary);
                color: var(--bg-dark);
            }
        }
    }

    .status-banner {
        padding: 1rem;
        border-radius: $radius-md;
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
    }

    .editor-grid {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .card {
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin-bottom: 2rem;

        h3 {
            margin: 0;
            font-size: 1.1rem;
            color: $text-secondary;
        }

        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .json-error {
                font-size: 0.8rem;
                color: #ff3232;
            }
            .json-valid {
                font-size: 0.8rem;
                color: #ffffff;
                opacity: 0.6;
            }
        }
    }

    .field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        label {
            font-size: 0.85rem;
            color: $text-muted;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 700;
        }

        input,
        textarea {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-glass);
            padding: 0.8rem 1rem;
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 1rem;
            transition: all 0.2s;

            &:focus {
                outline: none;
                border-color: rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.05);
            }
        }
    }

    .image-input {
        display: flex;
        gap: 0.5rem;

        input {
            flex: 1;
            border-radius: $radius-sm;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid $border-glass;
            padding: 0.8rem 1rem;
            color: $text-primary;
            font-family: inherit;
        }

        .add-btn {
            @include premium-button;
            padding: 0 1rem;
        }
    }

    .drop-zone {
        border: 2px dashed var(--border-glass);
        border-radius: var(--radius-md);
        padding: 3rem 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
        transition: all 0.2s ease;
        background: rgba(var(--text-primary-rgb), 0.02);
        cursor: pointer;
        text-align: center;
        margin-bottom: 1.5rem;

        &:hover,
        &.dragging {
            border-color: var(--text-primary);
            background: rgba(var(--text-primary-rgb), 0.05);
            color: var(--text-primary);
        }

        .drop-text {
            p {
                margin: 0 0 0.5rem;
                font-size: 1rem;
                color: var(--text-secondary);
            }

            .browse-btn {
                color: var(--text-primary);
                font-weight: 700;
                text-decoration: underline;
                cursor: pointer;
                font-size: 1.1rem;

                &:hover {
                    opacity: 0.8;
                }
            }
        }
    }

    .url-input-wrapper {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 2.5rem;

        .icon-input {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;

            svg {
                position: absolute;
                left: 1rem;
                opacity: 0.5;
            }

            input {
                width: 100%;
                background: rgba(255, 255, 255, 0.02);
                border: 1px solid var(--border-glass);
                padding: 0.8rem 1rem 0.8rem 2.8rem;
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 1rem;
                transition: all 0.2s;

                &:focus {
                    outline: none;
                    border-color: rgba(255, 255, 255, 0.3);
                    background: rgba(255, 255, 255, 0.05);
                }
            }
        }

        .add-url-btn {
            @include premium-button;
            white-space: nowrap;
            padding: 0 1.5rem;
            background: transparent;
            color: var(--text-primary);
            border-color: var(--border-glass);

            &:hover {
                background: var(--text-primary);
                color: var(--bg-dark);
            }
        }
    }

    .images-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;

        .image-item {
            position: relative;
            background: rgba(0, 0, 0, 0.2);
            border-radius: $radius-sm;
            overflow: hidden;
            aspect-ratio: 16/9;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            border: 1px solid var(--border-glass);

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .remove-btn {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                background: rgba(255, 50, 50, 0.9);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transform: translateY(-5px);
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 10px rgba(255, 50, 50, 0.3);
            }

            &:hover .remove-btn {
                opacity: 1;
                transform: translateY(0);
            }
        }
    }

    .json-editor {
        font-family: "Fira Code", "Courier New", monospace;
        background: #050505;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        color: #ffffff;
        padding: 1rem;
        font-size: 0.9rem;
        line-height: 1.5;
        resize: vertical;

        &:focus {
            border-color: rgba(255, 255, 255, 0.2);
        }
    }

    .submit-btn {
        @include premium-button;
        width: 100%;
        font-size: 1.1rem;
        padding: 1.2rem;
        margin-top: 2rem;
        background: var(--text-primary);
        color: var(--bg-dark);

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
    }

    .preview-main {
        display: flex;
        flex-direction: column;
        gap: 2rem;
    }

    .preview-card {
        padding: 2rem;
        h3 {
            margin: 0 0 1.5rem;
            font-size: 0.9rem;
            color: $text-muted;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        pre {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: $radius-sm;
            overflow-x: auto;
            code {
                font-family: monospace;
                font-size: 0.85rem;
                color: $text-secondary;
            }
        }
    }

    .mock-card {
        max-width: 320px;
        overflow: hidden;

        .mock-image {
            aspect-ratio: 16/9;
            background: rgba(0, 0, 0, 0.2);
            overflow: hidden;
            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .placeholder {
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 3rem;
                background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
                opacity: 0.3;
            }
        }

        .mock-content {
            padding: 1.5rem;
            h4 {
                margin: 0 0 0.5rem;
                font-size: 1.1rem;
            }
            p {
                margin: 0;
                font-size: 0.9rem;
                color: $text-secondary;
                line-height: 1.5;
            }
        }
    }
</style>
