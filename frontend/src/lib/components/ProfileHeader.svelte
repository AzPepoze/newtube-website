<script lang="ts">
    import { fly } from "svelte/transition";
    import PlusIcon from "$lib/icons/PlusIcon.svelte";
    import UserAvatar from "$lib/components/UserAvatar.svelte";

    let { userData }: { userData: any } = $props();

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }
</script>

{#if userData}
    <header in:fly={{ y: -20, duration: 800 }}>
        <div class="user-header">
            <UserAvatar
                userId={userData.id}
                name={userData.name}
                avatarUrl={userData.avatarUrl}
                size="lg"
                showName={false}
            />
            <div class="header-info">
                <h1 class="premium-font">{userData.name}</h1>
                <p class="join-date">
                    Joined since {formatDate(userData.createdAt)}
                </p>
            </div>
        </div>

        <a href="/themes/create" class="create-btn">
            <PlusIcon size={18} /> Create New Theme
        </a>
    </header>
{/if}

<style lang="scss">
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
            background: var(--text-primary);
            color: var(--bg-dark);
            padding: 14px 28px;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
            }
        }
    }
</style>
