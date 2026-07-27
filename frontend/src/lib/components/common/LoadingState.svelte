<script lang="ts">
    let {
        text = "Loading...",
        size = 40,
        className = "",
    }: {
        text?: string;
        size?: number;
        className?: string;
    } = $props();
</script>

<div class="store-loading-state {className}">
    <div class="spinner" style="width: {size}px; height: {size}px;"></div>
    {#if text}
        <p class="loading-text">{text}</p>
    {/if}
</div>

<style lang="scss">
    .store-loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 1rem;
        gap: 1rem;
        text-align: center;
        color: var(--text-secondary, #aaa);
        font-family: inherit;

        .spinner {
            border: 3px solid rgba(var(--text-primary-rgb, 255, 255, 255), 0.1);
            border-top-color: var(--primary-glow, #00e5ff);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            flex-shrink: 0;
        }

        .loading-text {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--text-secondary, #aaa);
        }
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }
</style>
