<script lang="ts">
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";

	let visible = $state(false);

	onMount(() => {
		visible = true;
	});
</script>

<div class="welcome-container">
	{#if visible}
		<section class="hero" in:fly={{ y: 30, duration: 800, delay: 200 }}>
			<div class="hero-content">
				<div class="hero-logo-container">
					<img
						src="/logo-big.png"
						alt="NewTube logo"
						class="hero-logo"
					/>
				</div>
				<h1 class="premium-font">
					Discover / Create <br />
					Your <span class="glow">NewTube</span> Experience
				</h1>

				<div class="cta-group">
					<a href="/discover" class="primary-cta premium-button"
						>Explore Discover</a
					>
					<a
						href="/themes/create"
						class="secondary-cta premium-button glass-panel"
						>Create Your Own</a
					>
				</div>
			</div>
		</section>
	{/if}
</div>

<style lang="scss">
	.welcome-container {
		display: flex;
		flex-direction: column;
		gap: 6rem;
	}

	.hero {
		display: flex;
		justify-content: center;
		text-align: center;

		.hero-logo-container {
			margin-bottom: 2.5rem;
			display: flex;
			justify-content: center;
			animation: logoFloat 4s ease-in-out infinite;
			position: relative;

			&::after {
				content: "";
				position: absolute;
				top: 50%;
				left: 50%;
				transform: translate(-50%, -50%);
				width: 200px;
				height: 200px;
				background: radial-gradient(
					circle,
					rgba(255, 255, 255, 0.1) 0%,
					transparent 70%
				);
				z-index: -1;

				:global(.light) & {
					background: radial-gradient(
						circle,
						rgba(0, 0, 0, 0.05) 0%,
						transparent 70%
					);
				}
			}
		}

		.hero-logo {
			height: 220px;
			width: auto;
			transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

			&:hover {
				transform: scale(1.05) rotate(2deg);
			}

			:global(.light) & {
				filter: none;
			}

			@media (max-width: 768px) {
				height: 120px;
			}
		}

		@keyframes logoFloat {
			0%,
			100% {
				transform: translateY(0);
			}
			50% {
				transform: translateY(-10px);
			}
		}

		h1 {
			font-size: 5rem;
			line-height: 1;
			margin-bottom: 2rem;
			font-weight: 800;

			font-weight: 800;

			@media (max-width: 768px) {
				font-size: 3.5rem;
			}
		}

		.cta-group {
			display: flex;
			gap: 1.5rem;
			justify-content: center;
		}

		.primary-cta {
			padding: 18px 48px;
			font-size: 1.2rem;
			background: var(--text-primary);
			color: var(--bg-dark);
		}

		.secondary-cta {
			padding: 18px 48px;
			font-size: 1.2rem;
			color: var(--text-primary);
		}
	}
</style>
