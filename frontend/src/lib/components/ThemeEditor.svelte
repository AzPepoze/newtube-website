<script lang="ts">
	import { fade, fly } from "svelte/transition";
	import type { Theme } from "$lib/types";
	import EditIcon from "$lib/icons/EditIcon.svelte";
	import EyeIcon from "$lib/icons/EyeIcon.svelte";
	import { getSessionId } from "$lib/auth";
	import { PUBLIC_API_URL } from "$lib/constants";
	import { ui } from "$lib/ui.svelte";
	import { compressImage } from "$lib/imageCompression";
	import {
		validateTitle,
		validateDescription,
		validateSettingsJSON,
	} from "$lib/validation";
	import ThemeEditorBasicInfo from "$lib/components/ThemeEditorBasicInfo.svelte";
	import ThemeEditorSettings from "$lib/components/ThemeEditorSettings.svelte";
	import ThemeEditorPreview from "$lib/components/ThemeEditorPreview.svelte";
	import { defaultDescription } from "$lib/theme.svelte";
	let props: { initialData?: Partial<Theme>; isEdit?: boolean } = $props();
	let isEdit = $derived(props.isEdit ?? false);
	let initialData = $derived(props.initialData);

	let userId = getSessionId();
	let name = $state("");
	let description = $state(defaultDescription);
	let images = $state<string[]>([]);
	let coverImage = $state("");
	let coverImagePending = $state<File | null>(null);
	let pendingImages = $state<File[]>([]);
	let settingsCode = $state("");

	let submitting = $state(false);
	let success = $state(false);
	let errorMessage = $state("");
	let infoMessage = $state("");
	let activeTab = $state<"info" | "settings" | "preview">("info");
	let jsonError = $state("");
	let titleError = $state("");
	let descriptionError = $state("");

	const DRAFT_KEY = "newtube_theme_draft";
	let hasRestored = false;

	// Initialize form with provided data or draft
	$effect(() => {
		if (hasRestored) return;
		if (initialData) {
			name = initialData.name || "";
			description = initialData.description || "";
			images = initialData.images || [];
			coverImage = initialData.coverImage || "";
			settingsCode = "";
		} else {
			// Try to load draft from localStorage
			const savedDraft = localStorage.getItem(DRAFT_KEY);
			if (savedDraft) {
				try {
					const draft = JSON.parse(savedDraft);
					name = draft.name || "";
					description = draft.description || "";
					images = draft.images || [];
					coverImage = draft.coverImage || "";
					settingsCode = draft.settingsCode || "";
					if (name || description || settingsCode) {
						success = false;
						infoMessage = "Draft restored from last session.";
						setTimeout(() => {
							if (
								infoMessage ===
								"Draft restored from last session."
							)
								infoMessage = "";
						}, 15000);
					}
				} catch (e) {
					ui.showModal(
						"Draft Error",
						"Failed to load your draft. It may be corrupted.",
						"warning",
					);
				}
			}
		}
		hasRestored = true;
	});

	// Auto-save draft
	$effect(() => {
		if (!isEdit) {
			const draft = {
				name,
				description,
				images,
				coverImage,
				settingsCode,
			};
			localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
		}
	});

	// Track validation state for submit button
	$effect(() => {
		const titleValidation = validateTitle(name);
		titleError = titleValidation.message || "";

		const descriptionValidation = validateDescription(description);
		descriptionError = descriptionValidation.message || "";
	});

	function clearDraft() {
		localStorage.removeItem(DRAFT_KEY);
		window.location.reload();
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!userId) {
			errorMessage = "You must be logged in to save a theme.";
			return;
		}

		// Validate title
		const titleValidation = validateTitle(name);
		if (!titleValidation.valid) {
			errorMessage = titleValidation.message || "Invalid title";
			return;
		}

		// Validate description
		const descriptionValidation = validateDescription(description);
		if (!descriptionValidation.valid) {
			errorMessage =
				descriptionValidation.message || "Invalid description";
			return;
		}

		// Validate JSON settings
		const jsonValidation = validateSettingsJSON(settingsCode);
		if (!jsonValidation.valid) {
			errorMessage = jsonValidation.message || "Invalid JSON settings";
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
				try {
					const compressed = await compressImage(file);
					pendingImagesData.push(compressed);
				} catch (error) {
					const detail =
						error instanceof Error
							? error.message
							: String(error);
					throw new Error(`Image compression failed: ${detail}`);
				}
			}

			// Compress pending cover image
			let pendingCoverImageData = null;
			if (coverImagePending) {
				try {
					pendingCoverImageData =
						await compressImage(coverImagePending);
				} catch (error) {
					const detail =
						error instanceof Error
							? error.message
							: String(error);
					throw new Error(
						`Cover image compression failed: ${detail}`,
					);
				}
			}

			const payload: any = {
				name,
				description,
				imgs: images,
				coverImage,
				pendingImages: pendingImagesData,
				pendingCoverImage: pendingCoverImageData,
				settings: JSON.parse(settingsCode)
			};

			const method = isEdit ? "PUT" : "POST";
			const url = isEdit
				? `${PUBLIC_API_URL}/themes/${props.initialData?.id}`
				: `${PUBLIC_API_URL}/themes`;

			const response = await fetch(url, {
				method,
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify(payload),
			});

			if (!response.ok) {
				const errorBody = await response.text().catch(() => "");
				throw new Error(
					`[${response.status}] ${errorBody || response.statusText}`,
				);
			}

			const data = await response
				.json()
				.catch(() => ({ id: props.initialData?.id }));

			if (!isEdit) {
				localStorage.removeItem(DRAFT_KEY);
			}

			success = true;
			setTimeout(() => {
				window.location.href = `/themes/${data.id || props.initialData?.id}`;
			}, 1000);
		} catch (error) {
			const detail =
				error instanceof Error ? error.message : String(error);
			ui.showModal("Operation Failed", detail, "error");
			errorMessage = detail;
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

	{#if infoMessage}
		<div class="status-banner info" in:fade>
			<div class="message-content">
				<span>✨ {infoMessage}</span>
				{#if infoMessage === "Draft restored from last session."}
					<button
						type="button"
						class="action-btn"
						onclick={clearDraft}
					>
						Discard Draft
					</button>
				{/if}
			</div>
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
					<ThemeEditorSettings
						bind:settingsCode
						bind:jsonError
					/>
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

		<div class="actions">
			{#if !isEdit && (name || description !== defaultDescription || images.length > 0 || coverImage)}
				<button
					type="button"
					class="clear-btn"
					onclick={clearDraft}
					disabled={submitting}
				>
					Clear Draft
				</button>
			{/if}
			<button
				type="submit"
				class="submit-btn premium-button"
				disabled={submitting ||
					!!jsonError ||
					!!titleError ||
					!!descriptionError}
			>
				{submitting
					? "Saving..."
					: isEdit
						? "Update Theme"
						: "Publish Theme"}
			</button>
		</div>
	</form>
</div>

<style lang="scss">
	.editor-container {
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
		&.info {
			background: rgba(var(--text-primary-rgb), 0.05);
			color: var(--text-primary);
			border: 1px solid var(--border-glass);
			backdrop-filter: blur(10px);
		}

		.message-content {
			display: flex;
			justify-content: space-between;
			align-items: center;
			width: 100%;

			.action-btn {
				background: var(--text-primary);
				color: var(--bg-dark);
				border: none;
				padding: 0.4rem 0.8rem;
				border-radius: var(--radius-sm);
				font-size: 0.85rem;
				font-weight: 700;
				cursor: pointer;
				transition: all 0.2s;

				&:hover {
					transform: translateY(-2px);
					filter: brightness(1.1);
				}
			}
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

	.actions {
		display: flex;
		gap: 1rem;
		margin-top: 2rem;

		.submit-btn {
			flex: 1;
			padding: 1.5rem 2rem;
			font-size: 1.1rem;
			margin: 0;
		}

		.clear-btn {
			padding: 0 2rem;
			background: transparent;
			border: 1px solid var(--border-glass);
			color: var(--text-muted);
			border-radius: var(--radius-md);
			font-weight: 600;
			cursor: pointer;
			transition: all 0.2s;

			&:hover {
				background: rgba(var(--text-primary-rgb), 0.05);
				color: var(--text-primary);
			}

			&:disabled {
				opacity: 0.5;
				cursor: not-allowed;
			}
		}
	}
</style>
