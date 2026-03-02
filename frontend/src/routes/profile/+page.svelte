<script lang="ts">
    import { onMount } from "svelte";
    import ThemeCard from "$lib/components/ThemeCard.svelte";
    import type { Theme } from "$lib/types";
    import { fade, fly } from "svelte/transition";
    import { env } from "$env/dynamic/public";
    import { getUserId } from "$lib/auth";
    import TrashIcon from "$lib/icons/TrashIcon.svelte";
    import EditIcon from "$lib/icons/EditIcon.svelte";
    import PlusIcon from "$lib/icons/PlusIcon.svelte";

    let myThemes = $state<Theme[]>([]);
    let userData = $state<{
        name: string;
        avatar_url: string;
        created_at: string;
    } | null>(null);
    let loading = $state(true);
    let userId = $state("");

    const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    async function fetchMyThemes() {
        userId = getUserId();

        if (!userId) {
            loading = false;
            return;
        }

        loading = true;
        try {
            const response = await fetch(
                `${PUBLIC_API_URL}/profile?userId=${userId}`,
            );
            const data = await response.json();
            myThemes = data.themes || [];
            userData = data.user;
        } catch (error) {
            console.error("Failed to fetch profile themes:", error);
        } finally {
            loading = false;
        }
    }

    onMount(() => {
        fetchMyThemes();
    });

    async function deleteTheme(themeId: string) {
        try {
            await fetch(`${PUBLIC_API_URL}/themes/${themeId}`, {
                method: "DELETE",
            });
            myThemes = myThemes.filter((t) => t.id !== themeId);
        } catch (error) {
            console.error("Failed to delete theme:", error);
        }
    }
</script>

<div class="profile-container">
    {#if !userId}
        <div class="login-prompt glass-panel" in:fade>
            <h2>Login Required</h2>
            <p>Please sign in to view and manage your themes.</p>
            <a href="/login" class="login-btn">Sign In with Google</a>
        </div>
    {:else}
        {#if userData}
            <header in:fly={{ y: -20, duration: 800 }}>
                <div class="user-header">
                    <div class="avatar-large">
                        {#if userData.avatar_url}
                            <img
                                src={userData.avatar_url}
                                alt={userData.name}
                            />
                        {:else}
                            <div class="avatar-fallback">
                                {userData.name.charAt(0)}
                            </div>
                        {/if}
                    </div>
                    <div class="header-info">
                        <h1 class="premium-font">{userData.name}</h1>
                        <p class="join-date">
                            Joined since {formatDate(userData.created_at)}
                        </p>
                    </div>
                </div>

                <a href="/themes/create" class="create-btn">
                    <PlusIcon size={18} /> Create New Theme
                </a>
            </header>
        {/if}

        <section class="themes-section">
            <h2 class="section-title premium-font">Your Creations</h2>

            {#if loading}
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Fetching your creations...</p>
                </div>
            {:else}
                <div class="theme-grid" in:fade={{ duration: 600 }}>
                    {#each myThemes as theme (theme.id)}
                        <div
                            in:fly={{ y: 20, duration: 500 }}
                            class="theme-card-wrapper"
                        >
                            <ThemeCard {theme} />
                            <div class="card-actions">
                                <a
                                    href="/themes/edit/{theme.id}"
                                    class="edit-btn"
                                >
                                    <EditIcon size={14} /> Edit
                                </a>
                                <button
                                    class="delete-btn"
                                    onclick={() => deleteTheme(theme.id)}
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
                        <a href="/themes/create" class="create-btn"
                            >Start Designing</a
                        >
                    </div>
                {/if}
            {/if}
        </section>
    {/if}
</div>

<style lang="scss">
    .profile-container {
        padding: 2rem 0;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5rem;
        padding-bottom: 3rem;
        border-bottom: 1px solid var(--border-glass);

        @media (max-width: 768px) {
            flex-direction: column;
            gap: 2rem;
            text-align: center;
        }

        .user-header {
            display: flex;
            align-items: center;
            gap: 2rem;

            @media (max-width: 768px) {
                flex-direction: column;
            }

            .avatar-large {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                overflow: hidden;
                border: 3px solid var(--border-glass);
                box-shadow: var(--shadow-glow);

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .avatar-fallback {
                    width: 100%;
                    height: 100%;
                    background: var(--text-primary);
                    color: var(--bg-dark);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 3rem;
                    font-weight: 800;
                }
            }

            .header-info {
                h1 {
                    font-size: 2.5rem;
                    margin: 0;
                    margin-bottom: 0.25rem;
                }

                .join-date {
                    color: var(--text-muted);
                    font-size: 1rem;
                    margin: 0;
                }
            }
        }

        .create-btn {
            @include premium-button;
            background: var(--text-primary);
            color: var(--bg-dark);
            padding: 14px 28px;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
    }

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

    .login-prompt {
        max-width: 500px;
        margin: 10vh auto;
        padding: 4rem;
        text-align: center;

        h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }

        p {
            color: var(--text-secondary);
            margin-bottom: 2.5rem;
        }

        .login-btn {
            @include premium-button;
            background: var(--text-primary);
            color: var(--bg-dark);
            text-decoration: none;
            display: inline-block;
        }
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
                    color: $text-primary;
                    border-color: rgba($primary-glow, 0.2);
                }
            }

            .edit-btn {
                background: rgba($primary-glow, 0.05);
                color: $primary-glow;
                &:hover {
                    background: rgba($primary-glow, 0.1);
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

    .login-needed {
        max-width: 500px;
        margin: 10vh auto;
        padding: 4rem;
        text-align: center;

        h2 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        p {
            color: var(--text-secondary);
            margin-bottom: 2.5rem;
        }

        .login-btn {
            @include premium-button;
            background: var(--text-primary);
            color: var(--bg-dark);
            text-decoration: none;
            display: inline-block;
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
            @include premium-button;
            @include glassmorphism;
            color: white;
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
