<script lang="ts">
	let { name, size = 24, color = "currentColor", class: className = "" } = $props<{
		name: string;
		size?: number;
		color?: string;
		class?: string;
	}>();
</script>

<span 
	class="material-icons {className}" 
	style="font-size: {size}px; color: {color};"
>
	{name}
</span>

<style>
	.material-icons {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		user-select: none;
		vertical-align: middle;
	}
</style>
