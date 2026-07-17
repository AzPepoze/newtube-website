<script lang="ts">
    import PrismEditor from "$lib/components/editor/PrismEditor.svelte";
    import {
        validateSettingsJSON,
        formatBytes,
        LIMITS,
    } from "$lib/utils/validation";

    let {
        settingsCode = $bindable(""),
        jsonError = $bindable(""),
    }: {
        settingsCode: string;
        jsonError: string;
    } = $props();

    let sizeInBytes = $state(0);
    let isSettingsDisabled = $state(false);

    $effect(() => {
        const validation = validateSettingsJSON(settingsCode);
        sizeInBytes = validation.sizeInBytes;
        jsonError = validation.message || "";
        isSettingsDisabled =
            !validation.valid && validation.sizeInBytes > LIMITS.settingsJson;
    });
</script>

<div class="card glass-panel quick-scroll-section" id="theme-settings">
    <div class="card-header">
        <h3>Theme Settings (JSON)</h3>
        <span
            class="size-display"
            class:error={sizeInBytes > LIMITS.settingsJson}
        >
            {formatBytes(sizeInBytes)} / {formatBytes(LIMITS.settingsJson)}
        </span>
    </div>
    <PrismEditor
        bind:value={settingsCode}
        language="json"
        height="480px"
        readOnly={isSettingsDisabled}
    />
    <div class="editor-footer">
        {#if jsonError}
            <span class="json-error">{jsonError}</span>
        {:else if settingsCode}
            <span class="json-valid">✓ Valid JSON</span>
        {/if}
    </div>
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

            .size-display {
                font-size: 0.85rem;
                color: var(--text-secondary);
                font-weight: 600;

                &.error {
                    color: var(--error, #ff5a5a);
                }
            }
        }
    }

    .editor-footer {
        display: flex;
        gap: 1rem;
        padding-top: 0.75rem;
        font-size: 0.85rem;

        .json-error {
            color: var(--error, #ff5a5a);
            font-weight: 500;
        }

        .json-valid {
            color: var(--text-secondary);
        }
    }
</style>
