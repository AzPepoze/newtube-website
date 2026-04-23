<script lang="ts">
	import { onMount } from "svelte";
	import { fly } from "svelte/transition";
	import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

	import { PUBLIC_API_URL } from "$lib/constants/index";
	import { extensionState } from "$lib/core/extension.svelte";

	let visible = $state(false);

	let sponsors = $state<{ name: string; avatar: string; link: string }[]>([]);

	onMount(async () => {
		visible = true;
		try {
			const response = await fetch(`${PUBLIC_API_URL}/sponsors`);
			if (response.ok) {
				sponsors = await response.json();
			}
		} catch (e) {
			console.error("Failed to fetch sponsors", e);
		}
	});
</script>

<svelte:head>
	<title>NewTube - Enhance Your YouTube Experience</title>
</svelte:head>

<div class="welcome-container">
	{#if visible}
		<section class="hero" in:fly={{ y: 30, duration: 800 }}>
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
					{#if extensionState.isExtensionReady}
						<a href="/discover" class="primary-cta premium-button"
							>Explore Themes</a
						>
						<a
							href="/themes/create"
							class="secondary-cta premium-button glass-panel"
							>Create Theme</a
						>
					{:else}
						<div class="install-grid">
							<a
								href="https://chromewebstore.google.com/detail/newtube-youtube-customize/dnjjchajjdnfbjhjclmilicgheglcopj"
								target="_blank"
								class="install-card glass-panel chrome-badge"
							>
								<div class="card-glow"></div>
								<div class="badge-content">
									<div class="logo-stack">
										<div class="browser-icon chrome"></div>
									</div>
									<div class="install-info">
										<h3>Chrome / Edge</h3>
										<p>Available on Chrome Web Store</p>
									</div>
									<div class="download-badge">
										<MaterialIcon name="download" size={20} />
									</div>
								</div>
							</a>
							<a
								href="https://addons.mozilla.org/en-US/firefox/addon/newtube-youtubestylecustomizer/"
								target="_blank"
								class="install-card glass-panel firefox-badge"
							>
								<div class="card-glow"></div>
								<div class="badge-content">
									<div class="logo-stack">
										<div class="browser-icon firefox"></div>
									</div>
									<div class="install-info">
										<h3>Firefox</h3>
										<p>Available on Firefox Add-ons</p>
									</div>
									<div class="download-badge">
										<MaterialIcon name="download" size={20} />
									</div>
								</div>
							</a>
						</div>
					{/if}
				</div>
			</div>
		</section>

		<section
			class="sponsor-section"
			in:fly={{ y: 30, duration: 800, delay: 400 }}
		>
			<div class="sponsor-header">
				<MaterialIcon name="favorite" size={32} color="#ff4d4d" />
				<h2 class="premium-font">My Awesome Sponsors</h2>
			</div>

			<div class="sponsors-flex">
				{#if sponsors.length === 0}
					<div
						class="no-sponsors-message"
						in:fly={{ y: 20, duration: 600 }}
					>
						<p>
							No sponsors yet... <span class="highlight"
								>become the first one!</span
							>
						</p>
					</div>
				{:else}
					{#each sponsors as sponsor}
						<a
							href={sponsor.link}
							target="_blank"
							class="sponsor-avatar-link"
							title={sponsor.name}
						>
							<img
								src={sponsor.avatar}
								alt={sponsor.name}
								class="sponsor-avatar"
							/>
						</a>
					{/each}
				{/if}
			</div>

			<a
				href="https://github.com/sponsors/AzPepoze"
				target="_blank"
				class="sponsor-add-btn"
			>
				<img
					src="https://media.tenor.com/XmUpFK6JyU8AAAAj/cute-please.gif"
					alt="become sponsor"
					class="btn-gif-icon"
				/>
				<span>Become a Sponsor</span>
			</a>

			<p class="sponsor-text">
				NewTube is free and open source. Your support helps me keep the
				project alive and bring more features.
			</p>
		</section>

		<footer class="home-footer">
			<div class="footer-bottom">
				<p>
					&copy; {new Date().getFullYear()} NewTube. Open Source on GitHub.
				</p>
			</div>
		</footer>
	{/if}
</div>

<style lang="scss">
	.welcome-container {
		display: flex;
		flex-direction: column;
		gap: 8rem;
		padding-bottom: 4rem;
	}

	.hero {
		display: flex;
		justify-content: center;
		text-align: center;
		padding: 4rem 0;

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
			line-height: 1.1;
			margin-bottom: 1.5rem;
			font-weight: 800;

			.glow {
				background: var(--primary-glow);
				-webkit-background-clip: text;
				background-clip: text;
				-webkit-text-fill-color: transparent;
				filter: drop-shadow(
					0 0 10px rgba(var(--text-primary-rgb), 0.3)
				);
			}

			@media (max-width: 768px) {
				font-size: 3rem;
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
			border: none;
		}

		.secondary-cta {
			padding: 18px 48px;
			font-size: 1.2rem;
			color: var(--text-primary);
		}
	}

	.install-grid {
		display: flex;
		justify-content: center;
		gap: 2rem;
		flex-wrap: wrap;
		max-width: 1000px;
		margin: 2rem auto 0;
	}

	.install-card {
		position: relative;
		display: flex;
		align-items: center;
		padding: 1.5rem 2rem;
		min-width: 280px;
		overflow: hidden;
		transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
		text-align: left;
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-glass);
		background: var(--bg-glass);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

		&:hover {
			border-color: rgba(var(--text-primary-rgb), 0.3);
			box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);

			.card-glow {
				opacity: 1;
			}

			.download-badge {
				background: var(--text-primary);
				color: var(--bg-dark);
				transform: translateX(5px);
			}
		}

		.card-glow {
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background: radial-gradient(
				circle at center,
				rgba(var(--text-primary-rgb), 0.05) 0%,
				transparent 70%
			);
			opacity: 0;
			transition: opacity 0.4s ease;
			pointer-events: none;
		}

		&.chrome-badge:hover .card-glow {
			background: radial-gradient(
				circle at center,
				rgba(214, 244, 66, 0.1) 0%,
				transparent 70%
			);
		}

		&.firefox-badge:hover .card-glow {
			background: radial-gradient(
				circle at center,
				rgba(255, 113, 0, 0.1) 0%,
				transparent 70%
			);
		}

		.badge-content {
			display: flex;
			align-items: center;
			gap: 1.5rem;
			width: 100%;
			z-index: 1;
		}

		.logo-stack {
			position: relative;
			display: flex;
			align-items: center;
			justify-content: center;
			width: 48px;
			height: 48px;

			.browser-icon {
				width: 40px;
				height: 40px;
				background-size: contain;
				background-repeat: no-repeat;
				background-position: center;
				filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
				transition: transform 0.4s ease;

				&.chrome {
					background-image: url("https://upload.wikimedia.org/wikipedia/commons/e/e1/Google_Chrome_icon_%28February_2022%29.svg");
				}

				&.firefox {
					background-image: url("https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg");
				}
			}
		}

		.install-info {
			flex: 1;

			h3 {
				margin: 0;
				font-size: 1.2rem;
				font-weight: 700;
				color: var(--text-primary);
			}

			p {
				margin: 4px 0 0;
				font-size: 0.8rem;
				color: var(--text-secondary);
			}
		}

		.download-badge {
			width: 36px;
			height: 36px;
			display: flex;
			align-items: center;
			justify-content: center;
			border-radius: 50%;
			background: rgba(var(--text-primary-rgb), 0.1);
			color: var(--text-primary);
			transition: all 0.3s ease;
		}
	}

	.sponsor-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 3rem;
		padding: 4rem 2rem;
		text-align: center;

		.sponsor-header {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 1rem;

			h2 {
				font-size: 2.5rem;
				margin: 0;
			}
		}

		.sponsors-flex {
			display: flex;
			flex-wrap: wrap;
			justify-content: center;
			gap: 1.5rem;
			max-width: 1000px;

			.sponsor-avatar-link {
				transition: transform 0.3s ease;

				&:hover {
					transform: scale(1.1) translateY(-5px);
				}
			}

			.sponsor-avatar {
				width: 72px;
				height: 72px;
				border-radius: 50%;
				border: 2px solid var(--border-glass);
				background: var(--bg-glass);
				object-fit: cover;
				box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
			}
		}

		.sponsor-add-btn {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding: 16px 42px;
			border-radius: 100px;
			border: 1px solid var(--border-glass);
			background: var(--bg-glass);
			color: var(--text-primary);
			font-weight: 700;
			transition: all 0.3s ease;
			text-decoration: none;
			box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

			&:hover {
				transform: translateY(-3px) scale(1.02);
				border-color: var(--primary-glow);
				background: rgba(var(--text-primary-rgb), 0.05);
				box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
			}

			span {
				font-size: 1.4rem;
			}
		}

		.sponsor-text {
			font-size: 1.2rem;
			color: var(--text-secondary);
			max-width: 600px;
			line-height: 1.6;
			margin: 0;
		}

		.no-sponsors-message {
			padding: 2rem;
			background: var(--bg-glass);
			border: 1px dashed var(--border-glass);
			border-radius: var(--radius-lg);

			p {
				font-size: 1.2rem;
				color: var(--text-secondary);
				margin: 0;

				.highlight {
					color: var(--text-primary);
					font-weight: 700;
					text-decoration: underline;
					text-decoration-color: var(--primary-glow);
					text-underline-offset: 4px;
				}
			}
		}

		.btn-gif-icon {
			width: 100px;
			height: 100px;
			border-radius: 6px;
			object-fit: cover;
		}
	}

	.home-footer {
		margin-top: 4rem;
		padding: 2rem 0;
		border-top: 1px solid var(--border-glass);
		text-align: center;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.welcome-container {
			gap: 4rem;
		}
		.hero h1 {
			font-size: 2.5rem;
		}
		.hero .hero-logo {
			height: 120px;
		}
		.hero .primary-cta,
		.hero .secondary-cta {
			padding: 14px 28px;
			font-size: 1rem;
		}
		.install-grid .install-card {
			padding: 1.5rem;
		}
		.sponsor-section {
			padding: 2rem 1rem;
			h2 {
				font-size: 2rem;
			}
			.sponsor-avatar {
				width: 56px;
				height: 56px;
			}
			.sponsor-add-btn {
				padding: 10px 20px;
				font-size: 0.9rem;
			}
		}
	}
</style>
