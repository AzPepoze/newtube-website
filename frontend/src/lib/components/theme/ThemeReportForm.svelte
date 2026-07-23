<script lang="ts">
    let {
        showReport = $bindable(),
        reportReason = $bindable(),
        reportDetails = $bindable(),
        submitting,
        submitReport,
    }: {
        showReport: boolean;
        reportReason: string;
        reportDetails: string;
        submitting: boolean;
        submitReport: () => void;
    } = $props();
</script>

{#if showReport}
    <form
        class="report-form"
        onsubmit={(event) => {
            event.preventDefault();
            submitReport();
        }}
    >
        <label>
            Reason
            <select bind:value={reportReason}>
                <option value="broken">Broken or unsafe</option>
                <option value="copyright">Copyright concern</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="malware">Malware or unsafe link</option>
                <option value="spam">Spam</option>
                <option value="other">Other</option>
            </select>
        </label>
        <label>
            Details
            <textarea
                bind:value={reportDetails}
                maxlength="2000"
                placeholder="Help moderators understand the issue"></textarea>
        </label>
        <div class="report-actions">
            <button
                type="button"
                class="quiet-action"
                onclick={() => (showReport = false)}
            >
                Cancel
            </button>
            <button class="primary-action" type="submit" disabled={submitting}>
                Submit report
            </button>
        </div>
    </form>
{/if}

<style lang="scss">
    .report-form {
        display: grid;
        gap: 0.75rem;
        padding: 1rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.025);
    }
    textarea,
    select {
        width: 100%;
        min-height: 4.5rem;
        box-sizing: border-box;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(0, 0, 0, 0.15);
        color: var(--text-primary);
        padding: 0.7rem;
        font: inherit;
    }
    select {
        min-height: 2.5rem;
    }
    label {
        display: grid;
        gap: 0.4rem;
    }
    .report-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
    }
    .quiet-action {
        border: none;
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0.5rem;
        font: inherit;

        &:hover {
            color: var(--text-primary);
        }
    }
    .primary-action {
        border: none;
        background: var(--text-primary);
        color: var(--bg-dark);
        padding: 0.5rem 1rem;
        border-radius: var(--radius-sm);
        font-weight: 600;
        cursor: pointer;

        &:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }
</style>
