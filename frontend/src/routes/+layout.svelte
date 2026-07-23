<script lang="ts">
    import "../app.scss";
    import { onMount, tick } from "svelte";
    import { fade, fly, slide } from "svelte/transition";
    import { page } from "$app/state";
    import {
        getSessionId,
        clearSessionId,
        handleAuthError,
        setSessionId,
    } from "$lib/utils/auth";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import GithubIcon from "$lib/icons/GithubIcon.svelte";
    import CustomDropdown from "$lib/components/common/CustomDropdown.svelte";
    import Modal from "$lib/components/common/Modal.svelte";
    import { updateTheme } from "$lib/core/theme.svelte";
    import { initializeExtensionListener } from "$lib/core/extension.svelte";
    import "prism-code-editor/themes/dracula.css";
    import "prism-code-editor/themes/github-light.css";

    let { children } = $props();

    interface User {
        id: string;
        name: string;
        avatarUrl: string;
        createdAt: string;
    }

    import { PUBLIC_API_URL } from "$lib/constants/index";

    let currentUser = $state<User | null>(null);
    let isLightMode = $state(false);
    let isClient = $state(false);
    let isMobileMenuOpen = $state(false);
    let mobileMenuButton = $state<HTMLButtonElement>();
    let mobileMenu = $state<HTMLElement>();

    onMount(async () => {
        isClient = true;
        initializeExtensionListener();
        // Initialize theme
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

    function handleLogout() {
        clearSessionId();
        currentUser = null;
        window.location.href = "/";
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
        <nav
            class="glass-panel"
            in:fly={{ y: -100, delay: 200, duration: 1000 }}
        >
            <div class="nav-left">
                <button
                    type="button"
                    class="mobile-menu-toggle"
                    bind:this={mobileMenuButton}
                    onclick={toggleMobileMenu}
                    aria-label={isMobileMenuOpen
                        ? "Close navigation menu"
                        : "Open navigation menu"}
                    aria-controls="mobile-primary-navigation"
                    aria-expanded={isMobileMenuOpen}
                >
                    <MaterialIcon
                        name={isMobileMenuOpen ? "close" : "menu"}
                        size={26}
                    />
                </button>
                <a href="/" class="logo-link" in:fade={{ duration: 200 }}>
                    <img src="/logo.png" alt="NewTube" class="logo-img" />
                </a>
                <div class="nav-links">
                    <a href="/" aria-label="Home" title="Home">
                        <MaterialIcon name="home" size={24} />
                    </a>
                    <a href="/discover" aria-label="Discover" title="Discover">
                        <MaterialIcon name="explore" size={24} />
                    </a>
                    <a href="/terms" aria-label="Terms" title="Terms">
                        <MaterialIcon name="balance" size={24} />
                    </a>
                    <a href="/privacy" aria-label="Privacy" title="Privacy">
                        <MaterialIcon name="shield" size={24} />
                    </a>
                </div>
            </div>

            <div class="nav-right">
                <a
                    href="https://github.com/AzPepoze/NewTube"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="github-link"
                    aria-label="GitHub Repository"
                >
                    <GithubIcon size={24} />
                </a>

                <button
                    class="theme-toggle"
                    onclick={toggleTheme}
                    aria-label="Toggle theme"
                >
                    {#if isLightMode}
                        <MaterialIcon name="dark_mode" size={22} />
                    {:else}
                        <MaterialIcon name="light_mode" size={22} />
                    {/if}
                </button>

                <div class="auth-section">
                    {#if currentUser}
                        <div class="profile-menu">
                            {#snippet trigger(toggle: () => void)}
                                <button
                                    class="user-profile glass-panel"
                                    aria-label="User menu"
                                    onclick={toggle}
                                >
                                    {#if currentUser?.avatarUrl}
                                        <img
                                            src={currentUser.avatarUrl}
                                            alt={currentUser.name}
                                            class="avatar"
                                        />
                                    {:else}
                                        <div class="avatar avatar-fallback">
                                            {currentUser?.name.charAt(0)}
                                        </div>
                                    {/if}
                                    <span class="chevron">▾</span>
                                </button>
                            {/snippet}

                            <CustomDropdown
                                {trigger}
                                mode="menu"
                                options={[
                                    {
                                        label: "Your Profile",
                                        icon: "person",
                                        href: "/profile",
                                    },
                                    {
                                        label: "Logout",
                                        icon: "logout",
                                        class: "logout-item",
                                        color: "#ff4d4d",
                                        onClick: handleLogout,
                                    },
                                ]}
                            />
                        </div>
                    {:else}
                        <a
                            href="/login"
                            class="login-btn premium-button glass-panel"
                            >Login</a
                        >
                    {/if}
                </div>
            </div>

            {#if isMobileMenuOpen}
                <div
                    id="mobile-primary-navigation"
                    class="mobile-menu glass-panel"
                    bind:this={mobileMenu}
                    transition:slide={{ duration: 180 }}
                    role="navigation"
                    aria-label="Primary navigation"
                >
                    <a href="/" onclick={() => closeMobileMenu()}>
                        <MaterialIcon name="home" size={22} />
                        <span>Home</span>
                    </a>
                    <a href="/discover" onclick={() => closeMobileMenu()}>
                        <MaterialIcon name="explore" size={22} />
                        <span>Discover</span>
                    </a>
                    <a href="/terms" onclick={() => closeMobileMenu()}>
                        <MaterialIcon name="balance" size={22} />
                        <span>Terms</span>
                    </a>
                    <a href="/privacy" onclick={() => closeMobileMenu()}>
                        <MaterialIcon name="shield" size={22} />
                        <span>Privacy</span>
                    </a>
                </div>
            {/if}

            <div class="mobile-page-navigation"></div>
        </nav>
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

    nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.4rem 1.5rem;
        width: 100%;
        max-width: 1640px;
        margin: 0 auto 3rem;
        border-radius: var(--radius-md);
        z-index: 1000;
        position: sticky;
        top: 1.5rem;
        background: var(--bg-dark);
        border: 1px solid var(--border-glass);

        :global(.light) & {
            background: #ffffff;
            border-color: rgba(0, 0, 0, 0.1);
        }

        .nav-left,
        .nav-right {
            display: flex;
            align-items: center;
            gap: 2.5rem;
        }

        .mobile-menu-toggle,
        .mobile-menu {
            display: none;
        }

        .mobile-page-navigation {
            display: none;
        }

        .logo-img {
            height: 60px;
            width: auto;
            display: block;
            transition: filter 0.3s ease;

            :global(.light) & {
                filter: none;
            }
        }

        .logo-link:hover .logo-img {
            animation: logo-rotate 3s linear infinite;
        }

        @keyframes logo-rotate {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .nav-links {
            display: flex;
            gap: 1.5rem;

            a {
                font-size: 1.1rem;
                font-weight: 600;
                color: var(--text-secondary);
                transition: all 0.2s;

                &:hover {
                    color: var(--primary-glow);
                    transform: translateY(-2px);
                }
            }
        }

        .nav-right {
            gap: 1.25rem;

            .github-link {
                color: var(--text-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.2s;
                opacity: 0.8;

                &:hover {
                    opacity: 1;
                    background: rgba(var(--text-primary-rgb), 0.05);
                    transform: scale(1.1);
                }
            }

            .theme-toggle {
                background: transparent;
                border: none;
                color: var(--text-primary);
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.2s;

                &:hover {
                    background: rgba(
                        var(--text-primary-rgb, 128, 128, 128),
                        0.05
                    );
                    color: var(--text-primary);
                }
            }

            .auth-section {
                .login-btn {
                    padding: 10px 22px;
                    font-size: 1rem;
                }
            }
        }
    }

    .profile-menu {
        position: relative;

        .user-profile {
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            gap: 1rem;
            cursor: pointer;
            padding: 6px;
            border-radius: var(--radius-lg);
            transition: background 0.2s;

            &:hover {
                background: rgba(var(--text-primary-rgb), 0.05);

                :global(.light) & {
                    background: rgba(0, 0, 0, 0.03);
                }
            }

            .avatar {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                object-fit: cover;
                border: 1px solid var(--border-glass);
            }

            .avatar-fallback {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: var(--text-primary);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--bg-dark);
                font-weight: 700;
                font-size: 1.1rem;
            }

            .chevron {
                font-size: 0.7rem;
                color: var(--text-primary);
                transition: transform 0.2s;
            }
        }
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

        nav {
            top: 1rem;
            padding: 0.35rem 0.75rem;
            flex-wrap: wrap;

            .nav-left,
            .nav-right {
                gap: 0.75rem;
            }

            .logo-img {
                height: 48px;
            }

            .nav-links {
                display: none;
            }

            .nav-right {
                gap: 0.5rem;

                .github-link,
                .theme-toggle {
                    padding: 0.4rem;
                }

                .auth-section .login-btn {
                    padding: 8px 14px;
                    font-size: 0.9rem;
                }
            }

            .nav-left .mobile-menu-toggle {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0.4rem;
                border: 0;
                border-radius: var(--radius-sm);
                background: transparent;
                color: var(--text-primary);
                cursor: pointer;

                &:hover,
                &:focus-visible {
                    background: rgba(var(--text-primary-rgb), 0.08);
                }
            }

            .mobile-menu {
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 0.5rem;
                flex: 0 0 100%;
                order: 3;
                margin-top: 0.5rem;
                padding: 0.5rem;
                background: var(--bg-dark);
                border-radius: var(--radius-sm);

                a {
                    display: flex;
                    align-items: center;
                    gap: 0.65rem;
                    min-height: 44px;
                    padding: 0.65rem 0.75rem;
                    border-radius: var(--radius-sm);
                    color: var(--text-primary);
                    font-weight: 600;

                    &:hover,
                    &:focus-visible {
                        background: rgba(var(--text-primary-rgb), 0.08);
                        opacity: 1;
                    }
                }
            }

            .mobile-page-navigation:not(:empty) {
                display: block;
                flex: 0 0 100%;
                min-width: 0;
            }
        }

        .profile-menu .user-profile {
            gap: 0.5rem;
            padding: 4px;

            .avatar,
            .avatar-fallback {
                width: 36px;
                height: 36px;
            }
        }
    }

    @media (max-width: 480px) {
        .app-container {
            padding: 0.5rem;
        }

        nav {
            top: 0.5rem;
            padding: 0.3rem 0.4rem;

            .logo-img {
                height: 44px;
            }

            .nav-right {
                gap: 0.25rem;

                .github-link,
                .theme-toggle {
                    padding: 0.3rem;
                }

                .auth-section .login-btn {
                    padding: 7px 10px;
                }
            }

            .nav-left .mobile-menu-toggle {
                padding: 0.3rem;
            }
        }

        .profile-menu .user-profile {
            gap: 0.25rem;
            padding: 3px;

            .avatar,
            .avatar-fallback {
                width: 34px;
                height: 34px;
            }

            .chevron {
                font-size: 0.6rem;
            }
        }
    }
</style>
