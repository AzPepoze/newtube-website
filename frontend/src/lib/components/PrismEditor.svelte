<script lang="ts">
	import { onMount, tick, untrack } from "svelte";
	import { basicEditor } from "prism-code-editor/setups";
	import { themeState } from "$lib/theme.svelte";
	import "prism-code-editor/layout.css";
	import "prism-code-editor/scrollbar.css";
	import "prism-code-editor/search.css";
	import "prism-code-editor/cursor.css";
	import "prism-code-editor/themes/atom-one-dark.css";
	import "prism-code-editor/themes/github-light.css";
	import "prism-code-editor/prism/languages/markup";
	import "prism-code-editor/prism/languages/markdown";
	import "prism-code-editor/prism/languages/json";

	interface Props {
		value?: string;
		language?: "markdown" | "json";
		height?: string;
		class?: string;
	}

	let {
		value = $bindable(""),
		language = "markdown",
		height = "480px",
		class: className = "",
	}: Props = $props();

	const theme = $derived(
		themeState.isLightMode ? "github-light" : "atom-one-dark",
	);

	let editorInstance: any;
	let editorElement: HTMLElement | undefined = $state();

	onMount(() => {
		tick().then(() => {
			if (editorElement) {
				editorInstance = basicEditor(editorElement, {
					language,
					theme,
					value: untrack(() => value),
					onUpdate(val) {
						value = val;
					},
				});
			}
		});

		return () => {
			if (editorInstance) {
				editorInstance.remove();
			}
		};
	});

	$effect(() => {
		if (editorInstance && value !== editorInstance.value) {
			editorInstance.setOptions({ value });
		}
	});

	$effect(() => {
		if (editorInstance) {
			editorInstance.setOptions({ theme });
			editorInstance.update();
		}
	});
</script>

<div
	bind:this={editorElement}
	class="prism-editor-host {className}"
	style="height: {height};"
></div>

<style>
	.prism-editor-host {
		display: grid;
		width: 100%;
		border: 1px solid var(--border-glass);
		border-radius: var(--radius-sm);
		overflow: hidden;
		background: var(--bg-dark);
	}
</style>
