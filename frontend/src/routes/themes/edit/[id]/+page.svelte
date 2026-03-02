<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { env } from "$env/dynamic/public";
    import ThemeEditor from "$lib/components/ThemeEditor.svelte";
    import type { Theme } from "$lib/types";

    const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";
    const { id } = page.params;

    let theme = $state<Theme | null>(null);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        try {
            const response = await fetch(`${PUBLIC_API_URL}/themes/${id}`);
            if (!response.ok) throw new Error("Theme not found");
            theme = await response.json();

            // Normalize JSON fields
            if (theme) {
                if (typeof theme.settings === "string")
                    theme.settings = JSON.parse(theme.settings);
                if (typeof theme.images === "string")
                    theme.images = JSON.parse(theme.images);
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });
</script>

<div class="page">
    {#if loading}
        <div class="loading-state glass-panel">
            <div class="spinner"></div>
            <p>Loading theme details...</p>
        </div>
    {:else if error}
        <div class="error-state glass-panel">
            <p>⚠️ {error}</p>
            <a href="/profile" class="back-btn">Back to Profile</a>
        </div>
    {:else if theme}
        <ThemeEditor initialData={theme} isEdit={true} />
    {/if}
</div>

<style lang="scss">
    .page {
        padding-top: 2rem;
    }

    .loading-state,
    .error-state {
        max-width: 600px;
        margin: 4rem auto;
        padding: 3rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.5rem;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba($primary-glow, 0.1);
        border-top-color: $primary-glow;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .back-btn {
        @include premium-button;
        background: rgba(255, 255, 255, 0.05);
        color: $text-primary;
    }
</style>
