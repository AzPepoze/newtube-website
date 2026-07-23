<script lang="ts">
    import { slide } from "svelte/transition";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    let {
        isMobileMenuOpen,
        closeMobileMenu,
        mobileMenu = $bindable(),
    }: {
        isMobileMenuOpen: boolean;
        closeMobileMenu: (restoreFocus?: boolean) => void;
        mobileMenu?: HTMLElement;
    } = $props();
</script>

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

<style lang="scss">
    .mobile-menu {
        display: none;
    }

    @media (max-width: 900px) {
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
    }
</style>
