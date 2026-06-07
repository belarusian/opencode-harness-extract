/**
 * Caching layer for LLM requests
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
/**
 * Cache service for LLM requests
 */
export class Cache extends Context.Service()("opencode-harness/Cache") {
}
/**
 * In-memory cache implementation
 */
export const makeCache = Layer.succeed(Cache, {
    get: (key) => Effect.sync(() => {
        const cached = cache.get(key);
        return cached;
    }),
    set: (key, value) => Effect.sync(() => {
        cache.set(key, value);
    }),
    clear: () => Effect.sync(() => {
        cache.clear();
    })
});
// In-memory cache storage
const cache = new Map();
/**
 * Layer for Cache
 */
export const CacheLayer = makeCache;
//# sourceMappingURL=cache.js.map