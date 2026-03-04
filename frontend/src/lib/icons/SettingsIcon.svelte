<script lang="ts">
	let { size = 18, color = "currentColor" } = $props<{
		size?: number;
		color?: string;
	}>();
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke={color}
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
>
	<circle cx="12" cy="12" r="3" />
	<path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
	<path d="M4.93 4.93a10 10 0 0 0 0 14.14" />
</svg>
