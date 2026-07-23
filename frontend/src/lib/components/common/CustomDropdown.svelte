<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import { onMount, type Snippet } from "svelte";
    import { fade, fly, slide } from "svelte/transition";

    interface Option {
        value?: string;
        label: string;
        group?: string;
        icon?: any;
        href?: string;
        onClick?: () => void;
        class?: string;
        color?: string; // New: Custom text color (e.g. "red" or "var(--error)")
    }

    let {
        options,
        value = $bindable(),
        placeholder = "Select an option",
        mode = "select", // "select" or "menu"
        trigger = null, // Custom trigger snippet
        onChange = undefined,
        multiple = false,
        selectedValues = $bindable<string[]>([]),
        onValuesChange = undefined,
    } = $props<{
        options: Option[];
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
        multiple
            ? selectedValues.length === 0
                ? placeholder
                : `${selectedValues.length} selected`
            : options.find((opt: Option) => opt.value === value)?.label ||
                  placeholder,
    );

    const groupedOptions = $derived.by(() => {
        const groups: Record<string, Option[]> = {};
        for (const opt of options) {
            const grp = opt.group || "";
            if (!groups[grp]) {
                groups[grp] = [];
            }
            groups[grp].push(opt);
        }
        return groups;
    });

    const hasGroups = $derived(options.some((opt: Option) => Boolean(opt.group)));

    function toggle() {
        isOpen = !isOpen;
    }

    function select(option: Option) {
        if (option.onClick) {
            option.onClick();
        } else if (option.value !== undefined) {
            if (multiple) {
                selectedValues = selectedValues.includes(option.value)
                    ? selectedValues.filter(
                          (item: string) => item !== option.value,
                      )
                    : [...selectedValues, option.value];
                onValuesChange?.(selectedValues);
                return;
            }
            value = option.value;
            onChange?.(option.value);
        }
        isOpen = false;
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

    {#if isOpen}
        <div
            class="dropdown-menu glass-panel"
            transition:slide={{ duration: 250 }}
            role="listbox"
            aria-multiselectable={multiple || undefined}
        >
            {#if hasGroups}
                {#each Object.entries(groupedOptions) as [groupName, groupOpts]}
                    {#if groupName}
                        <div class="dropdown-group-header">{groupName}</div>
                    {/if}
                    {#each groupOpts as option, i}
                        <div
                            in:fly={{
                                x: -15,
                                duration: 300,
                                delay: i * 30,
                                opacity: 0,
                            }}
                            class="option-row"
                        >
                            {#if option.href}
                                <a
                                    href={option.href}
                                    class="dropdown-item {option.class || ''}"
                                    class:active={multiple
                                        ? selectedValues.includes(option.value ?? "")
                                        : mode === "select" &&
                                          value !== undefined &&
                                          value === option.value}
                                    style={option.color ? `color: ${option.color}` : ""}
                                    onclick={() => select(option)}
                                >
                                    {#if option.icon}
                                        <span class="icon">
                                            {#if typeof option.icon === "string"}
                                                <MaterialIcon
                                                    name={option.icon}
                                                    size={18}
                                                />
                                            {:else}
                                                <option.icon size={18} />
                                            {/if}
                                        </span>
                                    {/if}
                                    <span class="text">{option.label}</span>
                                </a>
                            {:else}
                                <button
                                    type="button"
                                    class="dropdown-item {option.class || ''}"
                                    class:active={multiple
                                        ? selectedValues.includes(option.value ?? "")
                                        : mode === "select" &&
                                          value !== undefined &&
                                          value === option.value}
                                    style={option.color ? `color: ${option.color}` : ""}
                                    onclick={() => select(option)}
                                    role="option"
                                    aria-selected={multiple
                                        ? selectedValues.includes(option.value ?? "")
                                        : mode === "select" &&
                                          value !== undefined &&
                                          value === option.value}
                                >
                                    <div
                                        class="item-content"
                                        style={option.color
                                            ? `color: ${option.color}`
                                            : ""}
                                    >
                                        {#if option.icon}
                                            <span class="icon">
                                                {#if typeof option.icon === "string"}
                                                    <MaterialIcon
                                                        name={option.icon}
                                                        size={18}
                                                    />
                                                {:else}
                                                    <option.icon size={18} />
                                                {/if}
                                            </span>
                                        {/if}
                                        <span class="text">{option.label}</span>
                                    </div>
                                    {#if multiple}
                                        <span
                                            class="checkbox"
                                            class:checked={selectedValues.includes(
                                                option.value ?? "",
                                            )}
                                            aria-hidden="true"
                                        >
                                            {#if selectedValues.includes(option.value ?? "")}
                                                <MaterialIcon name="check" size={14} />
                                            {/if}
                                        </span>
                                    {:else if mode === "select" && value === option.value}
                                        <span class="check" in:fade>✓</span>
                                    {/if}
                                </button>
                            {/if}
                        </div>
                    {/each}
                {/each}
            {:else}
                {#each options as option, i}
                    <div
                        in:fly={{
                            x: -15,
                            duration: 300,
                            delay: i * 50,
                            opacity: 0,
                        }}
                        class="option-row"
                    >
                        {#if option.href}
                            <a
                                href={option.href}
                                class="dropdown-item {option.class || ''}"
                                class:active={multiple
                                    ? selectedValues.includes(option.value ?? "")
                                    : mode === "select" &&
                                      value !== undefined &&
                                      value === option.value}
                                style={option.color ? `color: ${option.color}` : ""}
                                onclick={() => select(option)}
                            >
                                {#if option.icon}
                                    <span class="icon">
                                        {#if typeof option.icon === "string"}
                                            <MaterialIcon
                                                name={option.icon}
                                                size={18}
                                            />
                                        {:else}
                                            <option.icon size={18} />
                                        {/if}
                                    </span>
                                {/if}
                                <span class="text">{option.label}</span>
                            </a>
                        {:else}
                            <button
                                type="button"
                                class="dropdown-item {option.class || ''}"
                                class:active={multiple
                                    ? selectedValues.includes(option.value ?? "")
                                    : mode === "select" &&
                                      value !== undefined &&
                                      value === option.value}
                                style={option.color ? `color: ${option.color}` : ""}
                                onclick={() => select(option)}
                                role="option"
                                aria-selected={multiple
                                    ? selectedValues.includes(option.value ?? "")
                                    : mode === "select" &&
                                      value !== undefined &&
                                      value === option.value}
                            >
                                <div
                                    class="item-content"
                                    style={option.color
                                        ? `color: ${option.color}`
                                        : ""}
                                >
                                    {#if option.icon}
                                        <span class="icon">
                                            {#if typeof option.icon === "string"}
                                                <MaterialIcon
                                                    name={option.icon}
                                                    size={18}
                                                />
                                            {:else}
                                                <option.icon size={18} />
                                            {/if}
                                        </span>
                                    {/if}
                                    <span class="text">{option.label}</span>
                                </div>
                                {#if multiple}
                                    <span
                                        class="checkbox"
                                        class:checked={selectedValues.includes(
                                            option.value ?? "",
                                        )}
                                        aria-hidden="true"
                                    >
                                        {#if selectedValues.includes(option.value ?? "")}
                                            <MaterialIcon name="check" size={14} />
                                        {/if}
                                    </span>
                                {:else if mode === "select" && value === option.value}
                                    <span class="check" in:fade>✓</span>
                                {/if}
                            </button>
                        {/if}
                    </div>
                {/each}
            {/if}
        </div>
    {/if}
</div>

<style lang="scss">
    .dropdown-container {
        position: relative;
    }

    .dropdown-trigger {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding: 0.6rem 1.2rem;
        background: rgba(var(--text-primary-rgb), 0.05);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.95rem;
        transition: all 0.2s;

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
            font-size: 0.7rem;
            transition: transform 0.2s;
            &.open {
                transform: rotate(180deg);
            }
        }
    }

    .dropdown-menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        min-width: 220px;
        width: max-content;
        max-width: min(320px, calc(100vw - 2rem));
        max-height: min(360px, calc(100vh - 8rem));
        z-index: 1000;
        padding: 0.5rem;
        overflow: auto;
        border: 1px solid var(--border-glass);
        box-shadow: var(--shadow-glow);

        :global(.light) & {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.1);
            backdrop-filter: none;
        }
    }

    .dropdown-group-header {
        padding: 0.6rem 1rem 0.3rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.05em;

        &:not(:first-child) {
            margin-top: 0.5rem;
            border-top: 1px solid var(--border-glass);
            padding-top: 0.75rem;
        }
    }

    .dropdown-item {
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border: none;
        background: transparent;
        color: var(--text-secondary);
        font-size: 1rem;
        font-weight: 600;
        text-align: left;
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all 0.2s;
        text-decoration: none;

        &:hover {
            background: rgba(var(--text-primary-rgb), 0.05);
            color: var(--text-primary);

            :global(.light) & {
                background: rgba(0, 0, 0, 0.03);
            }
        }

        &.active {
            background: rgba(var(--text-primary-rgb), 0.1);
            color: var(--text-primary);

            :global(.light) & {
                background: rgba(0, 0, 0, 0.05);
            }
        }

        .item-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            justify-content: space-between;
            width: 100%;
        }

        .icon {
            display: flex;
            align-items: center;
            opacity: 0.8;
        }

        .check {
            font-size: 0.8rem;
        }

        .checkbox {
            width: 1.15rem;
            height: 1.15rem;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            border: 1px solid var(--border-glass);
            border-radius: 4px;
            color: var(--bg-dark);

            &.checked {
                background: var(--text-primary);
                border-color: var(--text-primary);
            }
        }
    }
</style>
