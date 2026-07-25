<script lang="ts">
    import { fly } from "svelte/transition";
    import MaterialIcon from "$lib/components/common/MaterialIcon.svelte";
    import UserAvatar from "$lib/components/common/UserAvatar.svelte";
    import { userService } from "$lib/api/user";
    import { ui } from "$lib/core/ui.svelte";

    let {
        userData,
        isOwnProfile = true,
        onBioUpdated,
    }: {
        userData: any;
        isOwnProfile?: boolean;
        onBioUpdated?: (newBio: string) => void;
    } = $props();

    let isEditingBio = $state(false);
    let bioInput = $state("");
    let isSavingBio = $state(false);

    $effect(() => {
        if (userData?.bio !== undefined) {
            bioInput = userData.bio || "";
        }
    });

    function formatDate(dateString: string) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }

    function startEditingBio() {
        bioInput = userData.bio || "";
        isEditingBio = true;
    }

    function cancelEditingBio() {
        isEditingBio = false;
        bioInput = userData.bio || "";
    }

    async function handleSaveBio() {
        if (bioInput.length > 500) {
            ui.showModal("Validation Error", "Bio cannot exceed 500 characters.", "error");
            return;
        }

        isSavingBio = true;
        try {
            const res = await userService.updateBio(bioInput);
            if (userData) {
                userData.bio = res.bio;
            }
            if (onBioUpdated) {
                onBioUpdated(res.bio);
            }
            isEditingBio = false;
            ui.showModal("Bio Updated", "Your biography has been saved.", "info");
        } catch (err: any) {
            ui.showModal("Save Failed", err.message || "Failed to update bio", "error");
        } finally {
            isSavingBio = false;
        }
    }
</script>

{#if userData}
    <header in:fly={{ y: -20, duration: 800 }}>
        <div class="user-header">
            <UserAvatar
                userId={userData.id}
                name={userData.name}
                avatarUrl={userData.avatarUrl}
                size="lg"
                showName={false}
            />
            <div class="header-info">
                <h1 class="premium-font">{userData.name}</h1>
                <p class="join-date">
                    Joined since {formatDate(userData.createdAt)}
                </p>

                <div class="bio-section">
                    {#if isEditingBio}
                        <div class="bio-editor">
                            <textarea
                                class="bio-textarea"
                                bind:value={bioInput}
                                placeholder="Tell the community about yourself..."
                                maxlength="500"
                                rows="3"
                                disabled={isSavingBio}
                            ></textarea>
                            <div class="bio-editor-actions">
                                <span class="char-count" class:limit={bioInput.length >= 500}>
                                    {bioInput.length}/500
                                </span>
                                <div class="action-buttons">
                                    <button
                                        type="button"
                                        class="btn-cancel"
                                        onclick={cancelEditingBio}
                                        disabled={isSavingBio}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        class="btn-save"
                                        onclick={handleSaveBio}
                                        disabled={isSavingBio || bioInput.length > 500}
                                    >
                                        {isSavingBio ? "Saving..." : "Save Bio"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div class="bio-display">
                            {#if userData.bio}
                                <p class="bio-text">{userData.bio}</p>
                            {:else}
                                <p class="bio-placeholder">No bio added yet.</p>
                            {/if}

                            {#if isOwnProfile}
                                <button
                                    type="button"
                                    class="edit-bio-btn"
                                    onclick={startEditingBio}
                                    aria-label="Edit bio"
                                >
                                    <MaterialIcon name="edit" size={14} />
                                    <span>{userData.bio ? "Edit Bio" : "Add Bio"}</span>
                                </button>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </div>

        {#if isOwnProfile}
            <a href="/themes/create" class="create-btn">
                <MaterialIcon name="add" size={18} /> Create New Theme
            </a>
        {/if}
    </header>
{/if}

<style lang="scss">
    header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 5rem;
        padding-bottom: 3rem;
        border-bottom: 1px solid var(--border-glass);

        @media (max-width: 768px) {
            flex-direction: column;
            gap: 2rem;
            align-items: center;
            text-align: center;
        }

        .user-header {
            display: flex;
            align-items: flex-start;
            gap: 2rem;
            flex: 1;

            @media (max-width: 768px) {
                flex-direction: column;
                align-items: center;
            }

            .header-info {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                width: 100%;
                flex: 1;

                h1 {
                    font-size: 2.5rem;
                    margin: 0;
                    margin-bottom: 0.1rem;
                }

                .join-date {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    margin: 0;
                }
            }
        }

        .bio-section {
            margin-top: 0.75rem;
            width: 100%;

            .bio-display {
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
                width: 100%;

                @media (max-width: 768px) {
                    align-items: center;
                }

                .bio-text {
                    margin: 0;
                    color: var(--text-primary);
                    font-size: 0.95rem;
                    line-height: 1.5;
                    white-space: pre-wrap;
                    word-break: break-word;
                    width: 100%;
                }

                .bio-placeholder {
                    margin: 0;
                    color: var(--text-muted);
                    font-size: 0.9rem;
                    font-style: italic;
                    width: 100%;
                }

                .edit-bio-btn {
                    background: transparent;
                    border: 1px solid var(--border-glass);
                    color: var(--text-muted);
                    padding: 4px 10px;
                    border-radius: var(--radius-sm, 6px);
                    font-size: 0.8rem;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    transition: all 0.2s ease;

                    &:hover {
                        color: var(--text-primary);
                        border-color: var(--border-glow, rgba(255, 255, 255, 0.3));
                        background: rgba(255, 255, 255, 0.05);
                    }
                }
            }

            .bio-editor {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                width: 100%;

                .bio-textarea {
                    width: 100%;
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid var(--border-glass);
                    border-radius: var(--radius-md, 8px);
                    color: var(--text-primary);
                    padding: 0.75rem;
                    font-family: inherit;
                    font-size: 0.95rem;
                    resize: vertical;
                    outline: none;
                    transition: border-color 0.2s;

                    &:focus {
                        border-color: var(--primary-glow, #3b82f6);
                    }
                }

                .bio-editor-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .char-count {
                        font-size: 0.8rem;
                        color: var(--text-muted);

                        &.limit {
                            color: #ef4444;
                            font-weight: 600;
                        }
                    }

                    .action-buttons {
                        display: flex;
                        gap: 0.5rem;

                        button {
                            padding: 6px 14px;
                            border-radius: var(--radius-sm, 6px);
                            font-size: 0.85rem;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        }

                        .btn-cancel {
                            background: transparent;
                            border: 1px solid var(--border-glass);
                            color: var(--text-muted);

                            &:hover:not(:disabled) {
                                color: var(--text-primary);
                                background: rgba(255, 255, 255, 0.05);
                            }
                        }

                        .btn-save {
                            background: var(--text-primary);
                            border: none;
                            color: var(--bg-dark);

                            &:hover:not(:disabled) {
                                opacity: 0.9;
                            }

                            &:disabled {
                                opacity: 0.5;
                                cursor: not-allowed;
                            }
                        }
                    }
                }
            }
        }

        .create-btn {
            background: var(--text-primary);
            color: var(--bg-dark);
            padding: 14px 28px;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            text-decoration: none;
            border-radius: var(--radius-md);
            font-weight: 600;
            transition: all 0.2s;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 255, 255, 0.1);
            }
        }
    }
</style>

