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
        flex-direction: column;
        gap: 1.5rem;
        padding: 1.5rem;
        border-radius: var(--radius-lg);

        .theme-dates {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            padding-top: 1rem;
            border-top: 1px solid var(--border-glass);

            .date-item {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.85rem;
                color: var(--text-muted);
            }
        }

        .creator-actions {
            padding-top: 0.5rem;

            .edit-theme-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                width: 100%;
                padding: 0.75rem;
                font-size: 0.9rem;
                text-decoration: none;
            }
        }
    }
</style>
