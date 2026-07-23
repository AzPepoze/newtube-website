<script lang="ts">
    import { onMount } from "svelte";
    import { scale } from "svelte/transition";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import { requireAuth } from "$lib/utils/auth";

    type Report = {
        id: string;
        themeId?: string;
        reason: string;
        details?: string;
        status: "open" | "resolved" | "dismissed";
        createdAt?: string;
        theme?: { themeId?: string; themeName?: string; isPublic?: boolean };
    };

    let reports = $state<Report[]>([]);
    let loading = $state(true);
    let error = $state("");
    let busy = $state<string | null>(null);
    let categoryName = $state("");
    let categorySlug = $state("");
    let categoryStatus = $state("");
    let creatingCategory = $state(false);

    function unwrapList(data: any) {
        return Array.isArray(data) ? data : data?.reports || data?.items || [];
    }

    function date(value?: string) {
        return value ? new Date(value).toLocaleString() : "Recently";
    }

    async function loadReports() {
        loading = true;
        error = "";
        try {
            const response = await fetch(`${PUBLIC_API_URL}/admin/reports`, {
                credentials: "include",
            });
            if (response.status === 403)
                throw new Error(
                    "This page is available to marketplace administrators only.",
                );
            if (!response.ok)
                throw new Error("Unable to load moderation reports.");
            reports = unwrapList(await response.json());
        } catch (cause) {
            error =
                cause instanceof Error
                    ? cause.message
                    : "Unable to load moderation reports.";
        } finally {
            loading = false;
        }
    }

    async function updateReport(report: Report, status: Report["status"]) {
        busy = report.id;
        try {
            const response = await fetch(
                `${PUBLIC_API_URL}/admin/reports/${report.id}`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status }),
                },
            );
            if (!response.ok) throw new Error("Unable to update report.");
            reports = reports.map((item) =>
                item.id === report.id ? { ...item, status } : item,
            );
        } catch (cause) {
            error =
                cause instanceof Error
                    ? cause.message
                    : "Unable to update report.";
        } finally {
            busy = null;
        }
    }

    async function hideTheme(report: Report) {
        const themeId = report.themeId || report.theme?.themeId;
        if (!themeId) {
            error = "This report does not contain a theme ID.";
            return;
        }
        busy = report.id;
        try {
            const response = await fetch(
                `${PUBLIC_API_URL}/admin/themes/${themeId}/visibility`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPublic: false }),
                },
            );
            if (!response.ok) throw new Error("Unable to hide theme.");
            await updateReport(report, "resolved");
        } catch (cause) {
            error =
                cause instanceof Error
                    ? cause.message
                    : "Unable to hide theme.";
        } finally {
            busy = null;
        }
    }

    function slugify(value: string) {
        return value
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
    }

    async function createCategory() {
        const name = categoryName.trim();
        const slug = slugify(categorySlug || name);
        if (!name || !slug) {
            categoryStatus =
                "Enter a category name containing letters or numbers.";
            return;
        }
        creatingCategory = true;
        categoryStatus = "";
        try {
            const response = await fetch(`${PUBLIC_API_URL}/admin/categories`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, slug }),
            });
            if (!response.ok) throw new Error("Unable to create category.");
            categoryName = "";
            categorySlug = "";
            categoryStatus =
                "Category created. It is now available in the theme editor.";
        } catch (cause) {
            categoryStatus =
                cause instanceof Error
                    ? cause.message
                    : "Unable to create category.";
        } finally {
            creatingCategory = false;
        }
    }

    onMount(() => {
        if (requireAuth()) loadReports();
    });
</script>

<div class="admin-page" in:scale={{ delay: 120, start: 0.98, duration: 250 }}>
    <header>
        <p class="eyebrow">Marketplace safety</p>
        <h1 class="premium-font">Moderation queue</h1>
        <p>
            Review community reports, resolve false positives, or remove a
            public theme from discovery.
        </p>
    </header>
    <section class="category-panel glass-panel">
        <div>
            <p class="eyebrow">Theme classification</p>
            <h2>Create category</h2>
            <p>Categories make discovery filters easier to browse.</p>
        </div>
        <form
            onsubmit={(event) => {
                event.preventDefault();
                createCategory();
            }}
        >
            <input
                bind:value={categoryName}
                maxlength="48"
                placeholder="Category name"
                aria-label="Category name"
            />
            <input
                bind:value={categorySlug}
                maxlength="48"
                placeholder="Slug (generated if blank)"
                aria-label="Category slug"
            />
            <button type="submit" disabled={creatingCategory}
                >{creatingCategory ? "Creating…" : "Create category"}</button
            >
        </form>
        {#if categoryStatus}<p class="category-status" role="status">
                {categoryStatus}
            </p>{/if}
    </section>
    {#if loading}<div class="state glass-panel">Loading reports…</div>
    {:else if error}<div class="state glass-panel error">
            <p>{error}</p>
            <button type="button" onclick={loadReports}>Try again</button>
        </div>
    {:else if reports.length}
        <div class="queue">
            {#each reports as report (report.id)}
                <article class="report glass-panel">
                    <div class="report-main">
                        <div class="report-title">
                            <h2>
                                {report.theme?.themeName ||
                                    `Theme ${report.themeId || report.theme?.themeId || ""}`}
                            </h2>
                            <span
                                class:open={report.status === "open"}
                                class="status">{report.status}</span
                            >
                        </div>
                        <dl>
                            <div>
                                <dt>Reason</dt>
                                <dd>{report.reason}</dd>
                            </div>
                            <div>
                                <dt>Reported</dt>
                                <dd>{date(report.createdAt)}</dd>
                            </div>
                        </dl>
                        {#if report.details}<p class="details">
                                {report.details}
                            </p>{/if}{#if report.themeId || report.theme?.themeId}<a
                                href={`/themes/${report.themeId || report.theme?.themeId}`}
                                >Open theme</a
                            >{/if}
                    </div>
                    <div class="actions">
                        <button
                            type="button"
                            disabled={busy === report.id}
                            onclick={() => updateReport(report, "dismissed")}
                            >Dismiss</button
                        ><button
                            type="button"
                            disabled={busy === report.id}
                            onclick={() => updateReport(report, "resolved")}
                            >Resolve</button
                        ><button
                            class="danger"
                            type="button"
                            disabled={busy === report.id}
                            onclick={() => hideTheme(report)}>Hide theme</button
                        >
                    </div>
                </article>
            {/each}
        </div>
    {:else}<div class="state glass-panel">No reports need attention.</div>{/if}
</div>

<style lang="scss">
    .admin-page {
        padding: 2rem 0 5rem;
    }
    header {
        margin-bottom: 2rem;
        max-width: 46rem;
    }
    h1 {
        margin: 0.2rem 0 0.6rem;
        font-size: clamp(2.2rem, 6vw, 3.6rem);
    }
    header p:not(.eyebrow) {
        color: var(--text-muted);
        line-height: 1.6;
    }
    .eyebrow {
        margin: 0;
        color: var(--text-muted);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
    }
    .queue {
        display: grid;
        gap: 1rem;
    }
    .report {
        display: flex;
        justify-content: space-between;
        gap: 2rem;
        padding: 1.25rem;
    }
    .report-main {
        min-width: 0;
    }
    .report-title {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }
    h2 {
        margin: 0;
        font-size: 1.1rem;
    }
    .status {
        text-transform: capitalize;
        font-size: 0.75rem;
        padding: 0.2rem 0.5rem;
        border: 1px solid var(--border-glass);
        border-radius: 999px;
        color: var(--text-muted);
    }
    .status.open {
        color: #f5c451;
        border-color: rgba(245, 196, 81, 0.4);
    }
    dl {
        display: flex;
        gap: 1.5rem;
        margin: 0.9rem 0;
    }
    dt {
        color: var(--text-muted);
        font-size: 0.75rem;
    }
    dd {
        margin: 0.15rem 0 0;
    }
    .details {
        line-height: 1.55;
        color: var(--text-secondary);
    }
    a {
        color: var(--text-primary);
    }
    .actions {
        display: flex;
        align-items: flex-start;
        flex-wrap: wrap;
        gap: 0.5rem;
    }
    button {
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-primary);
        font: inherit;
        cursor: pointer;
    }
    button.danger {
        color: #ff9696;
        border-color: rgba(255, 120, 120, 0.3);
    }
    .state {
        padding: 2rem;
        text-align: center;
        color: var(--text-muted);
    }
    .state.error {
        color: #ff9696;
    }
    .state button {
        margin-top: 0.75rem;
    }
    .category-panel {
        display: grid;
        grid-template-columns: minmax(12rem, 1fr) minmax(20rem, 2fr);
        gap: 1rem 2rem;
        padding: 1.25rem;
        margin-bottom: 1.5rem;
    }
    .category-panel h2 {
        margin: 0.25rem 0;
    }
    .category-panel p:not(.eyebrow) {
        margin: 0.4rem 0 0;
        color: var(--text-muted);
        font-size: 0.9rem;
    }
    .category-panel form {
        display: grid;
        grid-template-columns: 1fr 1fr auto;
        gap: 0.6rem;
        align-items: center;
    }
    .category-panel input {
        min-width: 0;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--border-glass);
        border-radius: var(--radius-sm);
        background: rgba(0, 0, 0, 0.12);
        color: var(--text-primary);
        font: inherit;
    }
    .category-status {
        grid-column: 1 / -1;
        margin: 0;
        color: var(--text-secondary);
    }
    @media (max-width: 700px) {
        .report {
            flex-direction: column;
            gap: 1rem;
        }
        dl {
            flex-direction: column;
            gap: 0.5rem;
        }
        .category-panel,
        .category-panel form {
            grid-template-columns: 1fr;
        }
    }
</style>
