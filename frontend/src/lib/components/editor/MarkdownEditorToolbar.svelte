<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import CustomDropdown from "$lib/components/common/CustomDropdown.svelte";

    let {
        mode = $bindable(),
        handleAction,
    }: {
        mode: "split" | "editor" | "preview";
        handleAction: (action: string) => void;
    } = $props();

    const headingOptions = [
        { label: "H1 - Large", onClick: () => handleAction("h1") },
        { label: "H2 - Medium", onClick: () => handleAction("h2") },
        { label: "H3 - Small", onClick: () => handleAction("h3") },
    ];
</script>

<div class="toolbar">
    <div class="toolbar-left">
        <div class="header-title">MARKDOWN</div>
        {#if mode !== "preview"}
            <div class="macro-buttons">
                <button
                    class="macro-btn"
                    onclick={() => handleAction("bold")}
                    title="Bold"
                    type="button"
                >
                    <MaterialIcon name="format_bold" size={14} />
                </button>
                <button
                    class="macro-btn"
                    onclick={() => handleAction("italic")}
                    title="Italic"
                    type="button"
                >
                    <MaterialIcon name="format_italic" size={14} />
                </button>

                <CustomDropdown options={headingOptions} mode="menu">
                    {#snippet trigger(toggle)}
                        <button
                            class="macro-btn"
                            onclick={(e) => {
                                e.stopPropagation();
                                toggle();
                            }}
                            title="Heading"
                            type="button"
                        >
                            <MaterialIcon name="title" size={14} />
                        </button>
                    {/snippet}
                </CustomDropdown>

                <div class="divider"></div>
                <button
                    class="macro-btn"
                    onclick={() => handleAction("link")}
                    title="Link"
                    type="button"
                >
                    <MaterialIcon name="link" size={14} />
                </button>
                <button
                    class="macro-btn"
                    onclick={() => handleAction("image")}
                    title="Image"
                    type="button"
                >
                    <MaterialIcon name="image" size={14} />
                </button>
                <div class="divider"></div>
                <button
                    class="macro-btn"
                    onclick={() => handleAction("code")}
                    title="Code"
                    type="button"
                >
                    <MaterialIcon name="code" size={14} />
                </button>
                <button
                    class="macro-btn"
                    onclick={() => handleAction("quote")}
                    title="Quote"
                    type="button"
                >
                    <MaterialIcon name="format_quote" size={14} />
                </button>
                <div class="divider"></div>
                <button
                    class="macro-btn"
                    onclick={() => handleAction("list")}
                    title="List"
                    type="button"
                >
                    <MaterialIcon name="format_list_bulleted" size={14} />
                </button>
                <button
                    class="macro-btn"
                    onclick={() => handleAction("task")}
                    title="Task List"
                    type="button"
                >
                    <MaterialIcon name="checklist" size={14} />
                </button>
            </div>
        {/if}
    </div>

    <div class="mode-toggles">
        <button
            class="mode-btn"
            class:active={mode === "editor"}
            onclick={() => (mode = "editor")}
            title="Editor view"
            type="button"
        >
            <MaterialIcon name="code" size={14} />
            <span>Code</span>
        </button>
        <button
            class="mode-btn"
            class:active={mode === "split"}
            onclick={() => (mode = "split")}
            title="Split view"
            type="button"
        >
            <MaterialIcon name="splitscreen" size={14} />
            <span>Split</span>
        </button>
        <button
            class="mode-btn"
            class:active={mode === "preview"}
            onclick={() => (mode = "preview")}
            title="Preview view"
            type="button"
        >
            <MaterialIcon name="visibility" size={14} />
            <span>Preview</span>
        </button>
    </div>
</div>

<style lang="scss">
    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: rgba(var(--text-primary-rgb), 0.03);
        border-bottom: 1px solid var(--border-glass);
        font-family: monospace;

        .toolbar-left {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .header-title {
            font-size: 0.75rem;
            font-weight: 700;
            color: var(--text-muted);
            letter-spacing: 0.05em;
        }

        .macro-buttons {
            display: flex;
            align-items: center;
            gap: 0.25rem;

            .macro-btn {
                background: transparent;
                border: none;
                color: var(--text-secondary);
                padding: 0.25rem;
                border-radius: var(--radius-sm);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;

                &:hover {
                    background: rgba(var(--text-primary-rgb), 0.1);
                    color: var(--text-primary);
                }
            }

            .divider {
                width: 1px;
                height: 14px;
                background: var(--border-glass);
                margin: 0 0.25rem;
            }
        }

        .mode-toggles {
            display: flex;
            background: rgba(0, 0, 0, 0.2);
            border-radius: var(--radius-sm);
            padding: 2px;

            .mode-btn {
                background: transparent;
                border: none;
                color: var(--text-muted);
                padding: 0.2rem 0.5rem;
                border-radius: var(--radius-sm);
                font-size: 0.75rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.35rem;
                transition: all 0.2s;

                &:hover {
                    color: var(--text-primary);
                }

                &.active {
                    background: rgba(var(--text-primary-rgb), 0.1);
                    color: var(--text-primary);
                    font-weight: 600;
                }
            }
        }
    }
</style>
