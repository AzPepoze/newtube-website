<script lang="ts">
    import CustomDropdown from "$lib/components/common/CustomDropdown.svelte";
    import { clearSessionId } from "$lib/utils/auth";

    export interface User {
        id: string;
        name: string;
        avatarUrl: string;
        createdAt: string;
    }

    let { currentUser = $bindable() }: { currentUser: User | null } = $props();

    function handleLogout() {
        clearSessionId();
        currentUser = null;
        window.location.href = "/";
    }
</script>

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
        <a href="/login" class="login-btn premium-button glass-panel">Login</a>
    {/if}
</div>

<style lang="scss">
    .auth-section {
        .login-btn {
            padding: 10px 22px;
            font-size: 1rem;
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

    @media (max-width: 900px) {
        .auth-section .login-btn {
            padding: 8px 14px;
            font-size: 0.9rem;
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
        .auth-section .login-btn {
            padding: 7px 10px;
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
