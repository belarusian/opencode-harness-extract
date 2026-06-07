/**
 * Caching layer for LLM requests
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
declare const Cache_base: Context.ServiceClass<Cache, "opencode-harness/Cache", CacheShape>;
/**
 * Cache service for LLM requests
 */
export declare class Cache extends Cache_base {
}
export interface CacheShape {
    readonly get: <T>(key: string) => Effect.Effect<T | undefined, Error>;
    readonly set: <T>(key: string, value: T) => Effect.Effect<void, Error>;
    readonly clear: () => Effect.Effect<void, Error>;
}
/**
 * In-memory cache implementation
 */
export declare const makeCache: Layer.Layer<Cache, never, never>;
/**
 * Layer for Cache
 */
export declare const CacheLayer: Layer.Layer<Cache, never, never>;
export {};
//# sourceMappingURL=cache.d.ts.map