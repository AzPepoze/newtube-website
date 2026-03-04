<script lang="ts">
    let { size = 16, color = "currentColor" } = $props();
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
    <path d="M6 12h12" />
    <path d="M6 20V4" />
    <path d="M18 20V4" />
</svg>
