/**
 * Persistent caching for `Persistable` request keys.
 *
 * A `PersistedCache` combines a scoped in-memory `Cache` with a named
 * `Persistence` store. It is useful for expensive or idempotent lookups such as
 * remote API calls, database reads, and request results that should be reused
 * across fibers, process restarts, or multiple workers sharing the same backing
 * store.
 *
 * The persistent `timeToLive` is evaluated for the stored `Exit`, so successes
 * and failures can be cached with different lifetimes. The in-memory cache has
 * its own `inMemoryTTL` and capacity, and `invalidate` removes both the
 * persisted value and the in-memory entry. Persisted values are encoded with
 * the key's success and error schemas and stored under the key's primary key, so
 * schema changes, primary-key changes, or store-id collisions can make old
 * entries fail to decode until they are invalidated or written under a new
 * `storeId`.
 *
 * @since 4.0.0
 */
import * as Cache from "../../Cache.js";
import * as Duration from "../../Duration.js";
import * as Effect from "../../Effect.js";
import { constant, identity } from "../../Function.js";
import * as Persistence from "./Persistence.js";
const TypeId = "~effect/persistence/PersistedCache";
/**
 * Creates a persisted cache for `Persistable` request keys.
 *
 * **Details**
 *
 * The cache reads persisted exits before running the lookup, stores lookup
 * exits with the configured persistent TTL, and also keeps a scoped in-memory
 * cache with its own capacity and TTL.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = /*#__PURE__*/Effect.fnUntraced(function* (lookup, options) {
  const store = yield* (yield* Persistence.Persistence).make({
    storeId: options.storeId,
    timeToLive: options.timeToLive
  });
  const inMemory = yield* Cache.makeWith(Effect.fnUntraced(function* (key) {
    const exit = yield* store.get(key);
    if (exit) {
      return yield* exit;
    }
    const result = yield* Effect.exit(lookup(key));
    yield* store.set(key, result);
    return yield* result;
  }), {
    timeToLive: options.inMemoryTTL ?? constant(Duration.seconds(10)),
    capacity: options.inMemoryCapacity ?? 1024,
    requireServicesAt: options.requireServicesAt
  });
  return identity({
    [TypeId]: TypeId,
    inMemory,
    get: key => Cache.get(inMemory, key),
    invalidate: key => Effect.flatMap(store.remove(key), () => Cache.invalidate(inMemory, key))
  });
});
//# sourceMappingURL=PersistedCache.js.map