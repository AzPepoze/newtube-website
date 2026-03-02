<script lang="ts">
	import "../app.scss";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";
	import { env } from "$env/dynamic/public";
	import { getUserId, clearUserId } from "$lib/auth";
	import UserIcon from "$lib/icons/UserIcon.svelte";
	import SparkleIcon from "$lib/icons/SparkleIcon.svelte";
	import LogoutIcon from "$lib/icons/LogoutIcon.svelte";
	import SunIcon from "$lib/icons/SunIcon.svelte";
	import MoonIcon from "$lib/icons/MoonIcon.svelte";
	import CustomDropdown from "$lib/components/CustomDropdown.svelte";

	let { children } = $props();

	interface User {
		id: string;
		name: string;
		avatar_url: string;
		created_at: string;
	}

	const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

	let currentUser = $state<User | null>(null);
	let dropdownOpen = $state(false);
	let isLightMode = $state(false);

	onMount(async () => {
		// Initialize theme
		const savedTheme = localStorage.getItem("theme");
		isLightMode = savedTheme === "light";
		updateThemeClass();

		const userId = getUserId();
		if (!userId) return;
		try {
			const response = await fetch(`${PUBLIC_API_URL}/me`, {
				credentials: "include",
			});
			if (response.ok) {
				currentUser = await response.json();
			}
		} catch {
			// unauthenticated
		}
	});

	function toggleTheme() {
		isLightMode = !isLightMode;
		localStorage.setItem("theme", isLightMode ? "light" : "dark");
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
		clearUserId();
		currentUser = null;
		dropdownOpen = false;
		window.location.href = "/";
	}
</script>

<svelte:head>
	<title>NewTube Theme Store</title>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="" />
	<link
		href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;600;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

<div class="app-container">
	<nav class="glass-panel">
		<div class="nav-left">
			<a href="/" class="logo-link">
				<img src="/logo.png" alt="NewTube" class="logo-img" />
			</a>
			<div class="nav-links">
				<a href="/store">Store</a>
			</div>
		</div>

		<div class="nav-right">
			<button
				class="theme-toggle"
				onclick={toggleTheme}
				aria-label="Toggle theme"
			>
				{#if isLightMode}
					<MoonIcon size={18} />
				{:else}
					<SunIcon size={18} />
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
								{#if currentUser?.avatar_url}
									<img
										src={currentUser.avatar_url}
										alt={currentUser.name}
										class="avatar"
									/>
								{:else}
									<div class="avatar avatar-fallback">
										{currentUser?.name.charAt(0)}
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
									label: "Your Theme",
									icon: SparkleIcon,
									href: "/themes/create",
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
					<a href="/login" class="login-btn">Login</a>
				{/if}
			</div>
		</div>
	</nav>

	<main>
		{@render children()}
	</main>
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
		padding: 1rem 2rem;
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
			gap: 2rem;
		}

		.logo-img {
			height: 32px;
			width: auto;
			display: block;
			filter: brightness(0) invert(1);

			:global(.light) & {
				filter: none;
			}
		}

		.nav-links {
			display: flex;
			gap: 1.5rem;

			a {
				font-size: 0.9rem;
				font-weight: 600;
				color: var(--text-secondary);
				transition: color 0.2s;

				&:hover {
					color: var(--primary-glow);
				}
			}
		}

		.nav-right {
			gap: 1.25rem;
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
				background: rgba(var(--text-primary-rgb, 128, 128, 128), 0.05);
				color: var(--text-primary);
			}
		}
	}

	.auth-section {
		.login-btn {
			@include premium-button;
			@include glassmorphism;
			padding: 8px 18px;
			font-size: 0.85rem;
		}
	}

	.profile-menu {
		position: relative;

		.user-profile {
			background: transparent;
			border: none;
			display: flex;
			align-items: center;
			gap: 0.75rem;
			cursor: pointer;
			padding: 4px;
			border-radius: var(--radius-lg);
			transition: background 0.2s;

			&:hover {
				background: rgba(var(--text-primary-rgb), 0.05);

				:global(.light) & {
					background: rgba(0, 0, 0, 0.03);
				}
			}

			.avatar {
				width: 32px;
				height: 32px;
				border-radius: 50%;
				object-fit: cover;
				border: 1px solid var(--border-glass);
			}

			.avatar-fallback {
				width: 32px;
				height: 32px;
				border-radius: 50%;
				background: var(--text-primary);
				display: flex;
				align-items: center;
				justify-content: center;
				color: var(--bg-dark);
				font-weight: 700;
				font-size: 0.9rem;
			}

			.chevron {
				font-size: 0.7rem;
				color: var(--text-primary);
				transition: transform 0.2s;

				&.open {
					transform: rotate(180deg);
				}
			}
		}

		.dropdown-header-item {
			pointer-events: none;
			border-bottom: 1px solid var(--border-glass);
			margin-bottom: 0.5rem;
			color: var(--text-primary) !important;
			opacity: 1 !important;
		}

		.logout-item {
			border-top: 1px solid var(--border-glass);
			margin-top: 0.5rem;
			padding-top: 1rem !important;
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
		.nav-links,
		.nav-search {
			display: none;
		}
	}
</style>
