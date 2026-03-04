<script lang="ts">
	import { fade } from "svelte/transition";
	import type { Theme } from "$lib/types";

	let {
		theme,
	}: {
		theme: Theme | null;
	} = $props();

	let activeSlide = $state(0);

	const allImages = $derived.by(() => {
		if (!theme) return [];
		const images = [...(theme.images || [])];
		if (theme.coverImage && !images.includes(theme.coverImage)) {
			images.unshift(theme.coverImage);
		}
		return images;
	});

	function prevSlide() {
		if (allImages.length > 0) {
			activeSlide =
				(activeSlide - 1 + allImages.length) % allImages.length;
		}
	}

	function nextSlide() {
		if (allImages.length > 0) {
			activeSlide = (activeSlide + 1) % allImages.length;
		}
	}
</script>

<div class="slider glass-panel">
	{#if allImages.length > 0}
		<div class="slides">
			<img
				src={allImages[activeSlide]}
				alt={theme?.name}
				in:fade={{ duration: 200 }}
			/>
		</div>
		{#if allImages.length > 1}
			<button
				class="slider-btn prev"
				aria-label="Previous image"
				onclick={prevSlide}>‹</button
			>
			<button
				class="slider-btn next"
				aria-label="Next image"
				onclick={nextSlide}>›</button
			>
			<div class="dots">
				{#each allImages as _, i}
					<button
						class="dot"
						aria-label="Image {i + 1}"
						class:active={i === activeSlide}
						onclick={() => (activeSlide = i)}
					></button>
				{/each}
			</div>
		{/if}
	{:else if theme}
		<div class="no-image">
			<span class="premium-font">{theme.name.charAt(0)}</span>
		</div>
	{/if}
</div>

<style lang="scss">
	.slider {
		position: relative;
		border-radius: var(--radius-md);
		overflow: hidden;
		aspect-ratio: 16/9;
		background: rgba(0, 0, 0, 0.3);

		.slides {
			width: 100%;
			height: 100%;

			img {
				width: 100%;
				height: 100%;
				object-fit: cover;
				display: block;
			}
		}

		.no-image {
			width: 100%;
			height: 100%;
			display: flex;
			align-items: center;
			justify-content: center;
			font-size: 5rem;
			color: var(--text-muted);
			background: linear-gradient(135deg, var(--bg-dark), #1a1a24);
		}

		.slider-btn {
			position: absolute;
			top: 50%;
			transform: translateY(-50%);
			background: rgba(0, 0, 0, 0.6);
			border: 1px solid var(--border-glass);
			color: white;
			width: 40px;
			height: 40px;
			border-radius: 50%;
			font-size: 1.5rem;
			cursor: pointer;
			display: flex;
			align-items: center;
			justify-content: center;
			transition: all 0.2s;
			line-height: 1;

			&:hover {
				background: rgba(var(--text-primary-rgb), 0.3);
			}
			&.prev {
				left: 1rem;
			}
			&.next {
				right: 1rem;
			}
		}

		.dots {
			position: absolute;
			bottom: 1rem;
			left: 50%;
			transform: translateX(-50%);
			display: flex;
			gap: 0.5rem;

			.dot {
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background: rgba(255, 255, 255, 0.3);
				border: none;
				cursor: pointer;
				transition: all 0.2s;

				&.active {
					background: var(--primary-glow);
					transform: scale(1.3);
				}
			}
		}
	}
</style>
