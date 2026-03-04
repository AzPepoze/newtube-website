<script lang="ts">
	import "../app.scss";
	import { onMount } from "svelte";
	import { fade, fly } from "svelte/transition";
	import { getSessionId, clearSessionId, handleAuthError } from "$lib/auth";
	import UserIcon from "$lib/icons/UserIcon.svelte";
	import LogoutIcon from "$lib/icons/LogoutIcon.svelte";
	import SunIcon from "$lib/icons/SunIcon.svelte";
	import MoonIcon from "$lib/icons/MoonIcon.svelte";
	import GithubIcon from "$lib/icons/GithubIcon.svelte";
	import HomeIcon from "$lib/icons/HomeIcon.svelte";
	import CompassIcon from "$lib/icons/CompassIcon.svelte";
	import ScaleIcon from "$lib/icons/ScaleIcon.svelte";
	import ShieldIcon from "$lib/icons/ShieldIcon.svelte";
	import CustomDropdown from "$lib/components/CustomDropdown.svelte";
	import Modal from "$lib/components/Modal.svelte";
	import { updateTheme } from "$lib/theme.svelte";

	let { children } = $props();

	interface User {
		id: string;
		name: string;
		avatarUrl: string;
		createdAt: string;
	}

	import { PUBLIC_API_URL } from "$lib/constants";

	let currentUser = $state<User | null>(null);
	let isLightMode = $state(false);
	let isClient = $state(false);

	onMount(async () => {
		isClient = true;
		// Initialize theme
		const savedTheme = localStorage.getItem("theme");
		isLightMode = savedTheme === "light";
		updateTheme(isLightMode);
		updateThemeClass();

		const urlParams = new URL(window.location.href).searchParams;
		const urlSessionId = urlParams.get("sessionId");
		if (urlSessionId) {
			document.cookie = `sessionId=${encodeURIComponent(urlSessionId)}; path=/; max-age=2592000`;
			urlParams.delete("sessionId");
			const newUrl =
				window.location.pathname +
				(urlParams.toString() ? "?" + urlParams.toString() : "");
			window.history.replaceState({}, "", newUrl);
		}

		const sessionId = getSessionId();
		if (!sessionId) return;
		try {
			const response = await fetch(`${PUBLIC_API_URL}/users/me`, {
				credentials: "include",
			});
			if (response.ok) {
				currentUser = await response.json();
			} else if (response.status === 404 || response.status === 401) {
				handleAuthError();
			}
		} catch {
			// unauthenticated
		}
	});

	function toggleTheme() {
		isLightMode = !isLightMode;
		localStorage.setItem("theme", isLightMode ? "light" : "dark");
		updateTheme(isLightMode);
		updateThemeClass();
	}

	function updateThemeClass() {
		if (typeof document !== "undefined") {
			if (isLightMode) {
				document.documentElement.classList.add("light");
			} else {
				document.documentElement.classList.remove("light");
			}
		}
	}

	function handleLogout() {
		clearSessionId();
		currentUser = null;
		window.location.href = "/";
	}
</script>

<svelte:head>
	<title>NewTube Discover</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;600;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app-container">
	{#if !isClient}
		<div class="loading-screen">
			<div class="spinner"></div>
		</div>
	{:else}
		<nav
			class="glass-panel"
			in:fly={{ y: -100, delay: 200, duration: 1000 }}
		>
			<div class="nav-left">
				<a href="/" class="logo-link" in:fade={{ duration: 200 }}>
					<img src="/logo.png" alt="NewTube" class="logo-img" />
				</a>
				<div class="nav-links">
					<a href="/" aria-label="Home" title="Home">
						<HomeIcon size={24} />
					</a>
					<a
						href="/discover"
						aria-label="Discover"
						title="Discover"
					>
						<CompassIcon size={24} />
					</a>
					<a href="/terms" aria-label="Terms" title="Terms">
						<ScaleIcon size={24} />
					</a>
					<a
						href="/privacy"
						aria-label="Privacy"
						title="Privacy"
					>
						<ShieldIcon size={24} />
					</a>
				</div>
			</div>

			<div class="nav-right">
				<a
					href="https://github.com/AzPepoze/NewTube"
					target="_blank"
					rel="noopener noreferrer"
					class="github-link"
					aria-label="GitHub Repository"
				>
					<GithubIcon size={24} />
				</a>

				<button
					class="theme-toggle"
					onclick={toggleTheme}
					aria-label="Toggle theme"
				>
					{#if isLightMode}
						<MoonIcon size={22} />
					{:else}
						<SunIcon size={22} />
					{/if}
				</button>

				<div class="auth-section">
					{#if currentUser}
						<div class="profile-menu">
							{#snippet trigger(toggle: () => void)}
								<button
									class="user-profile glass-panel"
									aria-label="User menu"
									onclick={toggle}
								>
									{#if currentUser?.avatarUrl}
										<img
											src={currentUser.avatarUrl}
											alt={currentUser.name}
											class="avatar"
										/>
									{:else}
										<div
											class="avatar avatar-fallback"
										>
											{currentUser?.name.charAt(
												0,
											)}
										</div>
									{/if}
									<span class="chevron">▾</span>
								</button>
							{/snippet}

							<CustomDropdown
								{trigger}
								mode="menu"
								options={[
									{
										label: "Your Profile",
										icon: UserIcon,
										href: "/profile",
									},
									{
										label: "Logout",
										icon: LogoutIcon,
										class: "logout-item",
										color: "#ff4d4d",
										onClick: handleLogout,
									},
								]}
							/>
						</div>
					{:else}
						<a
							href="/login"
							class="login-btn premium-button glass-panel"
							>Login</a
						>
					{/if}
				</div>
			</div>
		</nav>
	{/if}

	<main>
		{@render children()}
	</main>

	<Modal />
</div>

<style lang="scss">
	.app-container {
		min-height: 100vh;
		padding: 1.5rem 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	nav {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.4rem 1.5rem;
		margin-bottom: 3rem;
		border-radius: var(--radius-md);
		z-index: 1000;
		position: sticky;
		top: 1.5rem;
		background: var(--bg-dark);
		border: 1px solid var(--border-glass);

		:global(.light) & {
			background: #ffffff;
			border-color: rgba(0, 0, 0, 0.1);
		}

		.nav-left,
		.nav-right {
			display: flex;
			align-items: center;
			gap: 2.5rem;
		}

		.logo-img {
			height: 60px;
			width: auto;
			display: block;
			transition: filter 0.3s ease;

			:global(.light) & {
				filter: none;
			}
		}

		.logo-link:hover .logo-img {
			animation: logo-rotate 3s linear infinite;
		}

		@keyframes logo-rotate {
			from {
				transform: rotate(0deg);
			}
			to {
				transform: rotate(360deg);
			}
		}

		.nav-links {
			display: flex;
			gap: 1.5rem;

			a {
				font-size: 1.1rem;
				font-weight: 600;
				color: var(--text-secondary);
				transition: all 0.2s;

				&:hover {
					color: var(--primary-glow);
					transform: translateY(-5px);
				}
			}
		}

		.nav-right {
			gap: 1.25rem;

			.github-link {
				color: var(--text-primary);
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0.5rem;
				border-radius: 50%;
				transition: all 0.2s;
				opacity: 0.8;

				&:hover {
					opacity: 1;
					background: rgba(var(--text-primary-rgb), 0.05);
					transform: scale(1.1);
				}
			}

			.theme-toggle {
				background: transparent;
				border: none;
				color: var(--text-primary);
				cursor: pointer;
				display: flex;
				align-items: center;
				justify-content: center;
				padding: 0.5rem;
				border-radius: 50%;
				transition: all 0.2s;

				&:hover {
					background: rgba(
						var(--text-primary-rgb, 128, 128, 128),
						0.05
					);
					color: var(--text-primary);
				}
			}

			.auth-section {
				.login-btn {
					padding: 10px 22px;
					font-size: 1rem;
				}
			}
		}
	}

	.profile-menu {
		position: relative;

		.user-profile {
			background: transparent;
			border: none;
			display: flex;
			align-items: center;
			gap: 1rem;
			cursor: pointer;
			padding: 6px;
			border-radius: var(--radius-lg);
			transition: background 0.2s;

			&:hover {
				background: rgba(var(--text-primary-rgb), 0.05);

				:global(.light) & {
					background: rgba(0, 0, 0, 0.03);
				}
			}

			.avatar {
				width: 40px;
				height: 40px;
				border-radius: 50%;
				object-fit: cover;
				border: 1px solid var(--border-glass);
			}

			.avatar-fallback {
				width: 40px;
				height: 40px;
				border-radius: 50%;
				background: var(--text-primary);
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--bg-dark);
				font-weight: 700;
				font-size: 1.1rem;
			}

			.chevron {
				font-size: 0.7rem;
				color: var(--text-primary);
				transition: transform 0.2s;
			}
		}
	}

	main {
		animation: contentFade 0.6s ease-out;
		flex: 1;
	}

	@keyframes contentFade {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 768px) {
		.nav-links {
			display: none;
		}
	}
</style>
