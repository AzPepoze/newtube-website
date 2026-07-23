<script lang="ts">
    import { fade, fly } from "svelte/transition";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import GithubIcon from "$lib/icons/GithubIcon.svelte";
    import AuthSection, { type User } from "./AuthSection.svelte";
    import MobileMenu from "./MobileMenu.svelte";

    let {
        currentUser = $bindable(),
        isLightMode,
        toggleTheme,
        isMobileMenuOpen,
        toggleMobileMenu,
        closeMobileMenu,
        mobileMenuButton = $bindable(),
        mobileMenu = $bindable(),
    }: {
        currentUser: User | null;
        isLightMode: boolean;
        toggleTheme: () => void;
        isMobileMenuOpen: boolean;
        toggleMobileMenu: () => void;
        closeMobileMenu: (restoreFocus?: boolean) => void;
        mobileMenuButton?: HTMLButtonElement;
        mobileMenu?: HTMLElement;
    } = $props();
</script>

<nav class="glass-panel" in:fly={{ y: -100, delay: 200, duration: 1000 }}>
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

        <AuthSection bind:currentUser />
    </div>

    <MobileMenu {isMobileMenuOpen} {closeMobileMenu} bind:mobileMenu />

    <div class="mobile-page-navigation"></div>
</nav>

<style lang="scss">
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

        .mobile-menu-toggle {
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
        }
    }

    @media (max-width: 900px) {
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

            .mobile-page-navigation:not(:empty) {
                display: block;
                flex: 0 0 100%;
                min-width: 0;
            }
        }
    }

    @media (max-width: 480px) {
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
            }

            .nav-left .mobile-menu-toggle {
                padding: 0.3rem;
            }
        }
    }
</style>
