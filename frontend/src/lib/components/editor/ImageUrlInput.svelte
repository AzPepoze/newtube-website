<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    let {
        onAddUrl,
    }: {
        onAddUrl: (url: string) => void;
    } = $props();

    let value = $state("");

    function handleAdd() {
        if (value.trim()) {
            onAddUrl(value.trim());
            value = "";
        }
    }
</script>

<div class="url-input-wrapper">
    <div class="icon-input">
        <MaterialIcon name="link" size={16} />
        <input
            type="url"
            bind:value
            placeholder="Or paste an image URL..."
            onkeydown={(e) =>
                e.key === "Enter" && (e.preventDefault(), handleAdd())}
        />
    </div>
    <button
        type="button"
        class="add-url-btn premium-button"
        onclick={handleAdd}
    >
        Add URL
    </button>
</div>

<style lang="scss">
    .url-input-wrapper {
        display: flex;
        gap: 0.75rem;
        margin-bottom: 2.5rem;

        .icon-input {
            flex: 1;
            position: relative;
            display: flex;
            align-items: center;

            input {
                width: 100%;
                background: rgba(var(--text-primary-rgb), 0.03);
                border: 1px solid var(--border-glass);
                padding: 0.8rem 1rem 0.8rem 2.8rem;
                border-radius: var(--radius-sm);
                color: var(--text-primary);
                font-family: inherit;
                font-size: 1rem;
                transition: all 0.2s;

                &:focus {
                    outline: none;
                    border-color: var(--text-primary);
                    background: rgba(var(--text-primary-rgb), 0.05);
                }
            }

            :global(span.material-icons) {
                position: absolute;
                left: 1rem;
                color: var(--text-muted);
            }
        }

        .add-url-btn {
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
</style>
