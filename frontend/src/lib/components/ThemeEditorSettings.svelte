<script lang="ts">
	import PrismEditor from "$lib/components/PrismEditor.svelte";

	let {
		settingsCode = $bindable(""),
		jsonError = $bindable(""),
	}: {
		settingsCode: string;
		jsonError: string;
	} = $props();

	$effect(() => {
		try {
			JSON.parse(settingsCode);
			jsonError = "";
		} catch (e: any) {
			jsonError = e.message;
		}
	});
</script>

<div class="card glass-panel">
	<div class="card-header">
		<h3>Theme Settings (JSON)</h3>
		{#if jsonError}
			<span class="json-error">{jsonError}</span>
		{:else}
			<span class="json-valid">✓ Valid JSON</span>
		{/if}
	</div>
	<PrismEditor bind:value={settingsCode} language="json" height="480px" />
</div>

<style lang="scss">
	.card {
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;

		h3 {
			margin: 0;
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--text-primary);
		}

		.card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;

			.json-error {
				font-size: 0.8rem;
				color: #ff3232;
			}
			.json-valid {
				font-size: 0.8rem;
				color: var(--text-secondary);
			}
		}
	}
</style>
