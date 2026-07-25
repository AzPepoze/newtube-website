<script lang="ts">
	import { fade, scale } from "svelte/transition";
	import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";

	let {
		show = $bindable(false),
		rawInputCode = $bindable(""),
		onApply,
	}: {
		show: boolean;
		rawInputCode: string;
		onApply: () => void;
	} = $props();
</script>

{#if show}
	<div class="modal-backdrop" in:fade={{ duration: 150 }}>
		<div
			class="modal-card glass-panel"
			in:scale={{ start: 0.95, duration: 200 }}
		>
			<div class="modal-header">
				<h3>Input Theme Setting JSON</h3>
				<button class="close-btn" onclick={() => (show = false)}>
					<MaterialIcon name="close" size={20} />
				</button>
			</div>

			<div class="modal-body">
				<p class="hint">
					Paste raw theme settings JSON (currentSettings or full theme object) to
					preview instantly.
				</p>
				<textarea
					bind:value={rawInputCode}
					placeholder={`{\n  "AppBackgroundColor": "#181818",\n  "AppPrimaryColor": "#00ffcc"\n}`}
				></textarea>
			</div>

			<div class="modal-footer">
				<button class="text-btn" onclick={() => (show = false)}>
					Cancel
				</button>
				<button class="apply-btn" onclick={onApply}> Apply Preview </button>
			</div>
		</div>
	</div>
{/if}

<style lang="scss">
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		backdrop-filter: blur(8px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1.5rem;
	}

	.modal-card {
		width: 100%;
		max-width: 580px;
		background: #141417;
		border: 1px solid rgba(255, 255, 255, 0.15);
		border-radius: 16px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);

		h3 {
			margin: 0;
			font-size: 1.1rem;
			font-weight: 700;
		}

		.close-btn {
			background: transparent;
			border: none;
			color: #aaa;
			cursor: pointer;
			padding: 4px;
			border-radius: 50%;
			display: flex;
			align-items: center;
			transition: color 0.2s;

			&:hover {
				color: #fff;
			}
		}
	}

	.modal-body {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;

		.hint {
			font-size: 0.85rem;
			color: #aaa;
			margin: 0;
			line-height: 1.4;
		}

		textarea {
			width: 100%;
			height: 220px;
			background: #0a0a0c;
			border: 1px solid rgba(255, 255, 255, 0.12);
			border-radius: 10px;
			padding: 0.85rem;
			color: #00ffcc;
			font-family: "Fira Code", monospace;
			font-size: 0.85rem;
			outline: none;
			resize: vertical;

			&:focus {
				border-color: rgba(0, 255, 204, 0.4);
			}
		}
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid rgba(255, 255, 255, 0.08);

		.text-btn {
			background: transparent;
			border: none;
			color: #aaa;
			font-weight: 600;
			font-size: 0.85rem;
			padding: 0.5rem 1rem;
			cursor: pointer;

			&:hover {
				color: #fff;
			}
		}

		.apply-btn {
			background: #fff;
			color: #000;
			border: none;
			border-radius: 8px;
			font-weight: 700;
			font-size: 0.85rem;
			padding: 0.5rem 1.25rem;
			cursor: pointer;
			transition: transform 0.2s;

			&:hover {
				transform: translateY(-1px);
			}
		}
	}
</style>
