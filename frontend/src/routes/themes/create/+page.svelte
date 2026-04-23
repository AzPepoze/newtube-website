<script lang="ts">
	import { onMount } from "svelte";
	import { scale } from "svelte/transition";
	import { requireAuth } from "$lib/utils/auth";
	import ThemeEditor from "$lib/components/editor/ThemeEditor.svelte";

	onMount(() => {
		requireAuth();
	});
</script>

<div
	class="page-container"
	in:scale={{ delay: 200, start: 0.98, duration: 300 }}
	out:scale={{ start: 0.98, duration: 200 }}
>
	<ThemeEditor />
</div>

<style lang="scss">
	.page-container {
		padding-top: 2rem;
		min-height: 80vh;
	}
</style>
