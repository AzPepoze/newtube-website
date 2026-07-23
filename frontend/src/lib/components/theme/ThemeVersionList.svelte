<script lang="ts">
    export type ThemeVersion = {
        id: string;
        versionNumber?: number;
        themeName?: string;
        description?: string;
        createdAt?: string;
    };

    let {
        versions,
        formatDate,
    }: {
        versions: ThemeVersion[];
        formatDate: (value?: string) => string;
    } = $props();
</script>

<div class="version-history">
    <h3>Version History</h3>
    {#if versions.length === 0}
        <p class="empty">No version history recorded yet.</p>
    {:else}
        <div class="timeline">
            {#each versions as item, index}
                <div class="timeline-item">
                    <div class="dot"></div>
                    <div class="content">
                        <div class="header">
                            <strong>
                                Version {item.versionNumber ??
                                    versions.length - index}
                            </strong>
                            <span class="date">
                                {formatDate(item.createdAt)}
                            </span>
                        </div>
                        {#if item.themeName}
                            <p class="name">{item.themeName}</p>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    {/if}
</div>

<style lang="scss">
    .version-history {
        margin-top: 3rem;

        h3 {
            font-size: 1.3rem;
            margin-bottom: 1.5rem;
        }

        .empty {
            color: var(--text-muted);
        }

        .timeline {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
            position: relative;
            padding-left: 1.5rem;

            &::before {
                content: "";
                position: absolute;
                left: 6px;
                top: 8px;
                bottom: 8px;
                width: 2px;
                background: var(--border-glass);
            }

            .timeline-item {
                position: relative;

                .dot {
                    position: absolute;
                    left: -1.5rem;
                    top: 6px;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background: var(--text-primary);
                    border: 3px solid var(--bg-dark);
                }

                .header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;

                    .date {
                        font-size: 0.85rem;
                        color: var(--text-muted);
                    }
                }

                .name {
                    margin: 0.25rem 0 0;
                    color: var(--text-secondary);
                    font-size: 0.95rem;
                }
            }
        }
    }
</style>
