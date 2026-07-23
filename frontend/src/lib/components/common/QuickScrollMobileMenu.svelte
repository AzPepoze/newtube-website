<script lang="ts">
    import type { QuickScrollItem } from "./QuickScrollNav.svelte";

    let {
        items,
        activeId,
        menuOpen,
        buttonId,
        menuId,
        handleClick,
        handleMenuKeydown,
        menuElement = $bindable(),
    }: {
        items: QuickScrollItem[];
        activeId: string;
        menuOpen: boolean;
        buttonId: string;
        menuId: string;
        handleClick: (event: MouseEvent, id: string) => void;
        handleMenuKeydown: (event: KeyboardEvent) => void;
        menuElement?: HTMLElement;
    } = $props();
</script>

<div
    bind:this={menuElement}
    id={menuId}
    class="mobile-menu"
    class:open={menuOpen}
    role="menu"
    tabindex="-1"
    aria-labelledby={buttonId}
    onkeydown={handleMenuKeydown}
>
    {#each items as item (item.id)}
        <a
            href="#{item.id}"
            class:active={activeId === item.id}
            role="menuitem"
            aria-current={activeId === item.id ? "location" : undefined}
            onclick={(event) => handleClick(event, item.id)}
        >
            {item.label}
        </a>
    {/each}
</div>

<style lang="scss">
    .mobile-menu {
        position: absolute;
        top: calc(100% + 0.5rem);
        right: 0;
        left: 0;
        display: flex;
        visibility: hidden;
        flex-direction: column;
        gap: 0.25rem;
        padding: 0.5rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-md);
        opacity: 0;
        background: var(--bg-dark);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
        transform: translateY(-0.35rem);
        transition:
            opacity 0.2s ease,
            transform 0.2s ease,
            visibility 0.2s;
        pointer-events: none;

        &.open {
            visibility: visible;
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }

        a {
            padding: 0.75rem;
            border-left: 2px solid transparent;
            border-radius: var(--radius-sm);
            color: var(--text-secondary);
            font-weight: 600;

            &:hover,
            &:focus-visible,
            &.active {
                color: var(--text-primary);
                background: rgba(var(--text-primary-rgb), 0.08);
            }

            &:focus-visible {
                outline: 2px solid var(--text-primary);
                outline-offset: -2px;
            }

            &.active {
                border-left-color: var(--text-primary);
            }
        }
    }
</style>
