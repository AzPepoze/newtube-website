<script lang="ts">
    import UserAvatar from "$lib/components/common/UserAvatar.svelte";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import type { Theme } from "$lib/types/index";

    interface ThemeDetail extends Theme {
        creatorName?: string;
        creatorAvatar?: string;
    }

    let {
        theme,
        currentUser,
        formatDate,
    }: {
        theme: ThemeDetail;
        currentUser: string;
        formatDate: (dateStr?: string) => string;
    } = $props();
</script>

<div class="creator glass-panel">
    <UserAvatar
        userId={theme.ownerId}
        name={theme.creatorName}
        avatarUrl={theme.creatorAvatar}
        size="md"
        showLabel={true}
    />
    <div class="theme-dates">
        <div class="date-item" title="Created Date">
            <MaterialIcon name="calendar_today" size={16} />
            <span>Created: {formatDate(theme.createdAt)}</span>
        </div>
        <div class="date-item" title="Last Updated">
            <MaterialIcon name="update" size={16} />
            <span>Updated: {formatDate(theme.updatedAt)}</span>
        </div>
    </div>

    {#if currentUser === theme.ownerId}
        <div class="creator-actions">
            <a
                href="/themes/edit/{theme.themeId}"
                class="edit-theme-btn premium-button"
            >
                <MaterialIcon name="edit" size={16} />
                <span>Edit Theme</span>
            </a>
        </div>
    {/if}
</div>

<style lang="scss">
    .creator {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.5rem;
        padding: 1.25rem 2rem;
        border-radius: var(--radius-lg);
        width: 100%;
        flex-wrap: wrap;

        .theme-dates {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding-top: 0;

            .date-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                color: var(--text-primary);
                white-space: nowrap;
            }
        }

        .creator-actions {
            padding-top: 0;
            margin-left: auto;

            .edit-theme-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                padding: 0.65rem 1.25rem;
                font-size: 0.85rem;
                font-weight: 600;
                text-decoration: none;
                white-space: nowrap;
                border-radius: var(--radius-md);
            }
        }

        @media (max-width: 640px) {
            flex-direction: column;
            align-items: flex-start;

            .theme-dates {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }

            .creator-actions {
                margin-left: 0;
                width: 100%;

                .edit-theme-btn {
                    width: 100%;
                }
            }
        }
    }
</style>
