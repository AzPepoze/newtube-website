<script lang="ts">
	import type { Snippet } from "svelte";

	let {
		label,
		id,
		error = "",
		currentLength = 0,
		maxLength = 0,
		children,
	}: {
		label: string;
		id: string;
		error?: string;
		currentLength?: number;
		maxLength?: number;
		children: Snippet;
	} = $props();
</script>

<div class="field">
	<label for={id}>{label}</label>
	{@render children()}
	<div class="field-meta">
		{#if maxLength > 0}
			<span class="counter" class:error={!error && currentLength >= maxLength}>
				{currentLength} / {maxLength}
			</span>
		{/if}
		{#if error}
			<span class="error-text">{error}</span>
		{/if}
	</div>
</div>

<style lang="scss">
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		label {
			font-size: 0.85rem;
			color: var(--text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			font-weight: 800;
		}

		.field-meta {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 0.85rem;
			gap: 1rem;
		}

		.counter {
			color: var(--text-secondary);
			font-weight: 600;

			&.error {
				color: var(--error, #ff5a5a);
			}
		}

		.error-text {
			color: var(--error, #ff5a5a);
			font-weight: 500;
		}
	}
</style>
