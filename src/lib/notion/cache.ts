interface CachedEntry<T> {
	data: T;
	cachedAt: number;
}

export const CACHE_TTLS = {
	/** Listings (1 hour) */
	LIST: 3600,
	/** Individual page content (24 hours) */
	CONTENT: 86400,
	/** Data source IDs (24 hours) */
	DATA_SOURCE: 86400,
	/** Dev override so Notion edits show up quickly without hammering the API */
	DEV: 60,
} as const;

const store = new Map<string, CachedEntry<unknown>>();

/**
 * In-memory TTL cache (Redis-ready API).
 * In development, all entries use a 60s TTL.
 */
export async function cachedNotionQuery<T>(
	key: string,
	fetcher: () => Promise<T>,
	options: { ttl: number },
): Promise<T> {
	const ttl = import.meta.env.DEV ? CACHE_TTLS.DEV : options.ttl;
	const now = Date.now();
	const cached = store.get(key) as CachedEntry<T> | undefined;
	if (cached && now - cached.cachedAt < ttl * 1000) {
		return cached.data;
	}

	try {
		const data = await fetcher();
		store.set(key, { data, cachedAt: now });
		return data;
	} catch (error) {
		if (cached) {
			console.warn(
				`[Notion Cache] Fetch failed for ${key}, serving stale cache:`,
				error,
			);
			return cached.data;
		}
		throw error;
	}
}

export function invalidateNotionCache(prefix: string): number {
	let deleted = 0;
	for (const key of store.keys()) {
		if (key.startsWith(prefix) || key.includes(prefix.replace(/\*$/, ''))) {
			store.delete(key);
			deleted += 1;
		}
	}
	return deleted;
}
