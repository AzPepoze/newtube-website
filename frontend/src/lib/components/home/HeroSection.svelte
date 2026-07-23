<script lang="ts">
    import { fly } from "svelte/transition";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import { extensionState } from "$lib/core/extension.svelte";
</script>

<section class="hero" in:fly={{ y: 30, duration: 800 }}>
    <div class="hero-content">
        <div class="hero-logo-container">
            <img src="/logo-big.png" alt="NewTube logo" class="hero-logo" />
        </div>
        <h1 class="premium-font">
            Discover / Create <br />
            Your <span class="glow">NewTube</span> Experience
        </h1>

        <div class="cta-group">
            {#if extensionState.isExtensionReady}
                <a href="/discover" class="primary-cta premium-button">
                    Explore Themes
                </a>
                <a
                    href="/themes/create"
                    class="secondary-cta premium-button glass-panel"
                >
                    Create Theme
                </a>
            {:else}
                <div class="install-grid">
                    <a
                        href="https://chromewebstore.google.com/detail/newtube-youtube-customize/dnjjchajjdnfbjhjclmilicgheglcopj"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="install-card glass-panel chrome-badge"
                    >
                        <div class="card-glow"></div>
                        <div class="badge-content">
                            <div class="logo-stack">
                                <div class="browser-icon chrome"></div>
                            </div>
                            <div class="install-info">
                                <h3>Chrome / Edge</h3>
                                <p>Available on Chrome Web Store</p>
                            </div>
                            <div class="download-badge">
                                <MaterialIcon name="download" size={20} />
                            </div>
                        </div>
                    </a>
                    <a
                        href="https://addons.mozilla.org/en-US/firefox/addon/newtube-youtubestylecustomizer/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="install-card glass-panel firefox-badge"
                    >
                        <div class="card-glow"></div>
                        <div class="badge-content">
                            <div class="logo-stack">
                                <div class="browser-icon firefox"></div>
                            </div>
                            <div class="install-info">
                                <h3>Firefox</h3>
                                <p>Available on Firefox Add-ons</p>
                            </div>
                            <div class="download-badge">
                                <MaterialIcon name="download" size={20} />
                            </div>
                        </div>
                    </a>
                </div>
            {/if}
        </div>
    </div>
</section>

<style lang="scss">
    .hero {
        display: flex;
        justify-content: center;
        text-align: center;
        padding: 4rem 0;

        .hero-logo-container {
            margin-bottom: 2.5rem;
            display: flex;
            justify-content: center;
            animation: logoFloat 4s ease-in-out infinite;
            position: relative;

            &::after {
                content: "";
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 200px;
                height: 200px;
                background: radial-gradient(
                    circle,
                    rgba(255, 255, 255, 0.1) 0%,
                    transparent 70%
                );
                z-index: -1;

                :global(.light) & {
                    background: radial-gradient(
                        circle,
                        rgba(0, 0, 0, 0.05) 0%,
                        transparent 70%
                    );
                }
            }
        }

        .hero-logo {
            height: 220px;
            width: auto;
            transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

            &:hover {
                transform: scale(1.05) rotate(2deg);
            }

            @media (max-width: 768px) {
                height: 120px;
            }
        }

        @keyframes logoFloat {
            0%,
            100% {
                transform: translateY(0);
            }
            50% {
                transform: translateY(-10px);
            }
        }

        h1 {
            font-size: 5rem;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            font-weight: 800;

            .glow {
                background: var(--primary-glow);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                filter: drop-shadow(
                    0 0 10px rgba(var(--text-primary-rgb), 0.3)
                );
            }

            @media (max-width: 768px) {
                font-size: 3rem;
            }
        }

        .cta-group {
            display: flex;
            gap: 1.5rem;
            justify-content: center;
        }

        .primary-cta {
            padding: 18px 48px;
            font-size: 1.2rem;
            background: var(--text-primary);
            color: var(--bg-dark);
            border: none;
        }

        .secondary-cta {
            padding: 18px 48px;
            font-size: 1.2rem;
            color: var(--text-primary);
        }
    }

    .install-grid {
        display: flex;
        justify-content: center;
        gap: 2rem;
        flex-wrap: wrap;
        max-width: 1000px;
        margin: 2rem auto 0;
    }

    .install-card {
        position: relative;
        display: flex;
        align-items: center;
        padding: 1.25rem 2rem;
        border-radius: var(--radius-lg);
        overflow: hidden;
        text-decoration: none;
        color: var(--text-primary);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            transform: translateY(-4px);
            border-color: rgba(var(--text-primary-rgb), 0.3);

            .card-glow {
                opacity: 1;
            }
        }

        .card-glow {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            opacity: 0;
            transition: opacity 0.3s;

            &::before {
                content: "";
                position: absolute;
                top: -50%;
                left: -50%;
                width: 200%;
                height: 200%;
                background: radial-gradient(
                    circle at center,
                    rgba(var(--text-primary-rgb), 0.08) 0%,
                    transparent 60%
                );
            }
        }

        .badge-content {
            position: relative;
            display: flex;
            align-items: center;
            gap: 1.5rem;
            z-index: 1;
        }

        .browser-icon {
            width: 42px;
            height: 42px;
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;

            &.chrome {
                background-image: url("https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg");
            }

            &.firefox {
                background-image: url("https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg");
            }
        }

        .install-info {
            text-align: left;

            h3 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 700;
            }

            p {
                margin: 0.2rem 0 0;
                font-size: 0.85rem;
                color: var(--text-secondary);
            }
        }

        .download-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: rgba(var(--text-primary-rgb), 0.05);
            margin-left: 1rem;
        }
    }
</style>
