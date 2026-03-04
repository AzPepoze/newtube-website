<script lang="ts">
    import type { Theme } from "$lib/types";
    import DownloadIcon from "$lib/icons/DownloadIcon.svelte";
    import EyeIcon from "$lib/icons/EyeIcon.svelte";
    import SettingsIcon from "$lib/icons/SettingsIcon.svelte";

    let { theme }: { theme: Theme } = $props();
</script>

<div class="stats glass-panel">
    <div class="stat-item">
        <span class="stat-value">
            <DownloadIcon size={20} />
            {theme.downloads.toLocaleString()}
        </span>
        <span class="stat-label">Downloads</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
        <span class="stat-value">
            <EyeIcon size={20} />
            {theme.images?.length ?? 0}
        </span>
        <span class="stat-label">Screenshots</span>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
        <span class="stat-value">
            <SettingsIcon size={20} />
            {Object.keys(theme.settings || {}).length}
        </span>
        <span class="stat-label">Settings</span>
    </div>
</div>

<style lang="scss">
    .stats {
        display: flex;
        align-items: center;
        padding: 1.25rem 1.5rem;
        gap: 0;
        border-radius: var(--radius-md);

        .stat-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.25rem;

            .stat-value {
                font-size: 1.15rem;
                font-weight: 700;
                color: var(--text-primary);
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }

            .stat-label {
                font-size: 0.75rem;
                color: var(--text-muted);
            }
        }

        .stat-divider {
            width: 1px;
            height: 40px;
            background: var(--border-glass);
        }
    }
</style>
