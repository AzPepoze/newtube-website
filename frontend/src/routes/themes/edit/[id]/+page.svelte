<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { scale } from "svelte/transition";
    import ThemeEditor from "$lib/components/editor/ThemeEditor.svelte";
    import { requireAuth } from "$lib/utils/auth";
    import type { Theme } from "$lib/types/index";

    import { PUBLIC_API_URL } from "$lib/constants/index";
    const { id } = page.params;

    let theme = $state<Theme | null>(null);
    let loading = $state(true);
    let error = $state("");

    onMount(async () => {
        const userId = requireAuth();
        if (!userId) return;

        try {
            const response = await fetch(`${PUBLIC_API_URL}/themes/${id}`, {
                credentials: "include",
            });
            if (!response.ok) throw new Error("Theme not found");
            theme = await response.json();

            if (theme) {
                if (theme.ownerId !== userId) {
                    window.location.href = "/profile";
                    return;
                }
            }
        } catch (e: any) {
            error = e.message;
        } finally {
            loading = false;
        }
    });
</script>

<div
    class="page-container"
    in:scale={{ delay: 200, start: 0.98, duration: 300 }}
    out:scale={{ start: 0.98, duration: 200 }}
>
    {#if loading}
        <div class="loading-state glass-panel">
            <div class="spinner"></div>
            <p>Loading theme details...</p>
        </div>
    {:else if error}
        <div class="error-state glass-panel">
            <div class="error-icon">⚠️</div>
            <h2>Theme Not Found</h2>
            <p>{error}</p>
            <div class="error-actions">
                <a href="/discover" class="action-btn primary">Back to Discover</a>
                <a href="/" class="action-btn secondary">Back to Home</a>
            </div>
        </div>
    {:else if theme}
        <ThemeEditor initialData={theme} isEdit={true} />
    {/if}
</div>

<style lang="scss">
    .page-container {
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
        border: 3px solid rgba(var(--text-primary-rgb), 0.1);
        border-top-color: var(--primary-glow);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .error-icon {
        font-size: 2.5rem;
    }

    .error-actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
        flex-wrap: wrap;

        .action-btn {
            padding: 0.7rem 1.4rem;
            border-radius: var(--radius-md, 8px);
            font-weight: 600;
            font-size: 0.9rem;
            text-decoration: none;
            transition: all 0.2s ease;

            &.primary {
                background: var(--text-primary);
                color: var(--bg-dark, #000);

                &:hover {
                    transform: translateY(-2px);
                    filter: brightness(1.1);
                }
            }

            &.secondary {
                background: rgba(var(--text-primary-rgb), 0.08);
                color: var(--text-primary);
                border: 1px solid var(--border-glass);

                &:hover {
                    background: rgba(var(--text-primary-rgb), 0.15);
                    transform: translateY(-2px);
                }
            }
        }
    }
</style>
