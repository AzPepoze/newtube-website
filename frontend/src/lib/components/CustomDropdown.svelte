<script lang="ts">
	import { fade, slide, fly } from "svelte/transition";
	import { onMount, type Snippet } from "svelte";

	interface Option {
		value?: string;
		label: string;
		icon?: any;
		href?: string;
		onClick?: () => void;
		class?: string;
		color?: string; // New: Custom text color (e.g. "red" or "var(--error)")
	}

	let {
		options,
		value = $bindable(),
		placeholder = "Select an option",
		mode = "select", // "select" or "menu"
		trigger = null, // Custom trigger snippet
	} = $props<{
		options: Option[];
		value?: string;
		placeholder?: string;
		mode?: "select" | "menu";
		trigger?: Snippet<[toggle: () => void]>;
	}>();

	let isOpen = $state(false);
	let container: HTMLElement;

	const selectedLabel = $derived(
		options.find((opt: Option) => opt.value === value)?.label ||
			placeholder,
	);

	function toggle() {
		isOpen = !isOpen;
	}

	function select(option: Option) {
		if (option.onClick) {
			option.onClick();
		} else if (option.value !== undefined) {
			value = option.value;
		}
		isOpen = false;
	}

	function handleOutsideClick(e: MouseEvent) {
		if (isOpen && container && !container.contains(e.target as Node)) {
			isOpen = false;
		}
	}

	onMount(() => {
		window.addEventListener("click", handleOutsideClick);
		return () => window.removeEventListener("click", handleOutsideClick);
	});
</script>

<div class="dropdown-container" bind:this={container}>
	{#if trigger}
		{@render trigger(toggle)}
	{:else}
		<button
			type="button"
			class="dropdown-trigger glass-panel"
			onclick={toggle}
			aria-haspopup="listbox"
			aria-expanded={isOpen}
		>
			<span class="label">{selectedLabel}</span>
			<span class="chevron" class:open={isOpen}>▾</span>
		</button>
	{/if}

	{#if isOpen}
		<div
			class="dropdown-menu glass-panel"
			transition:slide={{ duration: 250 }}
			role="listbox"
		>
			{#each options as option, i}
				<div
					in:fly={{
						x: -15,
						duration: 300,
						delay: i * 50,
						opacity: 0,
					}}
					class="option-row"
				>
					{#if option.href}
						<a
							href={option.href}
							class="dropdown-item {option.class || ''}"
							class:active={mode === "select" &&
								value !== undefined &&
								value === option.value}
							style={option.color
								? `color: ${option.color}`
								: ""}
							onclick={() => select(option)}
						>
							{#if option.icon}
								<span class="icon">
									<option.icon size={18} />
								</span>
							{/if}
							<span class="text">{option.label}</span>
						</a>
					{:else}
						<button
							type="button"
							class="dropdown-item {option.class || ''}"
							class:active={mode === "select" &&
								value !== undefined &&
								value === option.value}
							style={option.color
								? `color: ${option.color}`
								: ""}
							onclick={() => select(option)}
							role="option"
							aria-selected={mode === "select" &&
								value !== undefined &&
								value === option.value}
						>
							<div
								class="item-content"
								style={option.color
									? `color: ${option.color}`
									: ""}
							>
								{#if option.icon}
									<span class="icon">
										<option.icon size={18} />
									</span>
								{/if}
								<span class="text">{option.label}</span>
							</div>
							{#if mode === "select" && value === option.value}
								<span class="check" in:fade>✓</span>
							{/if}
						</button>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	.dropdown-container {
		position: relative;
	}

	.dropdown-trigger {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
		padding: 0.6rem 1.2rem;
		background: rgba(var(--text-primary-rgb), 0.05);
		border: 1px solid var(--border-glass);
		border-radius: var(--radius-sm);
		color: var(--text-primary);
		cursor: pointer;
		font-family: inherit;
		font-size: 0.95rem;
		transition: all 0.2s;

		:global(.light) & {
			background: #ffffff;
			border-color: rgba(0, 0, 0, 0.1);
		}

		&:hover {
			background: rgba(var(--text-primary-rgb), 0.08);
			border-color: rgba(var(--text-primary-rgb), 0.2);

			:global(.light) & {
				background: #ffffff;
				border-color: rgba(0, 0, 0, 0.2);
			}
		}

		.chevron {
			font-size: 0.7rem;
			transition: transform 0.2s;
			&.open {
				transform: rotate(180deg);
			}
		}
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		min-width: 220px;
		width: max-content;
		z-index: 1000;
		padding: 0.5rem;
		overflow: hidden;
		border: 1px solid var(--border-glass);
		box-shadow: var(--shadow-glow);

		:global(.light) & {
			background: #ffffff;
			border-color: rgba(0, 0, 0, 0.1);
			backdrop-filter: none;
		}
	}

	.dropdown-item {
		width: 100%;
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border: none;
		background: transparent;
		color: var(--text-secondary);
		font-size: 1rem;
		font-weight: 600;
		text-align: left;
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all 0.2s;
		text-decoration: none;

		&:hover {
			background: rgba(var(--text-primary-rgb), 0.05);
			color: var(--text-primary);

			:global(.light) & {
				background: rgba(0, 0, 0, 0.03);
			}
		}

		&.active {
			background: rgba(var(--text-primary-rgb), 0.1);
			color: var(--text-primary);

			:global(.light) & {
				background: rgba(0, 0, 0, 0.05);
			}
		}

		.item-content {
			display: flex;
			align-items: center;
			gap: 1rem;
		}

		.icon {
			display: flex;
			align-items: center;
			opacity: 0.8;
		}

		.check {
			font-size: 0.8rem;
		}
	}
</style>
