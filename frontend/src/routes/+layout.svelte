<script lang="ts">
    import "../app.scss";
    import { onMount, tick } from "svelte";
    import { page } from "$app/state";
    import {
        getSessionId,
        handleAuthError,
        setSessionId,
    } from "$lib/utils/auth";
    import Modal from "$lib/components/common/Modal.svelte";
    import Navbar from "$lib/components/layout/Navbar.svelte";
    import { updateTheme } from "$lib/core/theme.svelte";
    import { initializeExtensionListener } from "$lib/core/extension.svelte";
    import "prism-code-editor/themes/dracula.css";
    import "prism-code-editor/themes/github-light.css";
    import { PUBLIC_API_URL } from "$lib/constants/index";

    let { children } = $props();

    interface User {
        id: string;
        name: string;
        avatarUrl: string;
        createdAt: string;
    }

    let currentUser = $state<User | null>(null);
    let isLightMode = $state(false);
    let isClient = $state(false);
    let isMobileMenuOpen = $state(false);
    let mobileMenuButton = $state<HTMLButtonElement>();
    let mobileMenu = $state<HTMLElement>();

    onMount(async () => {
        isClient = true;
        initializeExtensionListener();
        const savedTheme = localStorage.getItem("theme");
        isLightMode = savedTheme === "light";
        updateTheme(isLightMode);
        updateThemeClass();

        const urlParams = new URL(window.location.href).searchParams;
        const urlSessionId = urlParams.get("sessionId");
        const urlUserId = urlParams.get("userId");
        if (urlSessionId) {
            setSessionId(urlSessionId, urlUserId || undefined);
            urlParams.delete("sessionId");
            urlParams.delete("userId");
            const newUrl =
                window.location.pathname +
                (urlParams.toString() ? "?" + urlParams.toString() : "");
            window.history.replaceState({}, "", newUrl);
        }

        const sessionId = getSessionId();
        if (!sessionId) return;
        try {
            const response = await fetch(`${PUBLIC_API_URL}/users/me`, {
                credentials: "include",
            });
            if (response.ok) {
                currentUser = await response.json();
            } else if (response.status === 404 || response.status === 401) {
                handleAuthError();
            }
        } catch {
            // unauthenticated
        }
    });

    function toggleTheme() {
        isLightMode = !isLightMode;
        localStorage.setItem("theme", isLightMode ? "light" : "dark");
        updateTheme(isLightMode);
        updateThemeClass();
    }

    function updateThemeClass() {
        if (typeof document !== "undefined") {
            if (isLightMode) {
                document.documentElement.classList.add("light");
            } else {
                document.documentElement.classList.remove("light");
            }
        }
    }

    async function openMobileMenu() {
        isMobileMenuOpen = true;
        await tick();
        mobileMenu?.querySelector<HTMLAnchorElement>("a")?.focus();
    }

    function closeMobileMenu(restoreFocus = false) {
        if (!isMobileMenuOpen) return;
        isMobileMenuOpen = false;
        if (restoreFocus) {
            void tick().then(() => mobileMenuButton?.focus());
        }
    }

    function toggleMobileMenu() {
        if (isMobileMenuOpen) closeMobileMenu(true);
        else void openMobileMenu();
    }

    onMount(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (
                isMobileMenuOpen &&
                !mobileMenu?.contains(event.target as Node) &&
                !mobileMenuButton?.contains(event.target as Node)
            ) {
                closeMobileMenu();
            }
        };
        const handleResize = () => {
            if (!window.matchMedia("(max-width: 900px)").matches) {
                closeMobileMenu();
            }
        };
        const handleKeydown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isMobileMenuOpen) {
                event.preventDefault();
                closeMobileMenu(true);
            }
        };

        document.addEventListener("pointerdown", handlePointerDown);
        document.addEventListener("keydown", handleKeydown);
        window.addEventListener("resize", handleResize);
        return () => {
            document.removeEventListener("pointerdown", handlePointerDown);
            document.removeEventListener("keydown", handleKeydown);
            window.removeEventListener("resize", handleResize);
        };
    });
</script>

<svelte:head>
    <title>NewTube Discover</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;600;800&display=swap"
        rel="stylesheet"
    />
</svelte:head>

<div class="app-container">
    {#if !isClient}
        <div class="loading-screen">
            <div class="spinner"></div>
        </div>
    {:else}
        <Navbar
            bind:currentUser
            {isLightMode}
            {toggleTheme}
            {isMobileMenuOpen}
            {toggleMobileMenu}
            {closeMobileMenu}
            bind:mobileMenuButton
            bind:mobileMenu
        />
    {/if}

    <main>
        {#key page.url.pathname}
            {@render children()}
        {/key}
    </main>

    <Modal />
</div>

<style lang="scss">
    .app-container {
        min-height: 100vh;
        padding: 1.5rem 2rem;
        width: 100%;
    }

    main {
        animation: contentFade 0.6s ease-out;
        flex: 1;
        width: 100%;
        max-width: 1640px;
        margin: 0 auto;
    }

    @keyframes contentFade {
        from {
            opacity: 0;
            transform: translateY(10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    @media (max-width: 900px) {
        .app-container {
            padding: 1rem;
        }
    }

    @media (max-width: 480px) {
        .app-container {
            padding: 0.5rem;
        }
    }
</style>
