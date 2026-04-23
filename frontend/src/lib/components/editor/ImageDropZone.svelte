<script lang="ts">
	import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

	let {
		multiple = false,
		onFilesSelected,
	}: {
		multiple?: boolean;
		onFilesSelected: (files: File[]) => void;
	} = $props();

	let isDragging = $state(false);

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) {
			onFilesSelected(Array.from(e.dataTransfer.files));
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			onFilesSelected(Array.from(input.files));
		}
	}
</script>

<div
	class="drop-zone"
	class:dragging={isDragging}
	role="button"
	tabindex="0"
	ondragover={(e) => {
		e.preventDefault();
		isDragging = true;
	}}
	ondragleave={() => (isDragging = false)}
	ondrop={handleDrop}
	onclick={() => document.getElementById(`file-input-${multiple}`)?.click()}
	onkeydown={(e) => e.key === "Enter" && document.getElementById(`file-input-${multiple}`)?.click()}
>
	<MaterialIcon name="upload" size={32} />
	<div class="drop-text">
		<p>Drag & Drop {multiple ? "images" : "image"} here or</p>
		<label class="browse-btn" for="file-input-{multiple}">
			Browse Files
			<input
				id="file-input-{multiple}"
				type="file"
				accept="image/*"
				{multiple}
				onchange={handleFileSelect}
				hidden
			/>
		</label>
	</div>
</div>

<style lang="scss">
	.drop-zone {
		border: 2px dashed var(--border-glass);
		border-radius: var(--radius-md);
		padding: 3.5rem 2rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		transition: all 0.3s ease;
		background: rgba(var(--text-primary-rgb), 0.02);
		cursor: pointer;
		text-align: center;
		margin-bottom: 1.5rem;
		color: var(--text-secondary);

		&:hover,
		&.dragging {
			border-color: var(--text-primary);
			background: rgba(var(--text-primary-rgb), 0.05);
			color: var(--text-primary);
			transform: translateY(-2px);
		}

		.drop-text {
			p {
				margin: 0 0 0.5rem;
				font-size: 1rem;
				color: var(--text-secondary);
			}

			.browse-btn {
				color: var(--text-primary);
				font-weight: 700;
				text-decoration: underline;
				cursor: pointer;
				font-size: 1.1rem;

				&:hover {
					opacity: 0.8;
				}
			}
		}
	}
</style>
