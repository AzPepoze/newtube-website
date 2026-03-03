<script lang="ts">
	import { renderMarkdown } from "$lib/markdown";
	import PrismEditor from "$lib/components/PrismEditor.svelte";

	let { value = $bindable("") }: { value: string } = $props();
</script>

<div class="markdown-editor-container">
	<div class="editor-pane">
		<div class="header">EDITOR (MARKDOWN)</div>
		<PrismEditor bind:value language="markdown" height="100%" />
	</div>

	<div class="preview-pane">
		<div class="header">PREVIEW</div>
		<div class="preview-content markdown-content">
			{@html renderMarkdown(value)}
		</div>
	</div>
</div>

<style lang="scss">
	.markdown-editor-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0;
		height: 400px;
		background: var(--bg-dark);
		border: 1px solid var(--border-glass);
		border-radius: var(--radius-md);
		overflow: hidden;

		@media (max-width: 768px) {
			grid-template-columns: 1fr;
			height: 600px;
		}
	}

	.header {
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--text-secondary);
		padding: 0.5rem 1rem;
		background: rgba(var(--text-primary-rgb), 0.05);
		border-bottom: 1px solid var(--border-glass);
		letter-spacing: 0.1em;
	}

	.editor-pane,
	.preview-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.editor-pane {
		border-right: 1px solid var(--border-glass);
		background: rgba(var(--text-primary-rgb), 0.01);
	}

	.preview-pane {
		background: rgba(var(--text-primary-rgb), 0.02);
	}

	.preview-content {
		flex: 1;
		padding: 1rem;
		overflow-y: auto;
		color: var(--text-secondary);
		line-height: 1.6;
	}
</style>
