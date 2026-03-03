<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import type { Theme } from "$lib/types";
	import EditIcon from "$lib/icons/EditIcon.svelte";
	import EyeIcon from "$lib/icons/EyeIcon.svelte";
	import { getUserId } from "$lib/auth";
	import { PUBLIC_API_URL } from "$lib/constants";
	import { compressImage } from "$lib/imageCompression";
	import ThemeEditorBasicInfo from "$lib/components/ThemeEditorBasicInfo.svelte";
	import ThemeEditorSettings from "$lib/components/ThemeEditorSettings.svelte";
	import ThemeEditorPreview from "$lib/components/ThemeEditorPreview.svelte";
	let props: { initialData?: Partial<Theme>; isEdit?: boolean } = $props();
	let isEdit = $derived(props.isEdit ?? false);
	let initialData = $derived(props.initialData);

	let userId = getUserId();
	let name = $state("");
	let description = $state("");
	let images = $state<string[]>([]);
	let coverImage = $state("");
	let coverImagePending = $state<File | null>(null);
	let pendingImages = $state<File[]>([]);
	let settingsCode = $state("");

	let submitting = $state(false);
	let success = $state(false);
	let errorMessage = $state("");
	let activeTab = $state<"info" | "settings" | "preview">("info");
	let jsonError = $state("");

	// Initialize form with provided data
	$effect(() => {
		if (initialData) {
			name = initialData.name || "";
			description = initialData.description || "";
			images = initialData.images || [];
			coverImage = initialData.coverImage || "";
			settingsCode = JSON.stringify(
				initialData.settings || {
					MainThemeColor: "#ffffff",
					EnableBackground: true,
					EnableAnimationsTransitions: true,
				},
				null,
				2,
			);
		}
	});

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!userId) {
			errorMessage = "You must be logged in to save a theme.";
			return;
		}

		if (jsonError) {
			errorMessage = "Please fix the JSON settings before saving.";
			return;
		}

		submitting = true;
		errorMessage = "";

		try {
			// Compress pending images
			const pendingImagesData = [];
			for (const file of pendingImages) {
				const compressed = await compressImage(file);
				pendingImagesData.push(compressed);
			}

			// Compress pending cover image
			let pendingCoverImageData = null;
			if (coverImagePending) {
				pendingCoverImageData = await compressImage(coverImagePending);
			}

			const payload: any = {
				name,
				description,
				imgs: images,
				coverImage,
				pendingImages: pendingImagesData,
				pendingCoverImage: pendingCoverImageData,
				settings: JSON.parse(settingsCode),
				customStyleshift: props.initialData?.customStyleshift || [],
			};

			const method = isEdit ? "PUT" : "POST";
			const url = isEdit
				? `${PUBLIC_API_URL}/themes/${props.initialData?.id}`
				: `${PUBLIC_API_URL}/themes`;

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!response.ok)
				throw new Error(
					`Failed to ${isEdit ? "update" : "create"} theme`,
				);

			const data = await response
				.json()
				.catch(() => ({ id: props.initialData?.id }));
			success = true;
			setTimeout(() => {
				window.location.href = `/themes/${data.id || props.initialData?.id}`;
			}, 1000);
		} catch (error) {
			console.error(error);
			errorMessage = `Failed to ${isEdit ? "update" : "create"} theme. Please try again.`;
		} finally {
			submitting = false;
		}
	}
</script>

<div class="editor-container">
	<div class="header">
		<h1 class="premium-font">
			{isEdit ? "Edit" : "Create"} <span class="glow">Theme</span>
		</h1>
		<div class="tabs">
			<button
				class:active={activeTab === "info"}
				onclick={() => (activeTab = "info")}
				type="button"
			>
				<EditIcon size={16} /> Basic Info
			</button>
			<button
				class:active={activeTab === "settings"}
				onclick={() => (activeTab = "settings")}
				type="button"
			>
				<EditIcon size={16} /> Theme Settings
			</button>
			<button
				class:active={activeTab === "preview"}
				onclick={() => (activeTab = "preview")}
				type="button"
			>
				<EyeIcon size={16} /> Preview
			</button>
		</div>
	</div>

	{#if success}
		<div class="status-banner success" in:fade>
			{isEdit ? "Theme updated!" : "Theme published!"} Redirecting...
		</div>
	{/if}

	{#if errorMessage}
		<div class="status-banner error" in:fade>
			⚠️ {errorMessage}
		</div>
	{/if}

	<form onsubmit={handleSubmit} class="editor-grid">
		<div class="sections-wrapper">
			{#if activeTab === "info"}
				<div
					class="editor-main"
					in:fly={{ y: 20, duration: 400, delay: 150 }}
					out:fly={{ y: -20, duration: 250 }}
				>
					<ThemeEditorBasicInfo
						bind:name
						bind:description
						bind:images
						bind:coverImage
						bind:coverImagePending
						bind:pendingImages
						bind:errorMessage
					/>
				</div>
			{:else if activeTab === "settings"}
				<div
					class="editor-main"
					in:fly={{ y: 20, duration: 400, delay: 150 }}
					out:fly={{ y: -20, duration: 250 }}
				>
					<ThemeEditorSettings bind:settingsCode bind:jsonError />
				</div>
			{:else}
				<div
					class="preview-main"
					in:fly={{ y: 20, duration: 400, delay: 150 }}
					out:fly={{ y: -20, duration: 250 }}
				>
					<ThemeEditorPreview
						{name}
						{description}
						{images}
						{coverImage}
						{coverImagePending}
						{settingsCode}
					/>
				</div>
			{/if}
		</div>

		<button
			type="submit"
			class="submit-btn premium-button"
			disabled={submitting || !!jsonError}
		>
			{submitting
				? "Saving..."
				: isEdit
					? "Update Theme"
					: "Publish Theme"}
		</button>
	</form>
</div>

<style lang="scss">
	.editor-container {
		max-width: 1000px;
		margin: 0 auto;
		padding-bottom: 5rem;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;

		h1 {
			margin: 0;
			font-size: 3rem;
		}
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		background: rgba(var(--text-primary-rgb), 0.05);
		padding: 0.3rem;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-glass);

		button {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			padding: 0.5rem 1rem;
			border: none;
			background: transparent;
			color: var(--text-muted);
			font-family: inherit;
			font-weight: 600;
			cursor: pointer;
			border-radius: var(--radius-sm);
			transition: all 0.2s;

			&.active {
				background: var(--text-primary);
				color: var(--bg-dark);
			}
		}
	}

	.status-banner {
		padding: 1rem;
		border-radius: var(--radius-md);
		margin-bottom: 1.5rem;
		font-weight: 600;

		&.success {
			background: rgba(0, 255, 150, 0.1);
			color: #00ff96;
			border: 1px solid rgba(0, 255, 150, 0.2);
		}
		&.error {
			background: rgba(255, 50, 50, 0.1);
			color: #ff3232;
			border: 1px solid rgba(255, 50, 50, 0.2);
		}
	}

	.editor-grid {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.sections-wrapper {
		display: grid;
		grid-template-areas: "content";
		min-width: 0;
		width: 100%;
		overflow: hidden;

		& > div {
			grid-area: content;
			min-width: 0;
			width: 100%;
		}
	}

	.editor-main,
	.preview-main {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.submit-btn {
		width: 100%;
		padding: 1.5rem 2rem;
		font-size: 1.1rem;
		margin-top: 2rem;
	}
</style>
