<script lang="ts">
    import { fade } from "svelte/transition";
</script>

<div class="policy-page">
    <div class="content glass-panel" in:fade={{ duration: 600 }}>
        <h1 class="premium-font">Terms of Service</h1>
        <p class="last-updated">Last Updated: March 2026</p>

        <section>
            <h2>Acceptance of Terms</h2>
            <p>
                By accessign and using NewTube Store, you agree to follow these
                Terms of Service. If you don't agree with them, please don't use
                the app.
            </p>
        </section>

        <section>
            <h2>User Content</h2>
            <p>
                You are responsible for all themes you create and images you
                upload. You must not upload any content that is illegal,
                harmful, or violates someone else's intellectual property
                rights.
            </p>
            <p>
                By sharing your theme publicly, you grant other users a license
                to use and apply it to their YouTube experience via the NewTube
                extension.
            </p>
        </section>

        <section>
            <h2>Extension Use</h2>
            <p>
                The NewTube extension is provided as-is, without warranties. I
                am not affiliated with YouTube or Google. The extension's
                functionality is subject to change if YouTube updates its layout
                or site structure.
            </p>
        </section>

        <a href="/login" class="back-link">← Back to Login</a>
    </div>
</div>

<style lang="scss">
    .policy-page {
        display: flex;
        justify-content: center;
        padding: 4rem 1rem;
        min-height: 80vh;
    }

    .content {
        max-width: 800px;
        width: 100%;
        padding: 4rem;

        h1 {
            font-size: 3rem;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }

        .last-updated {
            color: var(--text-secondary);
            font-size: 0.9rem;
            margin-bottom: 3rem;
        }

        section {
            margin-bottom: 2.5rem;

            h2 {
                font-size: 1.5rem;
                margin-bottom: 1rem;
                color: var(--text-primary);
            }

            p {
                line-height: 1.7;
                color: var(--text-secondary);
            }
        }

        .back-link {
            display: inline-block;
            margin-top: 2rem;
            color: var(--primary-glow);
            text-decoration: none;
            font-weight: 600;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    @media (max-width: 768px) {
        .content {
            padding: 2rem;
        }
    }
</style>
