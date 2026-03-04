<script lang="ts">
    import { userService } from "$lib/services/userService";

    interface Props {
        userId: string;
        name?: string;
        avatarUrl?: string;
        size?: "sm" | "md" | "lg";
        showName?: boolean;
        showLabel?: boolean;
        horizontal?: boolean;
    }

    let {
        userId,
        name = "",
        avatarUrl = "",
        size = "md",
        showName = true,
        showLabel = false,
        horizontal = true,
    }: Props = $props();

    function getDisplayName(resolvedName?: string | null): string {
        return name || resolvedName || userId || "Unknown";
    }

    function getInitial(resolvedName?: string | null): string {
        const dName = getDisplayName(resolvedName);
        return dName !== "Unknown" ? dName.charAt(0).toUpperCase() : "?";
    }

    function getAvatarFallback(resolvedAvatar?: string | null): string {
        return avatarUrl || resolvedAvatar || "";
    }

    const userProfilePromise = $derived(
        (!name || !avatarUrl) && userId
            ? userService.getProfile(userId)
            : Promise.resolve(null),
    );
</script>

<div class="user-avatar-container {size}" class:horizontal>
    {#await userProfilePromise}
        <div class="avatar-wrapper">
            <div class="avatar-fallback" style="opacity: 0.5;">
                {getInitial()}
            </div>
        </div>
        {#if showName}
            <div class="user-info">
                {#if showLabel}
                    <span class="label">Created by</span>
                {/if}
                <span class="name">Loading...</span>
            </div>
        {/if}
    {:then profile}
        {@const finalAvatar = getAvatarFallback(profile?.avatarUrl)}
        {@const finalName = getDisplayName(profile?.name)}

        <div class="avatar-wrapper">
            {#if finalAvatar}
                <img src={finalAvatar} alt={finalName} class="avatar-img" />
            {:else}
                <div class="avatar-fallback">
                    {getInitial(profile?.name)}
                </div>
            {/if}
        </div>

        {#if showName}
            <div class="user-info">
                {#if showLabel}
                    <span class="label">Created by</span>
                {/if}
                <span class="name">
                    {finalName !== "Unknown"
                        ? finalName
                        : `@${userId.slice(0, 8)}`}
                </span>
            </div>
        {/if}
    {/await}
</div>

<style lang="scss">
    .user-avatar-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        &.horizontal {
            flex-direction: row;
        }

        &:not(.horizontal) {
            flex-direction: column;
            text-align: center;
        }

        &.sm {
            gap: 0.5rem;
            .avatar-wrapper {
                width: 24px;
                height: 24px;
            }
            .name {
                font-size: 0.8rem;
            }
        }

        &.md {
            .avatar-wrapper {
                width: 48px;
                height: 48px;
            }
            .name {
                font-size: 1rem;
                font-weight: 700;
            }
        }

        &.lg {
            gap: 1.5rem;
            .avatar-wrapper {
                width: 100px;
                height: 100px;
                border-width: 3px;
            }
            .name {
                font-size: 2rem;
                font-weight: 800;
            }
        }
    }

    .avatar-wrapper {
        flex-shrink: 0;
        border-radius: 50%;
        overflow: hidden;
        border: 1px solid var(--border-glass);
        background: rgba(var(--primary-glow-rgb), 0.1);
        display: flex;
        align-items: center;
        justify-content: center;

        .avatar-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .avatar-fallback {
            width: 100%;
            height: 100%;
            background: linear-gradient(
                135deg,
                var(--primary-glow),
                var(--secondary-glow)
            );
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: white;
        }
    }

    .user-info {
        display: flex;
        flex-direction: column;
        min-width: 0;

        .label {
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-bottom: -0.1rem;
        }

        .name {
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }
</style>
