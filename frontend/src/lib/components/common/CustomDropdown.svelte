<script lang="ts">
    import { onMount, type Snippet } from "svelte";
    import {
        groupDropdownOptions,
        getSelectedLabel,
        handleOptionSelect,
        type DropdownOption,
    } from "./dropdownUtils";
    import CustomDropdownMenu from "./CustomDropdownMenu.svelte";

    let {
        options,
        value = $bindable(),
        placeholder = "Select an option",
        mode = "select",
        trigger = null,
        onChange = undefined,
        multiple = false,
        selectedValues = $bindable<string[]>([]),
        onValuesChange = undefined,
    } = $props<{
        options: DropdownOption[];
        value?: string;
        placeholder?: string;
        mode?: "select" | "menu";
        trigger?: Snippet<[toggle: () => void]>;
        onChange?: (value: string) => void;
        multiple?: boolean;
        selectedValues?: string[];
        onValuesChange?: (values: string[]) => void;
    }>();

    let isOpen = $state(false);
    let container: HTMLElement;

    const selectedLabel = $derived(
        getSelectedLabel(options, value, placeholder, multiple, selectedValues),
    );

    const groupedOptions = $derived(groupDropdownOptions(options));

    const hasGroups = $derived(
        options.some((opt: DropdownOption) => Boolean(opt.group)),
    );

    function toggle() {
        isOpen = !isOpen;
    }

    function select(option: DropdownOption) {
        const result = handleOptionSelect(
            option,
            multiple,
            selectedValues,
            onChange,
            onValuesChange,
        );
        if (result.nextValue !== undefined) {
            value = result.nextValue;
        }
        if (result.nextSelectedValues !== undefined) {
            selectedValues = result.nextSelectedValues;
        }
        if (result.shouldClose) {
            isOpen = false;
        }
    }

    function handleOutsideClick(e: MouseEvent) {
        if (isOpen && container && !container.contains(e.target as Node)) {
            isOpen = false;
        }
    }

    onMount(() => {
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    });
</script>

<div class="dropdown-container" bind:this={container}>
    {#if trigger}
        {@render trigger(toggle)}
    {:else}
        <button
            type="button"
            class="dropdown-trigger glass-panel"
            onclick={toggle}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
        >
            <span class="label">{selectedLabel}</span>
            <span class="chevron" class:open={isOpen}>▾</span>
        </button>
    {/if}

    <CustomDropdownMenu
        {isOpen}
        {multiple}
        {hasGroups}
        {groupedOptions}
        {options}
        {selectedValues}
        {value}
        {mode}
        {select}
    />
</div>

<style lang="scss">
    .dropdown-container {
        position: relative;
        display: inline-block;
    }

    .dropdown-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 1.25rem;
        background: rgba(var(--text-primary-rgb), 0.05);
        border: 1px solid var(--border-glass);
        color: var(--text-primary);
        font-family: inherit;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        min-width: 160px;

        :global(.light) & {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.1);
        }

        &:hover {
            background: rgba(var(--text-primary-rgb), 0.08);
            border-color: rgba(var(--text-primary-rgb), 0.2);

            :global(.light) & {
                background: #ffffff;
                border-color: rgba(0, 0, 0, 0.2);
            }
        }

        .chevron {
            font-size: 0.8rem;
            transition: transform 0.2s;

            &.open {
                transform: rotate(180deg);
            }
        }
    }
</style>
