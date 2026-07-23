<script lang="ts">
    import { onMount } from "svelte";
    import HeroSection from "$lib/components/home/HeroSection.svelte";
    import SponsorSection from "$lib/components/home/SponsorSection.svelte";
    import { PUBLIC_API_URL } from "$lib/constants/index";

    let visible = $state(false);
    let sponsors = $state<{ name: string; avatar: string; link: string }[]>([]);

    onMount(async () => {
        visible = true;
        try {
            const response = await fetch(`${PUBLIC_API_URL}/sponsors`);
            if (response.ok) {
                sponsors = await response.json();
            }
        } catch (e) {
            console.error("Failed to fetch sponsors", e);
        }
    });
</script>

<svelte:head>
    <title>NewTube - Enhance Your YouTube Experience</title>
</svelte:head>

<div class="welcome-container">
    {#if visible}
        <HeroSection />
        <SponsorSection {sponsors} />

        <footer class="home-footer">
            <div class="footer-bottom">
                <p>
                    &copy; {new Date().getFullYear()} NewTube. Open Source on GitHub.
                </p>
            </div>
        </footer>
    {/if}
</div>

<style lang="scss">
    .welcome-container {
        display: flex;
        flex-direction: column;
        gap: 8rem;
        padding-bottom: 4rem;
    }

    .home-footer {
        text-align: center;
        color: var(--text-muted);
        font-size: 0.9rem;
    }
</style>
