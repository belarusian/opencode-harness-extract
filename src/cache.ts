/**
 * Caching layer for LLM requests
 */

import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

/**
 * Cache service for LLM requests
 */
export class Cache extends Context.Service<Cache, CacheShape>()("opencode-harness/Cache") {}

export interface CacheShape {
  readonly get: <T>(key: string) => Effect.Effect<T | undefined, Error>;
  readonly set: <T>(key: string, value: T) => Effect.Effect<void, Error>;
  readonly clear: () => Effect.Effect<void, Error>;
}

/**
 * In-memory cache implementation
 */
export const makeCache = Layer.succeed(
  Cache,
  {
    get: <T>(key: string) => Effect.sync(() => {
      const cached = cache.get(key);
      return cached as T | undefined;
    }),
    set: <T>(key: string, value: T) => Effect.sync(() => {
      cache.set(key, value);
    }),
    clear: () => Effect.sync(() => {
      cache.clear();
    })
  }
);

// In-memory cache storage
const cache: Map<string, unknown> = new Map();

/**
 * Layer for Cache
 */
export const CacheLayer = makeCache;
