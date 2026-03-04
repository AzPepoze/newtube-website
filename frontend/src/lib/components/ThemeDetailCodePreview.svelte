<script lang="ts">
    import { fade } from "svelte/transition";
    import type { Theme } from "$lib/types";
    import PrismEditor from "$lib/components/PrismEditor.svelte";

    let {
        theme,
    }: {
        theme: Theme | null;
    } = $props();
</script>

{#if theme}
    <div class="section glass-panel">
        <h3>Settings JSON</h3>
        <div class="code-block" in:fade={{ duration: 200 }}>
            <PrismEditor
                value={JSON.stringify(theme.settings, null, 2)}
                language="json"
                readOnly={true}
                height="auto"
            />
        </div>
    </div>
    {#if theme.customStyleshift && theme.customStyleshift.length > 0}
        <div class="section glass-panel" style="margin-top: 1.5rem;">
            <h3>Custom Styles</h3>
            <div class="code-block" in:fade={{ duration: 200 }}>
                <PrismEditor
                    value={JSON.stringify(theme.customStyleshift, null, 2)}
                    language="json"
                    readOnly={true}
                    height="auto"
                />
            </div>
        </div>
    {/if}
{/if}

<style lang="scss">
    .section {
        padding: 1.5rem;

        h3 {
            margin: 0 0 1rem 0;
            font-size: 1rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.05em;
            font-weight: 600;
        }
    }

    .code-block {
        :global(.prism-editor-host) {
            border: none;
            background: transparent;
        }
    }
</style>
