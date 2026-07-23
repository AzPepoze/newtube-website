<script lang="ts">
    import { onMount } from "svelte";
    import { PUBLIC_API_URL } from "$lib/constants/index";
    import ThemeCard from "$lib/components/theme/ThemeCard.svelte";

    let {
        collections = [],
        reviews = [],
        drafts = [],
        onCollectionsChange,
    }: {
        collections?: any[];
        reviews?: any[];
        drafts?: any[];
        onCollectionsChange: (collections: any[]) => void;
    } = $props();

    let name = $state("");
    let description = $state("");
    let saving = $state(false);
    let status = $state("");

    function unwrapList(data: any, preferred: string) {
        return Array.isArray(data) ? data : (data?.[preferred] || data?.items || []);
    }

    function formatDate(value?: string) {
        return value ? new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recently";
    }

    async function createCollection() {
        const trimmed = name.trim();
        if (!trimmed) return;
        saving = true;
        status = "";
        try {
            const response = await fetch(`${PUBLIC_API_URL}/collections`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed, description: description.trim() }),
            });
            if (!response.ok) throw new Error("Unable to create collection");
            const created = await response.json();
            const collection = created?.collection || created;
            onCollectionsChange([...collections, collection]);
            name = "";
            description = "";
            status = "Collection created.";
        } catch (error) {
            status = error instanceof Error ? error.message : "Unable to create collection.";
        } finally {
            saving = false;
        }
    }

    async function deleteCollection(id: string) {
        if (!confirm("Delete this collection? Themes themselves will not be deleted.")) return;
        try {
            const response = await fetch(`${PUBLIC_API_URL}/collections/${id}`, { method: "DELETE", credentials: "include" });
            if (!response.ok) throw new Error("Unable to delete collection");
            onCollectionsChange(collections.filter((collection) => collection.id !== id));
        } catch (error) {
            status = error instanceof Error ? error.message : "Unable to delete collection.";
        }
    }

    function collectionThemes(collection: any) {
        return unwrapList(collection?.themes || collection?.items || [], "themes").map(
            (item: any) => item.theme || item,
        );
    }

    async function hydrateCollectionItems() {
        try {
            const hydrated = await Promise.all(
                collections.map(async (collection) => {
                    const response = await fetch(`${PUBLIC_API_URL}/collections/${collection.id}`, {
                        credentials: "include",
                    });
                    return response.ok ? await response.json() : collection;
                }),
            );
            onCollectionsChange(hydrated);
        } catch {
            // The collection summary remains useful if individual items cannot load.
        }
    }

    onMount(hydrateCollectionItems);
</script>

<section class="marketplace-section">
    <div class="section-heading"><div><p class="eyebrow">Curate your finds</p><h2 class="premium-font">Collections</h2></div></div>
    <form class="collection-form glass-panel" onsubmit={(event) => { event.preventDefault(); createCollection(); }}>
        <input bind:value={name} maxlength="100" placeholder="Collection name" aria-label="Collection name" />
        <input bind:value={description} maxlength="500" placeholder="Description (optional)" aria-label="Collection description" />
        <button type="submit" disabled={saving}>{saving ? "Creating…" : "Create collection"}</button>
    </form>
    {#if status}<p class="status" role="status">{status}</p>{/if}
    {#if collections.length}
        <div class="collection-grid">
            {#each collections as collection (collection.id)}
                <article class="collection glass-panel">
                    <div class="collection-title"><div><h3>{collection.name}</h3>{#if collection.description}<p>{collection.description}</p>{/if}</div><button type="button" class="delete" onclick={() => deleteCollection(collection.id)}>Delete</button></div>
                    {#if collectionThemes(collection).length}
                        <div class="saved-themes">
                            {#each collectionThemes(collection).slice(0, 3) as theme (theme.themeId)}
                                <a href={`/themes/${theme.themeId}`}>{theme.themeName}</a>
                            {/each}
                        </div>
                    {:else}
                        <p class="empty">Save public themes to this collection from a theme page.</p>
                    {/if}
                </article>
            {/each}
        </div>
    {:else}
        <p class="empty">Create a collection to keep your favorite themes together.</p>
    {/if}
</section>

<section class="marketplace-section">
    <div class="section-heading"><div><p class="eyebrow">Keep creating</p><h2 class="premium-font">Drafts</h2></div></div>
    {#if drafts.length}
        <div class="theme-grid">
            {#each drafts as draft (draft.themeId)}
                <div class="draft-card"><ThemeCard theme={draft} /><a class="edit" href={`/themes/edit/${draft.themeId}`}>Continue editing</a></div>
            {/each}
        </div>
    {:else}
        <p class="empty">No server drafts. Save a draft from the editor to return to it on any device.</p>
    {/if}
</section>

<section class="marketplace-section">
    <div class="section-heading"><div><p class="eyebrow">Your voice</p><h2 class="premium-font">Review activity</h2></div></div>
    {#if reviews.length}
        <ul class="activity-list">
            {#each reviews as review (review.id)}
                <li class="glass-panel"><div><strong>{review.theme?.themeName || review.themeName || "Theme review"}</strong><span>{"★".repeat(review.rating || 0)}</span>{#if review.body}<p>{review.body}</p>{/if}</div><time>{formatDate(review.updatedAt || review.createdAt)}</time></li>
            {/each}
        </ul>
    {:else}
        <p class="empty">Your published reviews will appear here.</p>
    {/if}
</section>

<style lang="scss">
    .marketplace-section { margin-top:4.5rem; } .section-heading { margin-bottom:1.25rem; } .section-heading h2 { margin:0; font-size:1.75rem; color:var(--text-secondary); } .eyebrow { margin:0 0 .35rem; color:var(--text-muted); text-transform:uppercase; font-size:.75rem; letter-spacing:.08em; }
    .collection-form { display:grid; grid-template-columns:minmax(10rem,1fr) minmax(12rem,2fr) auto; gap:.75rem; padding:1rem; } input { min-width:0; border:1px solid var(--border-glass); border-radius:var(--radius-sm); background:rgba(0,0,0,.12); color:var(--text-primary); padding:.7rem; font:inherit; } button,.edit { border:1px solid var(--border-glass); border-radius:var(--radius-sm); background:rgba(var(--text-primary-rgb),.05); color:var(--text-primary); padding:.65rem .85rem; cursor:pointer; font:inherit; font-weight:700; text-decoration:none; }
    .collection-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:1rem; margin-top:1rem; } .collection { padding:1rem; } .collection-title { display:flex; justify-content:space-between; gap:1rem; } h3 { margin:0; } .collection p { margin:.35rem 0 0; color:var(--text-muted); font-size:.9rem; } .delete { color:#ff8f8f; padding:.35rem .5rem; background:transparent; } .saved-themes { display:grid; gap:.45rem; border-top:1px solid var(--border-glass); margin-top:1rem; padding-top:.8rem; } .saved-themes a { color:var(--text-secondary); }
    .theme-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:1.5rem; } .draft-card { display:grid; gap:.6rem; } .edit { text-align:center; } .activity-list { list-style:none; padding:0; display:grid; gap:.75rem; } .activity-list li { padding:1rem; display:flex; justify-content:space-between; gap:1rem; } .activity-list strong { display:block; } .activity-list span { color:#f5c451; font-size:.85rem; } .activity-list p { margin:.45rem 0 0; color:var(--text-secondary); } time,.empty,.status { color:var(--text-muted); } .status { margin: .75rem 0 0; }
    @media(max-width:700px){ .collection-form { grid-template-columns:1fr; } .activity-list li { flex-direction:column; } }
</style>
