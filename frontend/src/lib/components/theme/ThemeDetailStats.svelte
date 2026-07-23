<script lang="ts">
    import type { Theme } from "$lib/types/index";
    import { formatBytes } from "$lib/utils/validation";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

    let { theme }: { theme: Theme } = $props();

    const settingsSize = $derived.by(() => {
        if (!theme.settings) return 0;
        return new Blob([JSON.stringify(theme.settings)]).size;
    });
    const rating = $derived(
        typeof theme.rating === "number" && Number.isFinite(theme.rating)
            ? theme.rating
            : null,
    );
</script>

<div class="stats-container glass-panel">
    <div class="stat-group">
        <div class="stat-item">
            <div class="stat-icon-wrapper rating">
                <MaterialIcon name="star" size={24} />
            </div>
            <div class="stat-content">
                <span class="stat-value"
                    >{rating === null ? "New" : rating.toFixed(1)}</span
                >
                <span class="stat-label">Rating</span>
            </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item">
            <div class="stat-icon-wrapper downloads">
                <MaterialIcon name="download" size={24} />
            </div>
            <div class="stat-content">
                <span class="stat-value"
                    >{theme.downloads.toLocaleString()}</span
                >
                <span class="stat-label">Downloads</span>
            </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item">
            <div class="stat-icon-wrapper screenshots">
                <MaterialIcon name="image" size={24} />
            </div>
            <div class="stat-content">
                <span class="stat-value">{theme.images?.length ?? 0}</span>
                <span class="stat-label">Screenshots</span>
            </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item">
            <div class="stat-icon-wrapper settings">
                <MaterialIcon name="settings" size={24} />
            </div>
            <div class="stat-content">
                <span class="stat-value"
                    >{Object.keys(theme.settings || {}).length}</span
                >
                <span class="stat-label">Settings</span>
            </div>
        </div>

        <div class="stat-divider"></div>

        <div class="stat-item">
            <div class="stat-icon-wrapper size">
                <MaterialIcon name="data_usage" size={24} />
            </div>
            <div class="stat-content">
                <span class="stat-value">{formatBytes(settingsSize)}</span>
                <span class="stat-label">Theme Size</span>
            </div>
        </div>
    </div>
</div>

<style lang="scss">
    .stats-container {
        padding: 1.5rem 2rem;
        border-radius: var(--radius-lg);
        background: var(--bg-glass);
        border: 1px solid var(--border-glass);
        width: 100%;
        overflow: hidden;

        .stat-group {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 2rem;

            @media (max-width: 768px) {
                justify-content: center;
                gap: 1.5rem;
            }
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 1.25rem;
            flex: 1;
            min-width: 140px;
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

            .stat-icon-wrapper {
                width: 48px;
                height: 48px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 12px;
                background: rgba(var(--text-primary-rgb), 0.05);
                color: var(--text-primary);
                transition: all 0.3s ease;
                border: 1px solid var(--border-glass);

                &.downloads {
                    color: #60a5fa;
                    background: rgba(96, 165, 250, 0.1);
                }
                &.rating {
                    color: #f5c451;
                    background: rgba(245, 196, 81, 0.1);
                }
                &.screenshots {
                    color: #f472b6;
                    background: rgba(244, 114, 182, 0.1);
                }
                &.settings {
                    color: #818cf8;
                    background: rgba(129, 140, 248, 0.1);
                }
                &.size {
                    color: #34d399;
                    background: rgba(52, 211, 153, 0.1);
                }
            }

            .stat-content {
                display: flex;
                flex-direction: column;
                gap: 0.1rem;

                .stat-value {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--text-primary);
                    line-height: 1;
                    font-family: var(--font-premium);
                }

                .stat-label {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: var(--text-primary);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
            }
        }

        .stat-divider {
            width: 1px;
            height: 32px;
            background: linear-gradient(
                to bottom,
                transparent,
                var(--border-glass),
                transparent
            );

            @media (max-width: 1024px) {
                display: none;
            }
        }
    }
</style>
