import { Elysia } from 'elysia';
import { contextPlugin } from '../plugins/context';

export const sponsorsRoute = new Elysia({ prefix: '/sponsors' })
	.use(contextPlugin)
	.get('/', async ({ env, set, request }) => {
		const token = env.GITHUB_TOKEN;
		
		if (!token) {
			return [];
		}

		// Cache configuration
		const cache = (caches as any).default;
		const cacheKey = new Request(new URL("https://sponsors.cache/fetch"), {
			method: "GET"
		});

		try {
			// Check cache first
			const cachedResponse = await cache.match(cacheKey);
			if (cachedResponse) {
				return await cachedResponse.json();
			}

			const query = `
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
			const gqlResponse = await fetch("https://api.github.com/graphql", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`,
					"User-Agent": "NewTube-Backend"
				},
				body: JSON.stringify({ query })
			});

			if (gqlResponse.ok) {
				const result: any = await gqlResponse.json();
				if (result.data?.viewer?.sponsorshipsAsMaintainer?.nodes) {
					const sponsors = result.data.viewer.sponsorshipsAsMaintainer.nodes.map((n: any) => ({
						name: n.sponsorEntity.name || n.sponsorEntity.login,
						avatar: n.sponsorEntity.avatarUrl,
						link: n.sponsorEntity.url,
						tier: n.tier?.name
					}));
					
					// Cache the result for 1 hour
					const responseToCache = new Response(JSON.stringify(sponsors), {
						headers: { 
							"Content-Type": "application/json",
							"Cache-Control": "max-age=3600"
						}
					});
					await cache.put(cacheKey, responseToCache);

					return sponsors;
				}
			}

			return [];
		} catch (e) {
			console.error("Failed to fetch sponsors in backend", e);
			set.status = 500;
			return { error: "Failed to fetch sponsors" };
		}
	});


