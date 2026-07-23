type Sponsor = {
    name: string;
    avatar: string;
    link: string;
    tier?: string;
};

type SponsorsResult =
    | { status: "ok"; sponsors: Sponsor[] }
    | { status: "failed" };

const SPONSORS_CACHE_URL = "https://sponsors.cache/fetch";

const SPONSORS_QUERY = `
    query {
        viewer {
            sponsorshipsAsMaintainer(first: 100) {
                nodes {
                    sponsorEntity {
                        ... on User {
                            login
                            name
                            avatarUrl
                            url
                        }
                        ... on Organization {
                            login
                            name
                            avatarUrl
                            url
                        }
                    }
                    tier {
                        name
                        monthlyPriceInDollars
                    }
                }
            }
        }
    }
`;

export async function getSponsors(env: Env): Promise<SponsorsResult> {
    const token = env.GITHUB_TOKEN;
    if (!token) return { status: "ok", sponsors: [] };

    const cache = (caches as any).default;
    const cacheKey = new Request(new URL(SPONSORS_CACHE_URL), {
        method: "GET",
    });

    try {
        const cachedResponse = await cache.match(cacheKey);
        if (cachedResponse) {
            return { status: "ok", sponsors: await cachedResponse.json() };
        }

        const gqlResponse = await fetch("https://api.github.com/graphql", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
                "User-Agent": "NewTube-Backend",
            },
            body: JSON.stringify({ query: SPONSORS_QUERY }),
        });

        if (gqlResponse.ok) {
            const result: any = await gqlResponse.json();
            if (result.data?.viewer?.sponsorshipsAsMaintainer?.nodes) {
                const sponsors = result.data.viewer.sponsorshipsAsMaintainer.nodes.map(
                    (node: any) => ({
                        name: node.sponsorEntity.name || node.sponsorEntity.login,
                        avatar: node.sponsorEntity.avatarUrl,
                        link: node.sponsorEntity.url,
                        tier: node.tier?.name,
                    }),
                );

                await cache.put(
                    cacheKey,
                    new Response(JSON.stringify(sponsors), {
                        headers: {
                            "Content-Type": "application/json",
                            "Cache-Control": "max-age=3600",
                        },
                    }),
                );

                return { status: "ok", sponsors };
            }
        }

        return { status: "ok", sponsors: [] };
    } catch (error) {
        console.error("Failed to fetch sponsors in backend", error);
        return { status: "failed" };
    }
}
