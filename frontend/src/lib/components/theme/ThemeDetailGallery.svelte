<script lang="ts">
    import { fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import type { Theme } from "$lib/types/index";

    let {
        theme,
    }: {
        theme: Theme | null;
    } = $props();

    let activeSlide = $state(0);
    let direction = $state<"next" | "prev">("next");

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
            direction = "prev";
            activeSlide =
                (activeSlide - 1 + allImages.length) % allImages.length;
        }
    }

    function nextSlide() {
        if (allImages.length > 0) {
            direction = "next";
            activeSlide = (activeSlide + 1) % allImages.length;
        }
    }

    function goToSlide(index: number) {
        if (index === activeSlide) return;
        direction = index > activeSlide ? "next" : "prev";
        activeSlide = index;
    }

    function handleKeydown(event: KeyboardEvent) {
        if (allImages.length <= 1) return;
        if (event.key === "ArrowLeft") {
            prevSlide();
        } else if (event.key === "ArrowRight") {
            nextSlide();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="slider glass-panel" role="region" aria-label="Theme image gallery">
    {#if allImages.length > 0}
        <div class="slides">
            {#key activeSlide}
                <img
                    src={allImages[activeSlide]}
                    alt={theme?.themeName}
                    in:fly={{
                        x: direction === "next" ? 120 : -120,
                        duration: 350,
                        easing: cubicOut,
                        opacity: 0,
                    }}
                    out:fly={{
                        x: direction === "next" ? -120 : 120,
                        duration: 350,
                        easing: cubicOut,
                        opacity: 0,
                    }}
                />
            {/key}
        </div>
        {#if allImages.length > 1}
            <button
                class="slider-btn prev"
                aria-label="Previous image"
                onclick={prevSlide}
            >
                ‹
            </button>
            <button
                class="slider-btn next"
                aria-label="Next image"
                onclick={nextSlide}
            >
                ›
            </button>
            <div class="dots">
                {#each allImages as _, i}
                    <button
                        class="dot"
                        aria-label="Image {i + 1}"
                        class:active={i === activeSlide}
                        onclick={() => goToSlide(i)}
                    ></button>
                {/each}
            </div>
        {/if}
    {:else if theme}
        <div class="no-image">
            <span class="premium-font">{theme.themeName.charAt(0)}</span>
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
            position: relative;
            width: 100%;
            height: 100%;
            overflow: hidden;

            img {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                will-change: transform, opacity;
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
            background: rgba(15, 15, 25, 0.65);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid var(--border-glass);
            color: white;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            font-size: 1.6rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            line-height: 1;
            z-index: 10;
            user-select: none;

            &:hover {
                background: rgba(var(--text-primary-rgb), 0.2);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-50%) scale(1.1);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            }

            &:active {
                transform: translateY(-50%) scale(0.92);
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
            align-items: center;
            background: rgba(10, 10, 20, 0.5);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            padding: 6px 14px;
            border-radius: 20px;
            border: 1px solid var(--border-glass);
            z-index: 10;

            .dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.35);
                border: none;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

                &:hover {
                    background: rgba(255, 255, 255, 0.7);
                    transform: scale(1.25);
                }

                &.active {
                    width: 20px;
                    border-radius: 10px;
                    background: var(--text-primary);
                    box-shadow: 0 0 10px rgba(var(--text-primary-rgb), 0.5);
                }
            }
        }
    }
</style>
