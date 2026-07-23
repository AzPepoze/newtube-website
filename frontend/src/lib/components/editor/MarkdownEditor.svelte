<script lang="ts">
    import MarkdownViewer from "$lib/components/common/MarkdownViewer.svelte";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import PrismEditor from "$lib/components/editor/PrismEditor.svelte";
    import { LIMITS, validateDescription } from "$lib/utils/validation";
    import { onDestroy } from "svelte";
    import MarkdownEditorToolbar from "./MarkdownEditorToolbar.svelte";

    let { value = $bindable("") }: { value: string } = $props();
    let mode = $state<"split" | "editor" | "preview">("split");
    let isFullscreen = $state(false);
    let editorRef = $state<ReturnType<typeof PrismEditor>>();
    let descriptionError = $state("");
    let previewPane = $state<HTMLElement>();
    let lastScrollTop = 0;

    let editorHeight = $state(800);
    let isDragging = $state(false);
    let startY = 0;
    let startHeight = 0;

    let splitRatio = $state(50);
    let isSplitDragging = $state(false);
    let splitStartX = 0;
    let splitStartRatio = 50;
    let containerRef = $state<HTMLElement>();

    function startDrag(e: MouseEvent) {
        isDragging = true;
        startY = e.clientY;
        startHeight = editorHeight;
        document.body.style.cursor = "row-resize";
        document.body.style.userSelect = "none";

        window.addEventListener("mousemove", onDrag);
        window.addEventListener("mouseup", stopDrag);
    }

    function onDrag(e: MouseEvent) {
        if (!isDragging) return;
        const delta = e.clientY - startY;
        editorHeight = Math.max(250, startHeight + delta);
    }

    function stopDrag() {
        isDragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onDrag);
        window.removeEventListener("mouseup", stopDrag);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && isFullscreen) {
            isFullscreen = false;
        }
    }

    function startSplitDrag(e: MouseEvent) {
        if (!containerRef) return;
        isSplitDragging = true;
        splitStartX = e.clientX;
        splitStartRatio = splitRatio;
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";

        window.addEventListener("mousemove", onSplitDrag);
        window.addEventListener("mouseup", stopSplitDrag);
    }

    function onSplitDrag(e: MouseEvent) {
        if (!isSplitDragging || !containerRef) return;
        const rect = containerRef.getBoundingClientRect();
        const deltaX = e.clientX - splitStartX;
        const deltaPercent = (deltaX / rect.width) * 100;
        splitRatio = Math.min(80, Math.max(20, splitStartRatio + deltaPercent));
    }

    function stopSplitDrag() {
        isSplitDragging = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onSplitDrag);
        window.removeEventListener("mouseup", stopSplitDrag);
    }

    onDestroy(() => {
        if (typeof window !== "undefined") {
            window.removeEventListener("mousemove", onDrag);
            window.removeEventListener("mouseup", stopDrag);
            window.removeEventListener("mousemove", onSplitDrag);
            window.removeEventListener("mouseup", stopSplitDrag);
            document.body.style.cursor = "";
            document.body.style.userSelect = "";
        }
    });

    $effect.pre(() => {
        if (previewPane && value) {
            lastScrollTop = previewPane.scrollTop;
        }
    });

    $effect(() => {
        if (previewPane && value) {
            previewPane.scrollTop = lastScrollTop;
        }
    });

    $effect(() => {
        const validation = validateDescription(value);
        descriptionError = validation.message || "";
    });

    function handleAction(action: string) {
        if (!editorRef) return;
        switch (action) {
            case "bold":
                editorRef.insertAction("bold text", "**", "**");
                break;
            case "italic":
                editorRef.insertAction("italic text", "*", "*");
                break;
            case "h1":
                editorRef.insertAction("Heading 1", "# ", "");
                break;
            case "h2":
                editorRef.insertAction("Heading 2", "## ", "");
                break;
            case "h3":
                editorRef.insertAction("Heading 3", "### ", "");
                break;
            case "link":
                editorRef.insertAction("url", "[link text](", ")");
                break;
            case "image":
                editorRef.insertAction("url", "![alt text](", ")");
                break;
            case "code":
                editorRef.insertAction("code", "`", "`");
                break;
            case "quote":
                editorRef.insertAction("quote", "> ", "");
                break;
            case "list":
                editorRef.insertAction("list item", "- ", "");
                break;
            case "task":
                editorRef.insertAction("task", "- [ ] ", "");
                break;
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="markdown-editor-container" class:fullscreen={isFullscreen}>
    <MarkdownEditorToolbar bind:mode bind:isFullscreen {handleAction} />

    <div
        bind:this={containerRef}
        class="editor-pane-container"
        class:split={mode === "split"}
        class:editor-only={mode === "editor"}
        class:preview-only={mode === "preview"}
        class:dragging={isDragging || isSplitDragging}
        style="height: {editorHeight}px"
    >
        {#if mode !== "preview"}
            <div
                class="editor-pane"
                style={mode === "split" ? `width: ${splitRatio}%` : ""}
            >
                <PrismEditor
                    bind:this={editorRef}
                    bind:value
                    language="markdown"
                    height="100%"
                />
            </div>
        {/if}

        {#if mode === "split"}
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="split-divider" onmousedown={startSplitDrag}>
                <div class="divider-handle"></div>
            </div>
        {/if}

        {#if mode !== "editor"}
            <div
                class="preview-pane"
                bind:this={previewPane}
                style={mode === "split" ? `width: ${100 - splitRatio}%` : ""}
            >
                <div class="preview-header">
                    <MaterialIcon name="visibility" size={14} />
                    <span>PREVIEW</span>
                </div>
                <div class="preview-content">
                    <MarkdownViewer content={value || "*Nothing to preview*"} />
                </div>
            </div>
        {/if}
    </div>

    <div class="footer-info">
        <div class="validation-info">
            {#if descriptionError}
                <span class="error-msg">{descriptionError}</span>
            {:else}
                <span class="hint"
                    >Markdown formatting supported (headings, lists, code, etc.)</span
                >
            {/if}
        </div>
        <div
            class="char-counter"
            class:error={value.length > LIMITS.description}
        >
            {value.length} / {LIMITS.description}
        </div>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resize-bar" onmousedown={startDrag}>
        <div class="resize-handle"></div>
    </div>
</div>

<style lang="scss">
    .markdown-editor-container {
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-md);
        overflow: hidden;
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;

        :global(.light) & {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.1);
        }

        &.fullscreen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999;
            border-radius: 0;
            border: none;
            background: var(--bg-dark, #0d0e12);

            :global(.light) & {
                background: #ffffff;
            }

            .editor-pane-container {
                flex: 1;
                height: 100% !important;
            }

            .resize-bar {
                display: none;
            }
        }
    }

    .editor-pane-container {
        display: flex;
        min-height: 250px;
        position: relative;
        align-items: stretch;

        &.dragging {
            pointer-events: none;
            user-select: none;
        }

        &.split {
            .editor-pane {
                /* split-divider handles border separation */
            }
        }

        &.editor-only {
            .editor-pane {
                width: 100%;
            }
        }

        &.preview-only {
            .preview-pane {
                width: 100%;
            }
        }
    }

    .editor-pane {
        display: flex;
        flex-direction: column;

        :global(.prism-editor-host) {
            flex: 1;
            border: none;
            border-radius: 0;
        }
    }

    .preview-pane {
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.1);

        :global(.light) & {
            background: rgba(0, 0, 0, 0.02);
        }

        .preview-header {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.4rem 0.75rem;
            background: rgba(0, 0, 0, 0.2);
            font-size: 0.7rem;
            font-weight: 700;
            color: var(--text-muted);
            letter-spacing: 0.05em;
            border-bottom: 1px solid var(--border-glass);
            flex-shrink: 0;
        }

        .preview-content {
            padding: 1rem;
            font-size: 0.9rem;
            color: var(--text-primary);
            flex: 1;
            overflow-y: auto;
            min-height: 0;
        }
    }

    .footer-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 0.75rem;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid var(--border-glass);
        font-size: 0.75rem;

        .hint {
            color: var(--text-muted);
        }

        .error-msg {
            color: #ff4d4d;
        }

        .char-counter {
            color: var(--text-muted);
            font-family: monospace;

            &.error {
                color: #ff4d4d;
                font-weight: 700;
            }
        }
    }

    .resize-bar {
        height: 12px;
        background: rgba(0, 0, 0, 0.2);
        cursor: row-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        border-top: 1px solid var(--border-glass);
        transition: background 0.2s;

        &:hover,
        &:active {
            background: rgba(255, 255, 255, 0.1);
        }

        :global(.light) & {
            background: rgba(0, 0, 0, 0.03);

            &:hover,
            &:active {
                background: rgba(0, 0, 0, 0.08);
            }
        }
    }

    .resize-handle {
        width: 32px;
        height: 4px;
        border-radius: 2px;
        background: var(--text-muted);
        opacity: 0.4;
    }

    .split-divider {
        width: 12px;
        background: rgba(0, 0, 0, 0.25);
        border-left: 1px solid var(--border-glass);
        border-right: 1px solid var(--border-glass);
        cursor: col-resize;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        user-select: none;
        flex-shrink: 0;
        transition: background 0.2s;

        :global(.light) & {
            background: rgba(0, 0, 0, 0.04);
        }

        &:hover,
        &:active {
            background: rgba(var(--text-primary-rgb), 0.1);

            .divider-handle {
                background: var(--text-primary);
                opacity: 0.9;
            }
        }
    }

    .divider-handle {
        width: 4px;
        height: 32px;
        border-radius: 2px;
        background: var(--text-muted);
        opacity: 0.5;
        transition: all 0.2s;
    }

    @media (max-width: 768px) {
        .editor-pane-container.split {
            flex-direction: column;

            .editor-pane,
            .preview-pane {
                width: 100% !important;
            }

            .split-divider {
                display: none;
            }
        }
    }
</style>
