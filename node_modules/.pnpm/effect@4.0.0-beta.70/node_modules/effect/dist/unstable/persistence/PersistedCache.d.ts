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
import * as Cache from "../../Cache.ts";
import * as Effect from "../../Effect.ts";
import type * as Schema from "../../Schema.ts";
import type * as Scope from "../../Scope.ts";
import type * as Persistable from "./Persistable.ts";
import * as Persistence from "./Persistence.ts";
declare const TypeId: "~effect/persistence/PersistedCache";
/**
 * Cache that combines an in-memory `Cache` with a persisted backing store.
 *
 * @category models
 * @since 4.0.0
 */
export interface PersistedCache<K extends Persistable.Any, out R = never> {
    readonly [TypeId]: typeof TypeId;
    readonly inMemory: Cache.Cache<K, Persistable.Success<K>, Persistable.Error<K> | Persistence.PersistenceError | Schema.SchemaError, Persistable.Services<K> | R>;
    readonly get: (key: K) => Effect.Effect<Persistable.Success<K>, Persistable.Error<K> | Persistence.PersistenceError | Schema.SchemaError, Persistable.Services<K> | R>;
    readonly invalidate: (key: K) => Effect.Effect<void, Persistence.PersistenceError>;
}
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
export declare const make: <K extends Persistable.Any, R = never, ServiceMode extends "lookup" | "construction" = never>(lookup: (key: K) => Effect.Effect<Persistable.Success<K>, Persistable.Error<K>, R>, options: {
    readonly storeId: string;
    readonly timeToLive: Persistable.TimeToLiveFn<K>;
    readonly inMemoryCapacity?: number | undefined;
    readonly inMemoryTTL?: Persistable.TimeToLiveFn<K> | undefined;
    readonly requireServicesAt?: ServiceMode | undefined;
}) => Effect.Effect<PersistedCache<K, "lookup" extends ServiceMode ? R : never>, never, ("lookup" extends ServiceMode ? never : R) | Persistence.Persistence | Scope.Scope>;
export {};
//# sourceMappingURL=PersistedCache.d.ts.map