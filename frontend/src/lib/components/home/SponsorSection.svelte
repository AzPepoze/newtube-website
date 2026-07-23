<script lang="ts">
    import { fly } from "svelte/transition";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    let {
        sponsors,
    }: { sponsors: { name: string; avatar: string; link: string }[] } =
        $props();
</script>

<section class="sponsor-section" in:fly={{ y: 30, duration: 800, delay: 400 }}>
    <div class="sponsor-header">
        <MaterialIcon name="favorite" size={32} color="#ff4d4d" />
        <h2 class="premium-font">My Awesome Sponsors</h2>
    </div>

    <div class="sponsors-flex">
        {#if sponsors.length === 0}
            <div class="no-sponsors-message" in:fly={{ y: 20, duration: 600 }}>
                <p>
                    No sponsors yet... <span class="highlight"
                        >become the first one!</span
                    >
                </p>
            </div>
        {:else}
            {#each sponsors as sponsor}
                <a
                    href={sponsor.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="sponsor-avatar-link"
                    title={sponsor.name}
                >
                    <img
                        src={sponsor.avatar}
                        alt={sponsor.name}
                        class="sponsor-avatar"
                    />
                </a>
            {/each}
        {/if}
    </div>

    <a
        href="https://github.com/sponsors/AzPepoze"
        target="_blank"
        rel="noopener noreferrer"
        class="sponsor-add-btn"
    >
        <img
            src="https://media.tenor.com/XmUpFK6JyU8AAAAj/cute-please.gif"
            alt="become sponsor"
            class="btn-gif-icon"
        />
        <span>Become a Sponsor</span>
    </a>

    <p class="sponsor-text">
        NewTube is free and open source. Your support helps me keep the project
        alive and bring more features.
    </p>
</section>

<style lang="scss">
    .sponsor-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 3rem 2rem;
        background: rgba(var(--text-primary-rgb), 0.02);
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-lg);
        max-width: 900px;
        margin: 0 auto;

        .sponsor-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 2rem;

            h2 {
                margin: 0;
                font-size: 2rem;
            }
        }

        .sponsors-flex {
            display: flex;
            flex-wrap: wrap;
            gap: 1.5rem;
            justify-content: center;
            margin-bottom: 2.5rem;

            .no-sponsors-message {
                p {
                    font-size: 1.2rem;
                    color: var(--text-secondary);

                    .highlight {
                        color: var(--primary-glow);
                        font-weight: 700;
                    }
                }
            }

            .sponsor-avatar-link {
                transition: transform 0.2s;

                &:hover {
                    transform: scale(1.1);
                }

                .sponsor-avatar {
                    width: 54px;
                    height: 54px;
                    border-radius: 50%;
                    border: 2px solid var(--primary-glow);
                    object-fit: cover;
                }
            }
        }

        .sponsor-add-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.8rem 1.8rem;
            background: #ff4d4d;
            color: #ffffff;
            font-weight: 700;
            border-radius: var(--radius-md);
            text-decoration: none;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3);

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(255, 77, 77, 0.4);
            }

            .btn-gif-icon {
                width: 24px;
                height: 24px;
                object-fit: contain;
            }
        }

        .sponsor-text {
            margin-top: 1.5rem;
            font-size: 0.95rem;
            color: var(--text-muted);
            max-width: 500px;
        }
    }
</style>
