<script lang="ts">
    import { onMount, tick } from "svelte";
    import {
        calculateScrollOffset,
        getActiveSectionId,
        handleNavKeydown,
        scrollToSection,
    } from "./quickScrollUtils";
    import QuickScrollMobileMenu from "./QuickScrollMobileMenu.svelte";

    export interface QuickScrollItem {
        id: string;
        label: string;
    }

    let {
        items,
        label,
        heading = "Overview",
    }: {
        items: QuickScrollItem[];
        label: string;
        heading?: string;
    } = $props();

    let activeId = $state("");
    let menuOpen = $state(false);
    let navElement: HTMLElement;
    let menuElement = $state<HTMLElement>();
    let buttonElement: HTMLButtonElement;
    const componentId = $props.id();
    const buttonId = `${componentId}-button`;
    const menuId = `${componentId}-menu`;

    let activeLabel = $derived(
        items.find((item) => item.id === activeId)?.label ??
            items[0]?.label ??
            heading,
    );

    $effect(() => {
        if (!items.some((item) => item.id === activeId)) {
            activeId = items[0]?.id ?? "";
        }
    });

    async function openMenu() {
        menuOpen = true;
        await tick();
        const activeLink = menuElement?.querySelector<HTMLAnchorElement>(
            `a[href="#${CSS.escape(activeId)}"]`,
        );
        (
            activeLink ?? menuElement?.querySelector<HTMLAnchorElement>("a")
        )?.focus();
    }

    function closeMenu(restoreFocus = false) {
        if (!menuOpen) return;
        menuOpen = false;
        if (restoreFocus) void tick().then(() => buttonElement?.focus());
    }

    function toggleMenu() {
        if (menuOpen) closeMenu(true);
        else void openMenu();
    }

    function triggerScrollToSection(id: string, updateHistory = true) {
        const newActive = scrollToSection(id, navElement, updateHistory);
        if (newActive) activeId = newActive;
    }

    function handleClick(event: MouseEvent, id: string) {
        if (
            event.defaultPrevented ||
            event.button !== 0 ||
            event.metaKey ||
            event.ctrlKey ||
            event.shiftKey ||
            event.altKey
        ) {
            return;
        }
        event.preventDefault();
        closeMenu(true);
        triggerScrollToSection(id);
    }

    function handleMenuKeydown(event: KeyboardEvent) {
        handleNavKeydown(event, menuElement);
    }

    onMount(() => {
        let observer: IntersectionObserver;
        const originalParent = navElement.parentNode;
        const placeholder = document.createComment("quick-scroll-nav");
        originalParent?.insertBefore(placeholder, navElement);

        const placeNavigation = () => {
            const mobileTarget = document.querySelector<HTMLElement>(
                ".app-container > nav .mobile-page-navigation",
            );
            if (
                window.matchMedia("(max-width: 900px)").matches &&
                mobileTarget
            ) {
                mobileTarget.appendChild(navElement);
            } else if (placeholder.parentNode) {
                placeholder.parentNode.insertBefore(navElement, placeholder);
            }
        };

        placeNavigation();

        const updateActiveSection = () => {
            activeId = getActiveSectionId(items, navElement, activeId);
        };

        const observeSections = () => {
            observer?.disconnect();
            observer = new IntersectionObserver(updateActiveSection, {
                rootMargin: `-${Math.ceil(calculateScrollOffset(navElement))}px 0px -55% 0px`,
                threshold: [0, 0.01, 0.5, 1],
            });
            for (const item of items) {
                const section = document.getElementById(item.id);
                if (section) observer.observe(section);
            }
            updateActiveSection();
        };

        observeSections();
        const handleResize = () => {
            placeNavigation();
            if (!window.matchMedia("(max-width: 900px)").matches) {
                closeMenu();
            }
            observeSections();
        };
        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", updateActiveSection, {
            passive: true,
        });

        const hashId = decodeURIComponent(window.location.hash.slice(1));
        if (items.some((item) => item.id === hashId)) {
            requestAnimationFrame(() => triggerScrollToSection(hashId, false));
        }

        const handleHashChange = () => {
            const nextId = decodeURIComponent(window.location.hash.slice(1));
            if (items.some((item) => item.id === nextId)) {
                requestAnimationFrame(() =>
                    triggerScrollToSection(nextId, false),
                );
            }
        };
        window.addEventListener("hashchange", handleHashChange);

        const handlePointerDown = (event: PointerEvent) => {
            if (menuOpen && !navElement.contains(event.target as Node)) {
                closeMenu(true);
            }
        };
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && menuOpen) {
                event.preventDefault();
                closeMenu(true);
            }
        };
        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeydown);

        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", updateActiveSection);
            window.removeEventListener("hashchange", handleHashChange);
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeydown);
            if (placeholder.parentNode) {
                placeholder.parentNode.insertBefore(navElement, placeholder);
                placeholder.remove();
            }
        };
    });
</script>

<nav class="quick-scroll glass-panel" aria-label={label} bind:this={navElement}>
    <div class="desktop-navigation">
        <h2>{heading}</h2>
        <div class="links">
            {#each items as item (item.id)}
                <a
                    href="#{item.id}"
                    class:active={activeId === item.id}
                    aria-current={activeId === item.id ? "location" : undefined}
                    onclick={(event) => handleClick(event, item.id)}
                >
                    {item.label}
                </a>
            {/each}
        </div>
    </div>

    <button
        bind:this={buttonElement}
        id={buttonId}
        class="menu-button"
        type="button"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        onclick={toggleMenu}
    >
        <span class="hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="current-section">{activeLabel}</span>
        <span class="chevron" class:open={menuOpen} aria-hidden="true">⌄</span>
    </button>

    <QuickScrollMobileMenu
        {items}
        {activeId}
        {menuOpen}
        {buttonId}
        {menuId}
        {handleClick}
        {handleMenuKeydown}
        bind:menuElement
    />
</nav>

<style lang="scss">
    .quick-scroll {
        position: sticky;
        top: 7.5rem;
        min-height: calc(100vh - 9rem);
        padding: 1.25rem;
        border-radius: var(--radius-md);

        h2 {
            margin: 0 0 0.85rem;
            font-size: 0.78rem;
            color: var(--text-muted);
            letter-spacing: 0.1em;
            text-transform: uppercase;
        }
    }

    .menu-button {
        display: none;
    }

    .links {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        a {
            padding: 0.65rem 0.75rem;
            border-left: 2px solid transparent;
            border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 600;
            transition:
                color 0.2s,
                background 0.2s,
                border-color 0.2s;

            &:hover,
            &:focus-visible {
                color: var(--text-primary);
                background: rgba(var(--text-primary-rgb), 0.05);
                opacity: 1;
            }

            &:focus-visible {
                outline: 2px solid var(--text-primary);
                outline-offset: 2px;
            }

            &.active {
                color: var(--text-primary);
                border-left-color: var(--text-primary);
                background: rgba(var(--text-primary-rgb), 0.08);
            }
        }
    }

    @media (max-width: 900px) {
        .quick-scroll {
            position: relative;
            top: auto;
            z-index: 900;
            min-height: 0;
            padding: 0;
            background: var(--bg-dark);
        }

        .desktop-navigation {
            display: none;
        }

        .menu-button {
            display: flex;
            width: 100%;
            min-height: 3rem;
            align-items: center;
            gap: 0.75rem;
            padding: 0.65rem 0.9rem;
            border: 0;
            border-radius: inherit;
            color: var(--text-primary);
            background: transparent;
            font: inherit;
            font-weight: 700;
            text-align: left;
            cursor: pointer;

            &:focus-visible {
                outline: 2px solid var(--text-primary);
                outline-offset: 2px;
            }
        }

        .hamburger {
            display: grid;
            width: 1.15rem;
            gap: 0.2rem;

            i {
                display: block;
                height: 2px;
                border-radius: 1px;
                background: currentColor;
            }
        }

        .current-section {
            min-width: 0;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .chevron {
            font-size: 1.25rem;
            transition: transform 0.2s ease;

            &.open {
                transform: rotate(180deg);
            }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .links a {
            transition: none;
        }

        .chevron {
            transition: none;
        }
    }
</style>
