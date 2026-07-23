<script lang="ts">
    import PrismEditor from "$lib/components/editor/PrismEditor.svelte";
    import { validateDescription, LIMITS } from "$lib/utils/validation";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import MarkdownViewer from "$lib/components/common/MarkdownViewer.svelte";
    import MarkdownEditorToolbar from "./MarkdownEditorToolbar.svelte";

    let { value = $bindable("") }: { value: string } = $props();
    let mode = $state<"split" | "editor" | "preview">("split");
    let editorRef = $state<ReturnType<typeof PrismEditor>>();
    let descriptionError = $state("");
    let previewPane = $state<HTMLElement>();
    let lastScrollTop = 0;

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

<div class="markdown-editor-container">
    <MarkdownEditorToolbar bind:mode {handleAction} />

    <div
        class="editor-pane-container"
        class:split={mode === "split"}
        class:editor-only={mode === "editor"}
        class:preview-only={mode === "preview"}
    >
        {#if mode !== "preview"}
            <div class="editor-pane">
                <PrismEditor
                    bind:this={editorRef}
                    bind:value
                    language="markdown"
                />
            </div>
        {/if}

        {#if mode !== "editor"}
            <div class="preview-pane" bind:this={previewPane}>
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
    }

    .editor-pane-container {
        display: flex;
        min-height: 250px;
        position: relative;

        &.split {
            .editor-pane {
                width: 50%;
                border-right: 1px solid var(--border-glass);
            }
            .preview-pane {
                width: 50%;
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

        :global(.prism-editor-wrapper) {
            flex: 1;
            min-height: 250px;
            max-height: 500px;
            overflow-y: auto;
        }
    }

    .preview-pane {
        display: flex;
        flex-direction: column;
        background: rgba(0, 0, 0, 0.1);
        max-height: 500px;
        overflow-y: auto;

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
        }

        .preview-content {
            padding: 1rem;
            font-size: 0.9rem;
            color: var(--text-primary);
            flex: 1;
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

    @media (max-width: 768px) {
        .editor-pane-container.split {
            flex-direction: column;

            .editor-pane,
            .preview-pane {
                width: 100%;
            }

            .editor-pane {
                border-right: none;
                border-bottom: 1px solid var(--border-glass);
            }
        }
    }
</style>
