<script lang="ts">
	import { onMount } from "svelte";
	import { requireAuth } from "$lib/auth";
	import ThemeEditor from "$lib/components/ThemeEditor.svelte";

	onMount(() => {
		requireAuth();
	});
</script>

<div class="page-container">
	<ThemeEditor />
</div>

<style lang="scss">
	.page-container {
		padding-top: 2rem;
		min-height: 80vh;
	}
</style>
