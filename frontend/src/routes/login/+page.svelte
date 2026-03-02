<script lang="ts">
    import { fly } from "svelte/transition";
    import { env } from "$env/dynamic/public";
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { getUserId } from "$lib/auth";

    const PUBLIC_API_URL = env.PUBLIC_API_URL || "http://localhost:8787";

    onMount(async () => {
        const userId = getUserId();
        if (userId) {
            try {
                const response = await fetch(`${PUBLIC_API_URL}/me`, {
                    credentials: "include",
                });
                if (response.ok) {
                    goto("/");
                }
            } catch {
                // Not actually logged in or session expired
            }
        }
    });

    function loginWithGoogle() {
        window.location.href = `${PUBLIC_API_URL}/auth/google`;
    }
</script>

<div class="login-container">
    <div class="login-card glass-panel" in:fly={{ y: 30, duration: 800 }}>
        <h1 class="premium-font">Welcome Back</h1>
        <p>Sign in to create and manage your NewTube themes</p>

        <button onclick={loginWithGoogle} class="google-login-btn">
            <img
                src="https://authjs.dev/img/providers/google.svg"
                alt="Google"
                width="24"
                height="24"
            />
            <span>Sign in with Google</span>
        </button>

        <div class="divider">
            <span>or</span>
        </div>

        <p class="terms">
            By signing in, you agree to our <a href="/terms">Terms of Service</a
            >
            and <a href="/privacy">Privacy Policy</a>.
        </p>
    </div>
</div>

<style lang="scss">
    .login-container {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 70vh;
    }

    .login-card {
        padding: 4rem;
        width: 100%;
        max-width: 500px;
        text-align: center;

        h1 {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: var(--text-primary);
        }

        p {
            color: var(--text-secondary);
            margin-bottom: 3rem;
        }

        .google-login-btn {
            @include premium-button;
            @include glassmorphism;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            font-size: 1.1rem;
            padding: 16px;
            background: rgba(var(--text-primary-rgb), 0.05);
            border: 1px solid var(--border-glass);
            color: var(--text-primary);

            &:hover {
                background: rgba(var(--text-primary-rgb), 0.1);
                border-color: rgba(var(--text-primary-rgb), 0.5);
            }

            img {
                filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.2));
            }
        }

        .divider {
            margin: 2rem 0;
            position: relative;
            border-bottom: 1px solid var(--border-glass);

            span {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: var(--bg-dark);
                padding: 0 1rem;
                color: var(--text-muted);
                font-size: 0.9rem;
            }
        }

        .terms {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-bottom: 0;

            a {
                color: var(--text-secondary);
                text-decoration: underline;
            }
        }
    }
</style>
