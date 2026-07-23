import type { QuickScrollItem } from "./QuickScrollNav.svelte";

export function appHeaderBottom(): number {
    const header = document.querySelector<HTMLElement>(".app-container > nav");
    return header ? header.getBoundingClientRect().bottom : 0;
}

export function calculateScrollOffset(navElement?: HTMLElement): number {
    const isInsideAppHeader = !!navElement?.closest(".app-container > nav");
    const mobileNavHeight =
        window.matchMedia("(max-width: 900px)").matches && !isInsideAppHeader
            ? navElement?.offsetHeight || 0
            : 0;
    return appHeaderBottom() + mobileNavHeight + 16;
}

export function scrollToSection(
    id: string,
    navElement?: HTMLElement,
    updateHistory = true,
): string | undefined {
    const target = document.getElementById(id);
    if (!target) return;

    const top =
        target.getBoundingClientRect().top +
        window.scrollY -
        calculateScrollOffset(navElement);
    const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
    ).matches;
    window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });

    if (updateHistory && window.location.hash !== `#${id}`) {
        history.pushState(null, "", `#${id}`);
    }
    return id;
}

export function handleNavKeydown(
    event: KeyboardEvent,
    menuElement?: HTMLElement,
) {
    const links = Array.from(
        menuElement?.querySelectorAll<HTMLAnchorElement>("a") ?? [],
    );
    if (!links.length) return;

    const currentIndex = links.indexOf(
        document.activeElement as HTMLAnchorElement,
    );
    let nextIndex: number | undefined;
    if (event.key === "ArrowDown")
        nextIndex = (currentIndex + 1) % links.length;
    if (event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + links.length) % links.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = links.length - 1;
    if (nextIndex === undefined) return;

    event.preventDefault();
    links[nextIndex]?.focus();
}

export function getActiveSectionId(
    items: QuickScrollItem[],
    navElement?: HTMLElement,
    currentActiveId = "",
): string {
    const offset = calculateScrollOffset(navElement) + 8;
    const sections = items
        .map((item) => document.getElementById(item.id))
        .filter((section): section is HTMLElement => !!section);
    if (!sections.length) return currentActiveId;

    const atPageBottom =
        window.scrollY + window.innerHeight >=
        document.documentElement.scrollHeight - 2;
    if (atPageBottom) {
        return sections.at(-1)?.id ?? currentActiveId;
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

    return (
        (visible?.visibleHeight ? visible.id : passed.at(-1)?.id) ||
        sections[0]?.id ||
        currentActiveId
    );
}
