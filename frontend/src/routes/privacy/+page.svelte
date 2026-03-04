<script lang="ts">
    import { fade } from "svelte/transition";
</script>

<div class="policy-page">
    <div class="content" in:fade={{ duration: 600 }}>
        <h1 class="premium-font">Privacy Policy</h1>
        <p class="last-updated">Last Updated: March 2026</p>

        <section>
            <h2>Scope</h2>
            <p>
                NewTube is a theme store and browser extension designed for
                YouTube. This policy applies to this website and the browser
                extension.
            </p>
        </section>

        <section>
            <h2>Data Collection</h2>
            <ul>
                <li>
                    <strong>Application Scope:</strong> This extension only runs
                    on tabs that start with the URL
                    <code>https://www.youtube.com</code>.
                </li>
                <li>
                    <strong>Local Storage:</strong> Your theme settings and configurations
                    are saved to your browser's local storage.
                </li>
                <li>
                    <strong>Image Uploads:</strong> When you upload a cover image
                    or screenshots, they are stored on my secure storage (Cloudflare
                    R2). You always have the option to use external image URLs if
                    you prefer not to upload images directly to my servers.
                </li>
            </ul>
        </section>

        <section>
            <h2>Authentication</h2>
            <p>
                When you sign in with Google, I only collect your basic profile
                information (name, email, and avatar) to create your account and
                associate your themes with your profile.
            </p>
        </section>

        <a href="/login" class="back-link">← Back to Login</a>
    </div>
</div>

<style lang="scss">
    .policy-page {
        display: flex;
        justify-content: center;
        min-height: 80vh;
    }

    .content {
        max-width: 900px;
        width: 100%;
        padding: 2rem 0;

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

            p,
            li {
                line-height: 1.7;
                color: var(--text-secondary);
            }

            ul {
                padding-left: 1.5rem;
                li {
                    margin-bottom: 0.75rem;
                }
            }

            code {
                background: rgba(var(--text-primary-rgb), 0.1);
                padding: 0.2rem 0.4rem;
                border-radius: 4px;
                color: var(--primary-glow);
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
