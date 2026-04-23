<script lang="ts">
	import { fade } from "svelte/transition";
	import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

	let {
		images = [],
		pendingImages = [],
		onRemoveImage,
		onRemovePending,
	}: {
		images?: string[];
		pendingImages?: File[];
		onRemoveImage: (index: number) => void;
		onRemovePending: (index: number) => void;
	} = $props();
</script>

<div class="images-grid">
	{#each pendingImages as file, i}
		<div class="image-item glass-panel" in:fade>
			<img
				src={URL.createObjectURL(file)}
				alt="Pending upload {i + 1}"
			/>
			<div class="pending-badge">Pending</div>
			<button
				type="button"
				class="remove-btn"
				onclick={() => onRemovePending(i)}
				title="Remove Image"
			>
				<MaterialIcon name="delete" size={14} />
			</button>
		</div>
	{/each}
	{#each images as url, i}
		<div class="image-item glass-panel" in:fade>
			<img src={url} alt="Uploaded image {i + 1}" />
			<button
				type="button"
				class="remove-btn"
				onclick={() => onRemoveImage(i)}
				title="Remove Image"
			>
				<MaterialIcon name="delete" size={14} />
			</button>
		</div>
	{/each}
</div>

<style lang="scss">
	.images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1.5rem;

		.image-item {
			position: relative;
			background: rgba(0, 0, 0, 0.2);
			border-radius: var(--radius-sm);
			overflow: hidden;
			aspect-ratio: 16/9;
			box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
			border: 1px solid var(--border-glass);

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
			}

			.pending-badge {
				position: absolute;
				top: 0.75rem;
				left: 0.75rem;
				background: rgba(100, 150, 255, 0.9);
				color: white;
				padding: 0.35rem 0.8rem;
				border-radius: 4px;
				font-size: 0.75rem;
				font-weight: 700;
				text-transform: uppercase;
			}

			.remove-btn {
				position: absolute;
				top: 0.75rem;
				right: 0.75rem;
				background: rgba(255, 50, 50, 0.9);
				border: none;
				color: white;
				width: 28px;
				height: 28px;
				border-radius: 50%;
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				opacity: 0;
				transform: translateY(-5px);
				transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
				box-shadow: 0 4px 10px rgba(255, 50, 50, 0.3);
			}

			&:hover .remove-btn {
				opacity: 1;
				transform: translateY(0);
			}
		}
	}
</style>
