<script lang="ts">
    import { ui } from "$lib/ui.svelte";
    import { fade, fly } from "svelte/transition";
    import ThemeCard from "$lib/components/ThemeCard.svelte";
    import EditIcon from "$lib/icons/EditIcon.svelte";
    import TrashIcon from "$lib/icons/TrashIcon.svelte";
    import type { Theme } from "$lib/types";

    let {
        loading,
        myThemes,
        deleteTheme,
    }: {
        loading: boolean;
        myThemes: Theme[];
        deleteTheme: (id: string) => void;
    } = $props();

    function confirmDelete(id: string, name: string) {
        ui.showModal(
            "Delete Theme",
            `Are you sure you want to delete "${name}"? This action cannot be undone.`,
            "warning",
            () => deleteTheme(id),
        );
    }
</script>

<section class="themes-section">
    <h2 class="section-title premium-font">Your Creations</h2>

    {#if loading}
        <div class="loading-state">
            <div class="spinner"></div>
            <p>Fetching your creations...</p>
        </div>
    {:else}
        <div class="theme-grid" in:fade={{ duration: 600 }}>
            {#each myThemes as theme (theme.themeId)}
                <div
                    in:fly={{ y: 20, duration: 500 }}
                    class="theme-card-wrapper"
                >
                    <ThemeCard {theme} />
                    <div class="card-actions">
                        <a href="/themes/edit/{theme.themeId}" class="edit-btn">
                            <EditIcon size={14} /> Edit
                        </a>
                        <button
                            class="delete-btn"
                            onclick={() => confirmDelete(theme.themeId, theme.themeName)}
                        >
                            <TrashIcon size={14} /> Delete
                        </button>
                    </div>
                </div>
            {/each}
        </div>

        {#if myThemes.length === 0}
            <div class="empty-state">
                <p>You haven't created any themes yet.</p>
                <a href="/themes/create" class="create-btn">Start Designing</a>
            </div>
        {/if}
    {/if}
</section>

<style lang="scss">
    .themes-section {
        .section-title {
            font-size: 1.75rem;
            margin-bottom: 2.5rem;
            color: var(--text-secondary);
        }
    }

    .theme-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 2.5rem;
    }

    .theme-card-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1rem;

        .card-actions {
            display: flex;
            gap: 0.5rem;

            .edit-btn,
            .delete-btn {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.6rem;
                border: 1px solid var(--border-glass);
                border-radius: var(--radius-sm);
                font-size: 0.85rem;
                font-weight: 600;
                transition: all 0.2s;
                cursor: pointer;
                background: rgba(255, 255, 255, 0.03);
                color: var(--text-secondary);
                font-family: inherit;
                text-decoration: none;

                &:hover {
                    background: rgba(255, 255, 255, 0.08);
                    color: var(--text-primary);
                    border-color: rgba(var(--text-primary-rgb), 0.2);
                }
            }

            .edit-btn {
                background: rgba(var(--text-primary-rgb), 0.05);
                color: var(--text-primary);
                &:hover {
                    background: rgba(var(--text-primary-rgb), 0.1);
                }
            }

            .delete-btn {
                &:hover {
                    background: rgba(255, 77, 77, 0.1);
                    color: #ff4d4d;
                    border-color: rgba(255, 77, 77, 0.2);
                }
            }
        }
    }

    .loading-state {
        text-align: center;
        padding: 5rem 0;
        color: var(--text-muted);

        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid rgba(var(--text-primary-rgb, 255, 255, 255), 0.1);
            border-top-color: var(--text-primary);
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            animation: spin 1s linear infinite;
        }
    }

    .empty-state {
        text-align: center;
        padding: 5rem 0;
        p {
            font-size: 1.25rem;
            color: var(--text-secondary);
            margin-bottom: 1.5rem;
        }
        .create-btn {
            color: white;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
