<script lang="ts">
    import PrismEditor from "$lib/components/editor/PrismEditor.svelte";
    import MarkdownIt from "markdown-it";

    let { content = "" }: { content: string } = $props();

    const md = new MarkdownIt({
        html: false,
        linkify: true,
        typographer: true,
    });

    interface Block {
        type: "html" | "code";
        content: string;
        lang?: string;
    }

    let blocks = $derived.by(() => {
        if (!content) return [];

        const tokens = md.parse(content, {});
        const result: Block[] = [];
        let currentHtml = "";

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === "fence") {
                // Push collected HTML
                if (currentHtml) {
                    result.push({ type: "html", content: currentHtml });
                    currentHtml = "";
                }

                // Map common aliases to Prism language names
                const langMap: Record<string, string> = {
                    py: "python",
                    js: "javascript",
                    ts: "typescript",
                    sh: "bash",
                    html: "markup",
                    xml: "markup",
                };
                const lang = token.info?.trim();
                const mappedLang = langMap[lang] || lang || "none";

                // Push code block
                result.push({
                    type: "code",
                    content: token.content.trim(),
                    lang: mappedLang,
                });
            } else {
                // Render this token (and its children if any)
                currentHtml += md.renderer.render([token], md.options, {});
            }
        }

        if (currentHtml) {
            result.push({ type: "html", content: currentHtml });
        }

        return result;
    });
</script>

<div class="markdown-viewer markdown-content">
    {#each blocks as block}
        {#if block.type === "code"}
            <div class="code-block-wrapper">
                {#key block.content + block.lang}
                    <PrismEditor
                        value={block.content}
                        language={block.lang}
                        readOnly={true}
                        height="auto"
                    />
                {/key}
            </div>
        {:else}
            <div class="html-content">
                {@html block.content}
            </div>
        {/if}
    {/each}
</div>

<style lang="scss">
    .markdown-viewer {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .code-block-wrapper {
        margin: 1rem 0;

        :global(.prism-editor-host) {
            border-radius: var(--radius-md);
            background: #282a36;
        }

        :global(.light .prism-editor-host) {
            background: #f6f8fa;
        }
    }

    .html-content {
        :global(p:last-child) {
            margin-bottom: 0;
        }
    }
</style>
