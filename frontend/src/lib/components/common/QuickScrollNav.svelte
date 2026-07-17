<script lang="ts">
    import { onMount } from "svelte";

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

    let activeId = $state(items[0]?.id ?? "");
    let navElement: HTMLElement;

    function appHeaderBottom() {
        const header = document.querySelector<HTMLElement>(
            ".app-container > nav",
        );
        return header ? header.getBoundingClientRect().bottom : 0;
    }

    function scrollOffset() {
        const mobileNavHeight = window.matchMedia("(max-width: 900px)").matches
            ? navElement?.offsetHeight || 0
            : 0;
        return appHeaderBottom() + mobileNavHeight + 16;
    }

    function scrollToSection(id: string, updateHistory = true) {
        const target = document.getElementById(id);
        if (!target) return;

        const top =
            target.getBoundingClientRect().top +
            window.scrollY -
            scrollOffset();
        const reduceMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
        ).matches;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
        activeId = id;

        if (updateHistory && window.location.hash !== `#${id}`) {
            history.pushState(null, "", `#${id}`);
        }
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
        scrollToSection(id);
    }

    onMount(() => {
        let observer: IntersectionObserver;

        const updateActiveSection = () => {
            const offset = scrollOffset() + 8;
            const sections = items
                .map((item) => document.getElementById(item.id))
                .filter((section): section is HTMLElement => !!section);
            if (!sections.length) return;

            const atPageBottom =
                window.scrollY + window.innerHeight >=
                document.documentElement.scrollHeight - 2;
            if (atPageBottom) {
                activeId = sections.at(-1)?.id ?? activeId;
                return;
            }

            const passed = sections.filter(
                (section) => section.getBoundingClientRect().top <= offset,
            );
            const visible = sections
                .map((section) => {
                    const rect = section.getBoundingClientRect();
                    const visibleHeight = Math.max(
                        0,
                        Math.min(rect.bottom, window.innerHeight) -
                            Math.max(rect.top, offset),
                    );
                    return { id: section.id, visibleHeight };
                })
                .sort((a, b) => b.visibleHeight - a.visibleHeight)[0];
            activeId =
                (visible?.visibleHeight ? visible.id : passed.at(-1)?.id) ||
                sections[0]?.id ||
                activeId;
        };

        const observeSections = () => {
            observer?.disconnect();
            observer = new IntersectionObserver(updateActiveSection, {
                rootMargin: `-${Math.ceil(scrollOffset())}px 0px -55% 0px`,
                threshold: [0, 0.01, 0.5, 1],
            });
            for (const item of items) {
                const section = document.getElementById(item.id);
                if (section) observer.observe(section);
            }
            updateActiveSection();
        };

        observeSections();
        window.addEventListener("resize", observeSections);
        window.addEventListener("scroll", updateActiveSection, {
            passive: true,
        });

        const hashId = decodeURIComponent(window.location.hash.slice(1));
        if (items.some((item) => item.id === hashId)) {
            requestAnimationFrame(() => scrollToSection(hashId, false));
        }

        const handleHashChange = () => {
            const nextId = decodeURIComponent(window.location.hash.slice(1));
            if (items.some((item) => item.id === nextId)) {
                requestAnimationFrame(() => scrollToSection(nextId, false));
            }
        };
        window.addEventListener("hashchange", handleHashChange);

        return () => {
            observer?.disconnect();
            window.removeEventListener("resize", observeSections);
            window.removeEventListener("scroll", updateActiveSection);
            window.removeEventListener("hashchange", handleHashChange);
        };
    });
</script>

<nav class="quick-scroll glass-panel" aria-label={label} bind:this={navElement}>
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
</nav>

<style lang="scss">
    .quick-scroll {
        position: sticky;
        top: 7.5rem;
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
            top: 6.75rem;
            z-index: 900;
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.55rem 0.75rem;
            overflow: hidden;
            background: var(--bg-dark);

            h2 {
                flex: 0 0 auto;
                margin: 0;
                padding-left: 0.35rem;
            }
        }

        .links {
            min-width: 0;
            flex: 1;
            flex-direction: row;
            overflow-x: auto;
            scrollbar-width: thin;

            a {
                flex: 0 0 auto;
                border-left: 0;
                border-bottom: 2px solid transparent;
                border-radius: var(--radius-sm) var(--radius-sm) 0 0;

                &.active {
                    border-left-color: transparent;
                    border-bottom-color: var(--text-primary);
                }
            }
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .links a {
            transition: none;
        }
    }
</style>
