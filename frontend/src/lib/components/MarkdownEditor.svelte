<script lang="ts">
	import { renderMarkdown } from "$lib/markdown";
	import PrismEditor from "$lib/components/PrismEditor.svelte";
	import CustomDropdown from "$lib/components/CustomDropdown.svelte";
	import BoldIcon from "$lib/icons/BoldIcon.svelte";
	import ItalicIcon from "$lib/icons/ItalicIcon.svelte";
	import HeadingIcon from "$lib/icons/HeadingIcon.svelte";
	import LinkIcon from "$lib/icons/LinkIcon.svelte";
	import ImageIcon from "$lib/icons/ImageIcon.svelte";
	import CodeIcon from "$lib/icons/CodeIcon.svelte";
	import QuoteIcon from "$lib/icons/QuoteIcon.svelte";
	import ListIcon from "$lib/icons/ListIcon.svelte";
	import ListTodoIcon from "$lib/icons/ListTodoIcon.svelte";

	let { value = $bindable("") }: { value: string } = $props();
	let mode = $state<"split" | "editor" | "preview">("split");
	let editorRef = $state<ReturnType<typeof PrismEditor>>();

	const headingOptions = [
		{ label: "H1 - Large", onClick: () => handleAction("h1") },
		{ label: "H2 - Medium", onClick: () => handleAction("h2") },
		{ label: "H3 - Small", onClick: () => handleAction("h3") },
	];

	function handleAction(action: string) {
		if (!editorRef) return;
		switch (action) {
			case "bold":
				editorRef.insertAction("bold text", "**", "**");
				break;
			case "italic":
				editorRef.insertAction("italic text", "*", "*");
				break;
			case "h1":
				editorRef.insertAction("Heading 1", "# ", "");
				break;
			case "h2":
				editorRef.insertAction("Heading 2", "## ", "");
				break;
			case "h3":
				editorRef.insertAction("Heading 3", "### ", "");
				break;
			case "link":
				editorRef.insertAction("url", "[link text](", ")");
				break;
			case "image":
				editorRef.insertAction("url", "![alt text](", ")");
				break;
			case "code":
				editorRef.insertAction("code", "`", "`");
				break;
			case "quote":
				editorRef.insertAction("quote", "> ", "");
				break;
			case "list":
				editorRef.insertAction("list item", "- ", "");
				break;
			case "task":
				editorRef.insertAction("task", "- [ ] ", "");
				break;
		}
	}
</script>

<div class="markdown-editor-container">
	<div class="toolbar">
		<div class="toolbar-left">
			<div class="header-title">MARKDOWN</div>
			{#if mode !== "preview"}
				<div class="macro-buttons">
					<button
						class="macro-btn"
						onclick={() => handleAction("bold")}
						title="Bold"
						type="button"><BoldIcon size={14} /></button
					>
					<button
						class="macro-btn"
						onclick={() => handleAction("italic")}
						title="Italic"
						type="button"><ItalicIcon size={14} /></button
					>

					<CustomDropdown options={headingOptions} mode="menu">
						{#snippet trigger(toggle)}
							<button
								class="macro-btn"
								onclick={(e) => {
									e.stopPropagation();
									toggle();
								}}
								title="Heading"
								type="button"
							>
								<HeadingIcon size={14} />
							</button>
						{/snippet}
					</CustomDropdown>

					<div class="divider"></div>
					<button
						class="macro-btn"
						onclick={() => handleAction("link")}
						title="Link"
						type="button"><LinkIcon size={14} /></button
					>
					<button
						class="macro-btn"
						onclick={() => handleAction("image")}
						title="Image"
						type="button"><ImageIcon size={14} /></button
					>
					<div class="divider"></div>
					<button
						class="macro-btn"
						onclick={() => handleAction("code")}
						title="Code"
						type="button"><CodeIcon size={14} /></button
					>
					<button
						class="macro-btn"
						onclick={() => handleAction("quote")}
						title="Quote"
						type="button"><QuoteIcon size={14} /></button
					>
					<div class="divider"></div>
					<button
						class="macro-btn"
						onclick={() => handleAction("list")}
						title="List"
						type="button"><ListIcon size={14} /></button
					>
					<button
						class="macro-btn"
						onclick={() => handleAction("task")}
						title="Task"
						type="button"><ListTodoIcon size={14} /></button
					>
				</div>
			{/if}
		</div>
		<div class="tabs">
			<button
				class:active={mode === "editor"}
				onclick={() => (mode = "editor")}
				type="button">Editor</button
			>
			<button
				class:active={mode === "split"}
				onclick={() => (mode = "split")}
				type="button">Split</button
			>
			<button
				class:active={mode === "preview"}
				onclick={() => (mode = "preview")}
				type="button">Preview</button
			>
		</div>
	</div>

	<div
		class="panes"
		class:mode-split={mode === "split"}
		class:mode-editor={mode === "editor"}
		class:mode-preview={mode === "preview"}
	>
		{#if mode === "editor" || mode === "split"}
			<div class="editor-pane">
				<PrismEditor
					bind:this={editorRef}
					bind:value
					language="markdown"
					height="100%"
				/>
			</div>
		{/if}

		{#if mode === "preview" || mode === "split"}
			<div class="preview-pane">
				<div class="preview-content markdown-content">
					{@html renderMarkdown(value)}
				</div>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.markdown-editor-container {
		display: flex;
		flex-direction: column;
		height: 1000px;
		background: var(--bg-dark);
		border: 1px solid var(--border-glass);
		border-radius: var(--radius-md);
		overflow: hidden;

		@media (max-width: 768px) {
			height: 600px;
		}
	}

	.toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 1rem;
		background: rgba(var(--text-primary-rgb), 0.02);
		border-bottom: 1px solid var(--border-glass);
	}

	.header-title {
		font-size: 0.7rem;
		font-weight: 800;
		color: var(--text-secondary);
		letter-spacing: 0.1em;
	}

	.toolbar-left {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.macro-buttons {
		display: flex;
		align-items: center;
		gap: 0.2rem;
		background: rgba(var(--text-primary-rgb), 0.02);
		padding: 0.2rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-glass);

		@media (max-width: 768px) {
			display: none;
		}
	}

	.macro-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-family: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		border-radius: calc(var(--radius-sm) - 2px);
		transition: all 0.2s;

		&:hover {
			color: var(--text-primary);
			background: rgba(var(--text-primary-rgb), 0.1);
		}
	}

	.divider {
		width: 1px;
		height: 14px;
		background: var(--border-glass);
		margin: 0 0.2rem;
	}

	:global(.dropdown-container) {
		display: flex;
	}

	:global(.dropdown-menu) {
		min-width: 160px !important;
	}

	.tabs {
		display: flex;
		gap: 0.25rem;
		background: rgba(var(--text-primary-rgb), 0.02);
		padding: 0.25rem;
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-glass);

		button {
			padding: 0.25rem 0.75rem;
			border: none;
			background: transparent;
			color: var(--text-muted);
			font-family: inherit;
			font-size: 0.75rem;
			font-weight: 600;
			cursor: pointer;
			border-radius: calc(var(--radius-sm) - 2px);
			transition: all 0.2s;

			&.active {
				background: var(--text-primary);
				color: var(--bg-dark);
			}

			&:hover:not(.active) {
				color: var(--text-primary);
				background: rgba(var(--text-primary-rgb), 0.1);
			}
		}
	}

	.panes {
		display: grid;
		flex: 1;
		min-height: 0;

		&.mode-split {
			grid-template-columns: 1fr 1fr;
			@media (max-width: 768px) {
				grid-template-columns: 1fr;
			}
		}

		&.mode-editor,
		&.mode-preview {
			grid-template-columns: 1fr;
		}
	}

	.editor-pane,
	.preview-pane {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.editor-pane {
		background: rgba(var(--text-primary-rgb), 0.01);
	}

	.panes.mode-split .editor-pane {
		border-right: 1px solid var(--border-glass);

		@media (max-width: 768px) {
			border-right: none;
			border-bottom: 1px solid var(--border-glass);
		}
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
