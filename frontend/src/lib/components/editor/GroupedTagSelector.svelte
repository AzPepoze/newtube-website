<script lang="ts">
    import { fade } from "svelte/transition";

    interface Tag {
        id: string;
        name: string;
        slug: string;
        groupName: string;
    }

    let {
        availableTags = [],
        selectedTags = $bindable([]),
        errorMessage = $bindable(""),
    } = $props<{
        availableTags: Tag[];
        selectedTags: string[];
        errorMessage: string;
    }>();

    // Group tags by groupName
    const groupedTags = $derived.by(() => {
        const groups: Record<string, Tag[]> = {};
        for (const tag of availableTags) {
            const group = tag.groupName || "Other";
            if (!groups[group]) {
                groups[group] = [];
            }
            groups[group].push(tag);
        }
        return groups;
    });

    function normalizeTag(value: string) {
        return value.trim().replace(/\s+/g, " ").toLowerCase();
    }

    $effect(() => {
        if (selectedTags.length > 10) {
            errorMessage = "A theme can have at most 10 tags.";
            return;
        }
        if (availableTags.length > 0 && selectedTags.length > 0) {
            const availableSet = new Set(
                availableTags.flatMap((t: Tag) => [
                    normalizeTag(t.name),
                    normalizeTag(t.slug),
                ]),
            );
            const hasInvalid = selectedTags.some(
                (t: string) => !availableSet.has(normalizeTag(t)),
            );
            if (hasInvalid) {
                errorMessage = "Tags must be selected from the available tags";
                return;
            }
        }
        if (
            errorMessage === "Tags must be selected from the available tags" ||
            errorMessage === "A theme can have at most 10 tags."
        ) {
            errorMessage = "";
        }
    });

    function toggleTag(tag: Tag) {
        const normalized = normalizeTag(tag.name);
        if (selectedTags.includes(normalized)) {
            selectedTags = selectedTags.filter((t: string) => t !== normalized);
        } else {
            if (selectedTags.length >= 10) {
                errorMessage = "A theme can have at most 10 tags.";
                return;
            }
            selectedTags = [...selectedTags, normalized];
        }
    }
</script>

<div class="grouped-tag-selector">
    {#each Object.entries(groupedTags) as [groupName, tags] (groupName)}
        <div class="tag-group">
            <h4 class="group-title">{groupName}</h4>
            <div class="chips-container">
                {#each tags as tag (tag.id)}
                    {@const isSelected = selectedTags.includes(
                        normalizeTag(tag.name),
                    )}
                    <button
                        type="button"
                        class="chip-btn"
                        class:selected={isSelected}
                        class:disabled={!isSelected &&
                            selectedTags.length >= 10}
                        onclick={() => toggleTag(tag)}
                        aria-pressed={isSelected}
                    >
                        {tag.name}
                        {#if isSelected}
                            <span
                                class="remove-indicator"
                                transition:fade={{ duration: 100 }}>×</span
                            >
                        {/if}
                    </button>
                {/each}
            </div>
        </div>
    {/each}
</div>

<style lang="scss">
    .grouped-tag-selector {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .tag-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .group-title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .chips-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
    }

    .chip-btn {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.5rem 0.9rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-full, 9999px);
        background: rgba(var(--text-primary-rgb), 0.03);
        color: var(--text-secondary);
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        user-select: none;

        :global(.light) & {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.1);
        }

        &:hover:not(.disabled) {
            background: rgba(var(--text-primary-rgb), 0.08);
            border-color: rgba(var(--text-primary-rgb), 0.2);
            color: var(--text-primary);

            :global(.light) & {
                background: rgba(0, 0, 0, 0.03);
                border-color: rgba(0, 0, 0, 0.2);
            }
        }

        &.selected {
            background: rgba(var(--text-primary-rgb), 0.15);
            border-color: var(--text-primary);
            color: var(--text-primary);
            font-weight: 600;
            box-shadow: 0 0 8px rgba(var(--text-primary-rgb), 0.1);

            :global(.light) & {
                background: rgba(0, 0, 0, 0.08);
                border-color: #000000;
            }
        }

        &.disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }

        .remove-indicator {
            font-size: 1.1rem;
            line-height: 1;
            margin-left: 0.15rem;
            opacity: 0.8;
        }
    }
</style>
