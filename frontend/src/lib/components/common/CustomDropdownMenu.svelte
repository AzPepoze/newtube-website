<script lang="ts">
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import { fly, slide } from "svelte/transition";
    import type { DropdownOption } from "./dropdownUtils";

    let {
        isOpen,
        multiple,
        hasGroups,
        groupedOptions,
        options,
        selectedValues,
        value,
        mode,
        select,
    }: {
        isOpen: boolean;
        multiple: boolean;
        hasGroups: boolean;
        groupedOptions: Record<string, DropdownOption[]>;
        options: DropdownOption[];
        selectedValues: string[];
        value?: string;
        mode: "select" | "menu";
        select: (option: DropdownOption) => void;
    } = $props();
</script>

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
                                    ? selectedValues.includes(
                                          option.value ?? "",
                                      )
                                    : mode === "select" &&
                                      value !== undefined &&
                                      value === option.value}
                                style={option.color
                                    ? `color: ${option.color}`
                                    : ""}
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
                                            {@const IconComp = option.icon}
                                            <IconComp size={18} />
                                        {/if}
                                    </span>
                                {/if}
                                <span class="text">{option.label}</span>
                                {#if multiple && selectedValues.includes(option.value ?? "")}
                                    <MaterialIcon
                                        name="check"
                                        size={16}
                                        class="check-icon"
                                    />
                                {/if}
                            </a>
                        {:else}
                            <button
                                type="button"
                                class="dropdown-item {option.class || ''}"
                                class:active={multiple
                                    ? selectedValues.includes(
                                          option.value ?? "",
                                      )
                                    : mode === "select" &&
                                      value !== undefined &&
                                      value === option.value}
                                style={option.color
                                    ? `color: ${option.color}`
                                    : ""}
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
                                            {@const IconComp = option.icon}
                                            <IconComp size={18} />
                                        {/if}
                                    </span>
                                {/if}
                                <span class="text">{option.label}</span>
                                {#if multiple && selectedValues.includes(option.value ?? "")}
                                    <MaterialIcon
                                        name="check"
                                        size={16}
                                        class="check-icon"
                                    />
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
                                        {@const IconComp = option.icon}
                                        <IconComp size={18} />
                                    {/if}
                                </span>
                            {/if}
                            <span class="text">{option.label}</span>
                            {#if multiple && selectedValues.includes(option.value ?? "")}
                                <MaterialIcon
                                    name="check"
                                    size={16}
                                    class="check-icon"
                                />
                            {/if}
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
                        >
                            {#if option.icon}
                                <span class="icon">
                                    {#if typeof option.icon === "string"}
                                        <MaterialIcon
                                            name={option.icon}
                                            size={18}
                                        />
                                    {:else}
                                        {@const IconComp = option.icon}
                                        <IconComp size={18} />
                                    {/if}
                                </span>
                            {/if}
                            <span class="text">{option.label}</span>
                            {#if multiple && selectedValues.includes(option.value ?? "")}
                                <MaterialIcon
                                    name="check"
                                    size={16}
                                    class="check-icon"
                                />
                            {/if}
                        </button>
                    {/if}
                </div>
            {/each}
        {/if}
    </div>
{/if}

<style lang="scss">
    .dropdown-menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        min-width: 100%;
        width: max-content;
        max-width: 280px;
        background: var(--bg-dark);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-md);
        padding: 0.5rem;
        z-index: 1000;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        max-height: 300px;
        overflow-y: auto;

        :global(.light) & {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        }

        .dropdown-group-header {
            padding: 0.5rem 0.75rem 0.25rem;
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-muted);

            &:not(:first-child) {
                margin-top: 0.5rem;
                border-top: 1px solid var(--border-glass);
            }
        }

        .option-row {
            margin-bottom: 2px;
            &:last-child {
                margin-bottom: 0;
            }
        }

        .dropdown-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.6rem 0.8rem;
            border: none;
            background: transparent;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.9rem;
            font-weight: 500;
            text-align: left;
            text-decoration: none;
            border-radius: var(--radius-sm);
            cursor: pointer;
            transition: all 0.15s;
            box-sizing: border-box;

            .text {
                flex: 1;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .icon {
                display: flex;
                align-items: center;
                opacity: 0.8;
            }

            &:hover {
                background: rgba(var(--text-primary-rgb), 0.08);
                transform: translateX(3px);

                :global(.light) & {
                    background: rgba(0, 0, 0, 0.05);
                }

                .icon {
                    opacity: 1;
                }
            }

            &.active {
                background: rgba(var(--text-primary-rgb), 0.12);
                color: var(--primary-glow);
                font-weight: 600;

                :global(.light) & {
                    background: rgba(0, 0, 0, 0.08);
                }
            }
        }
    }
</style>
