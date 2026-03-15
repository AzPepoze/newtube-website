<script lang="ts">
	import { fade } from "svelte/transition";
	import MarkdownEditor from "$lib/components/MarkdownEditor.svelte";
	import TrashIcon from "$lib/icons/TrashIcon.svelte";
	import UploadIcon from "$lib/icons/UploadIcon.svelte";
	import LinkIcon from "$lib/icons/LinkIcon.svelte";
	import { validateTitle, LIMITS } from "$lib/validation";

	let {
		themeName = $bindable(""),
		description = $bindable(""),
		images = $bindable([]),
		coverImage = $bindable(""),
		pendingImages = $bindable<File[]>([]),
		errorMessage = $bindable(""),
		coverImagePending = $bindable(null),
	}: {
		themeName: string;
		description: string;
		images: string[];
		coverImage: string;
		pendingImages: File[];
		errorMessage: string;
		coverImagePending: File | null;
	} = $props();

	let newImageUrl = $state("");
	let isDragging = $state(false);
	let coverImageDragging = $state(false);
	let titleError = $state("");
	let isNameDisabled = $state(false);

	$effect(() => {
		const validation = validateTitle(themeName);
		titleError = validation.message || "";
		isNameDisabled = themeName.length >= LIMITS.title;
	});

	function handleFile(file: File) {
		if (!file.type.startsWith("image/")) {
			errorMessage = "Please upload only image files.";
			return;
		}
		pendingImages = [...pendingImages, file];
	}

	function handleCoverImageFile(file: File) {
		if (!file.type.startsWith("image/")) {
			errorMessage = "Please upload only image files.";
			return;
		}
		coverImagePending = file;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		if (e.dataTransfer?.files) {
			Array.from(e.dataTransfer.files).forEach(handleFile);
		}
	}

	function handleCoverImageDrop(e: DragEvent) {
		e.preventDefault();
		coverImageDragging = false;
		if (e.dataTransfer?.files) {
			const file = e.dataTransfer.files[0];
			if (file) handleCoverImageFile(file);
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files) {
			Array.from(input.files).forEach(handleFile);
		}
	}

	function handleCoverImageSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			handleCoverImageFile(input.files[0]);
		}
	}

	function addImage() {
		const url = newImageUrl.trim();
		if (!url || images.includes(url)) return;
		images = [...images, url];
		newImageUrl = "";
	}

	function addCoverImageUrl() {
		const url = newImageUrl.trim();
		if (!url) return;
		coverImage = url;
		newImageUrl = "";
	}

	function removeImage(index: number) {
		images = images.filter((_, i) => i !== index);
	}

	function removePendingImage(index: number) {
		pendingImages = pendingImages.filter((_, i) => i !== index);
	}

	function removeCoverImage() {
		coverImage = "";
		coverImagePending = null;
	}

	function removeCoverImagePending() {
		coverImagePending = null;
	}
</script>

<div class="card glass-panel">
	<h3>Basic Information</h3>
	<div class="field">
		<label for="themeName">Name</label>
		<input
			id="themeName"
			type="text"
			bind:value={themeName}
			placeholder="Theme Name"
			disabled={isNameDisabled}
			required
		/>
		<div class="field-meta">
			<span
				class="counter"
				class:error={!titleError && themeName.length >= LIMITS.title}
			>
				{themeName.length} / {LIMITS.title}
			</span>
			{#if titleError}
				<span class="error-text">{titleError}</span>
			{/if}
		</div>
	</div>
	<div class="field">
		<label for="description">Description (Markdown Supported)</label>
		<MarkdownEditor bind:value={description} />
	</div>
</div>

<div class="card glass-panel">
	<div class="card-header">
		<h3>Cover Image</h3>
		<p class="hint">One image for your theme card preview</p>
	</div>

	<div
		class="drop-zone"
		class:dragging={coverImageDragging}
		role="button"
		tabindex="0"
		ondragover={(e) => {
			e.preventDefault();
			coverImageDragging = true;
		}}
		ondragleave={() => (coverImageDragging = false)}
		ondrop={handleCoverImageDrop}
	>
		<UploadIcon size={32} />
		<div class="drop-text">
			<p>Drag & Drop image here or</p>
			<label class="browse-btn">
				Browse Files
				<input
					type="file"
					accept="image/*"
					onchange={handleCoverImageSelect}
					hidden
				/>
			</label>
		</div>
	</div>

	<div class="url-input-wrapper">
		<div class="icon-input">
			<LinkIcon size={16} />
			<input
				type="url"
				bind:value={newImageUrl}
				placeholder="Or paste an image URL..."
				onkeydown={(e) =>
					e.key === "Enter" &&
					(e.preventDefault(), addCoverImageUrl())}
			/>
		</div>
		<button
			type="button"
			class="add-url-btn premium-button"
			onclick={addCoverImageUrl}
		>
			Add URL
		</button>
	</div>

	<div class="images-grid">
		{#if coverImagePending}
			<div class="image-item glass-panel" in:fade>
				<img
					src={URL.createObjectURL(coverImagePending)}
					alt="Cover pending"
				/>
				<div class="pending-badge">Pending</div>
				<button
					type="button"
					class="remove-btn"
					onclick={removeCoverImagePending}
					title="Remove Cover Image"
				>
					<TrashIcon size={14} />
				</button>
			</div>
		{/if}
		{#if coverImage}
			<div class="image-item glass-panel" in:fade>
				<img src={coverImage} alt="Cover" />
				<button
					type="button"
					class="remove-btn"
					onclick={removeCoverImage}
					title="Remove Cover Image"
				>
					<TrashIcon size={14} />
				</button>
			</div>
		{/if}
	</div>
</div>

<div class="card glass-panel">
	<div class="card-header">
		<h3>Screenshots</h3>
		<p class="hint">Upload up to 5 screenshots of your theme</p>
	</div>

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
	>
		<UploadIcon size={32} />
		<div class="drop-text">
			<p>Drag & Drop images here or</p>
			<label class="browse-btn">
				Browse Files
				<input
					type="file"
					accept="image/*"
					multiple
					onchange={handleFileSelect}
					hidden
				/>
			</label>
		</div>
	</div>

	<div class="url-input-wrapper">
		<div class="icon-input">
			<LinkIcon size={16} />
			<input
				type="url"
				bind:value={newImageUrl}
				placeholder="Or paste an image URL..."
				onkeydown={(e) =>
					e.key === "Enter" && (e.preventDefault(), addImage())}
			/>
		</div>
		<button
			type="button"
			class="add-url-btn premium-button"
			onclick={addImage}
		>
			Add URL
		</button>
	</div>

	<div class="images-grid">
		{#each pendingImages as file, i}
			<div class="image-item glass-panel" in:fade>
				<img
					src={URL.createObjectURL(file)}
					alt="Pending screenshot {i + 1}"
				/>
				<div class="pending-badge">Pending</div>
				<button
					type="button"
					class="remove-btn"
					onclick={() => removePendingImage(i)}
					title="Remove Screenshot"
				>
					<TrashIcon size={14} />
				</button>
			</div>
		{/each}
		{#each images as url, i}
			<div class="image-item glass-panel" in:fade>
				<img src={url} alt="Screenshot {i + 1}" />
				<button
					type="button"
					class="remove-btn"
					onclick={() => removeImage(i)}
					title="Remove Screenshot"
				>
					<TrashIcon size={14} />
				</button>
			</div>
		{/each}
	</div>
</div>

<style lang="scss">
	.card {
		padding: 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		margin-bottom: 2rem;

		h3 {
			margin: 0;
			font-size: 1.25rem;
			font-weight: 700;
			color: var(--text-primary);
		}

		.card-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			flex-wrap: wrap;
			margin-bottom: 0.5rem;

			.hint {
				margin: 0;
				font-size: 0.9rem;
				color: var(--text-secondary);
			}
		}
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		label {
			font-size: 0.85rem;
			color: var(--text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.1em;
			font-weight: 800;
		}

		input {
			background: rgba(var(--text-primary-rgb), 0.03);
			border: 1px solid var(--border-glass);
			padding: 1rem 1.25rem;
			border-radius: var(--radius-md);
			color: var(--text-primary);
			font-family: inherit;
			font-size: 1.1rem;
			transition: all 0.2s;

			&::placeholder {
				color: var(--text-muted);
			}

			&:focus {
				outline: none;
				border-color: var(--text-primary);
				background: rgba(var(--text-primary-rgb), 0.05);
			}

			&:disabled {
				opacity: 0.6;
				cursor: not-allowed;
				background: rgba(var(--text-primary-rgb), 0.01);
			}
		}

		.field-meta {
			display: flex;
			justify-content: space-between;
			align-items: center;
			font-size: 0.85rem;
			gap: 1rem;
		}

		.counter {
			color: var(--text-secondary);
			font-weight: 600;

			&.error {
				color: var(--error, #ff5a5a);
			}
		}

		.error-text {
			color: var(--error, #ff5a5a);
			font-weight: 500;
		}
	}

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

	.url-input-wrapper {
		display: flex;
		gap: 0.75rem;
		margin-bottom: 2.5rem;

		.icon-input {
			flex: 1;
			position: relative;
			display: flex;
			align-items: center;

			input {
				width: 100%;
				background: rgba(var(--text-primary-rgb), 0.03);
				border: 1px solid var(--border-glass);
				padding: 0.8rem 1rem 0.8rem 2.8rem;
				border-radius: var(--radius-sm);
				color: var(--text-primary);
				font-family: inherit;
				font-size: 1rem;
				transition: all 0.2s;

				&:focus {
					outline: none;
					border-color: var(--text-primary);
					background: rgba(var(--text-primary-rgb), 0.05);
				}
			}

			:global(svg) {
				position: absolute;
				left: 1rem;
				color: var(--text-muted);
			}
		}

		.add-url-btn {
			white-space: nowrap;
			padding: 0 1.5rem;
			background: transparent;
			color: var(--text-primary);
			border-color: var(--border-glass);

			&:hover {
				background: var(--text-primary);
				color: var(--bg-dark);
			}
		}
	}

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
