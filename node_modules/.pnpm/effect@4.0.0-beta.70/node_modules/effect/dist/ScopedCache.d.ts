import * as Deferred from "./Deferred.ts";
import * as Duration from "./Duration.ts";
import type * as Effect from "./Effect.ts";
import type * as Exit from "./Exit.ts";
import * as MutableHashMap from "./MutableHashMap.ts";
import * as Option from "./Option.ts";
import type { Pipeable } from "./Pipeable.ts";
import * as Predicate from "./Predicate.ts";
import * as Scope from "./Scope.ts";
declare const TypeId = "~effect/ScopedCache";
/**
 * A scoped cache whose values are acquired by a lookup effect and stored in
 * per-entry scopes.
 *
 * **Details**
 *
 * Concurrent requests for the same key share the same in-flight lookup.
 * Entries can expire based on the lookup exit, are evicted when capacity is
 * exceeded, and release their entry scopes when invalidated, evicted, expired,
 * or when the cache's owning scope closes.
 *
 * @category models
 * @since 2.0.0
 */
export interface ScopedCache<in out Key, in out A, in out E = never, out R = never> extends Pipeable {
    readonly [TypeId]: typeof TypeId;
    state: State<Key, A, E>;
    readonly capacity: number;
    readonly lookup: (key: Key) => Effect.Effect<A, E, R | Scope.Scope>;
    readonly timeToLive: (exit: Exit.Exit<A, E>, key: Key) => Duration.Duration;
}
/**
 * Represents whether a `ScopedCache` is open or closed.
 *
 * **Details**
 *
 * `Open` stores cached entries in access order for reuse and eviction.
 * `Closed` means the owning scope has closed and the cache can no longer
 * perform lookup operations.
 *
 * @category models
 * @since 4.0.0
 */
export type State<K, A, E> = {
    readonly _tag: "Open";
    readonly map: MutableHashMap.MutableHashMap<K, Entry<A, E>>;
} | {
    readonly _tag: "Closed";
};
/**
 * A single scoped cache entry.
 *
 * **Details**
 *
 * The entry contains the deferred lookup result shared by readers, the scope
 * that owns resources acquired while computing the value, and an optional
 * expiration time in milliseconds. Removing the entry closes its scope.
 *
 * @category models
 * @since 4.0.0
 */
export interface Entry<A, E> {
    expiresAt: number | undefined;
    readonly deferred: Deferred.Deferred<A, E>;
    readonly scope: Scope.Closeable;
}
/**
 * Creates a `ScopedCache` from a lookup function, maximum capacity, and a
 * time-to-live function computed from each lookup exit and key.
 *
 * **Details**
 *
 * The cache must be constructed in a `Scope`. Each lookup runs in its own entry
 * scope, and that scope is closed when the entry expires, is invalidated, is
 * evicted by capacity, or when the cache's owning scope closes.
 * `requireServicesAt` controls whether lookup services are captured at
 * construction time or required when lookup operations run.
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const makeWith: <Key, A, E = never, R = never, ServiceMode extends "lookup" | "construction" = never>(options: {
    readonly lookup: (key: Key) => Effect.Effect<A, E, R | Scope.Scope>;
    readonly capacity: number;
    readonly timeToLive?: ((exit: Exit.Exit<A, E>, key: Key) => Duration.Input) | undefined;
    readonly requireServicesAt?: ServiceMode | undefined;
}) => Effect.Effect<ScopedCache<Key, A, E, "lookup" extends ServiceMode ? Exclude<R, Scope.Scope> : never>, never, ("lookup" extends ServiceMode ? never : R) | Scope.Scope>;
/**
 * Creates a `ScopedCache` with a fixed time-to-live for every lookup result.
 *
 * **Details**
 *
 * This is the constant-TTL variant of `makeWith`: values are acquired by the
 * lookup effect in per-entry scopes, capacity can evict older entries, and
 * entry scopes are closed when entries expire, are invalidated, are evicted, or
 * when the cache's owning scope closes.
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const make: <Key, A, E = never, R = never, ServiceMode extends "lookup" | "construction" = never>(options: {
    readonly lookup: (key: Key) => Effect.Effect<A, E, R | Scope.Scope>;
    readonly capacity: number;
    readonly timeToLive?: Duration.Input | undefined;
    readonly requireServicesAt?: ServiceMode | undefined;
}) => Effect.Effect<ScopedCache<Key, A, E, "lookup" extends ServiceMode ? Exclude<R, Scope.Scope> : never>, never, ("lookup" extends ServiceMode ? never : R) | Scope.Scope>;
/**
 * Gets the value for a key, running the cache lookup when no unexpired entry is
 * present.
 *
 * **Details**
 *
 * Concurrent `get` calls for the same key share the same in-flight lookup.
 * Successful and failed lookup exits are cached according to the configured
 * TTL. If the cache is closed, the effect is interrupted.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const get: {
    /**
     * Gets the value for a key, running the cache lookup when no unexpired entry is
     * present.
     *
     * **Details**
     *
     * Concurrent `get` calls for the same key share the same in-flight lookup.
     * Successful and failed lookup exits are cached according to the configured
     * TTL. If the cache is closed, the effect is interrupted.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<A, E, R>;
    /**
     * Gets the value for a key, running the cache lookup when no unexpired entry is
     * present.
     *
     * **Details**
     *
     * Concurrent `get` calls for the same key share the same in-flight lookup.
     * Successful and failed lookup exits are cached according to the configured
     * TTL. If the cache is closed, the effect is interrupted.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<A, E, R>;
};
/**
 * Reads an existing unexpired cache entry without running the lookup function.
 *
 * **Details**
 *
 * Returns `Option.none` when the key is absent or expired. If an entry exists,
 * the effect waits for its cached result and returns `Option.some(value)` on
 * success, or fails with the cached lookup error.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const getOption: {
    /**
     * Reads an existing unexpired cache entry without running the lookup function.
     *
     * **Details**
     *
     * Returns `Option.none` when the key is absent or expired. If an entry exists,
     * the effect waits for its cached result and returns `Option.some(value)` on
     * success, or fails with the cached lookup error.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<Option.Option<A>, E>;
    /**
     * Reads an existing unexpired cache entry without running the lookup function.
     *
     * **Details**
     *
     * Returns `Option.none` when the key is absent or expired. If an entry exists,
     * the effect waits for its cached result and returns `Option.some(value)` on
     * success, or fails with the cached lookup error.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<Option.Option<A>, E>;
};
/**
 * Retrieves the value associated with the specified key from the cache, only if
 * it contains a resolved successful value.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const getSuccess: {
    /**
     * Retrieves the value associated with the specified key from the cache, only if
     * it contains a resolved successful value.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, R>(key: Key): <E>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<Option.Option<A>>;
    /**
     * Retrieves the value associated with the specified key from the cache, only if
     * it contains a resolved successful value.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<Option.Option<A>>;
};
/**
 * Stores a successful value for a key without running the lookup function.
 *
 * **Details**
 *
 * This replaces and closes any existing entry scope for the key, applies the
 * cache's TTL using a successful exit for the value, and may evict older
 * entries if the cache capacity is exceeded.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const set: {
    /**
     * Stores a successful value for a key without running the lookup function.
     *
     * **Details**
     *
     * This replaces and closes any existing entry scope for the key, applies the
     * cache's TTL using a successful exit for the value, and may evict older
     * entries if the cache capacity is exceeded.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A>(key: Key, value: A): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<void>;
    /**
     * Stores a successful value for a key without running the lookup function.
     *
     * **Details**
     *
     * This replaces and closes any existing entry scope for the key, applies the
     * cache's TTL using a successful exit for the value, and may evict older
     * entries if the cache capacity is exceeded.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key, value: A): Effect.Effect<void>;
};
/**
 * Checks if the cache contains an entry for the specified key.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const has: {
    /**
     * Checks if the cache contains an entry for the specified key.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<boolean>;
    /**
     * Checks if the cache contains an entry for the specified key.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<boolean>;
};
/**
 * Removes the entry associated with a key and closes its entry scope.
 *
 * **Details**
 *
 * If the key is absent, this is a no-op. If the cache is closed, the effect is
 * interrupted.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const invalidate: {
    /**
     * Removes the entry associated with a key and closes its entry scope.
     *
     * **Details**
     *
     * If the key is absent, this is a no-op. If the cache is closed, the effect is
     * interrupted.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<void>;
    /**
     * Removes the entry associated with a key and closes its entry scope.
     *
     * **Details**
     *
     * If the key is absent, this is a no-op. If the cache is closed, the effect is
     * interrupted.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<void>;
};
/**
 * Conditionally invalidates the entry associated with the specified key in the cache
 * if the predicate returns true for the cached value.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const invalidateWhen: {
    /**
     * Conditionally invalidates the entry associated with the specified key in the cache
     * if the predicate returns true for the cached value.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A>(key: Key, f: Predicate.Predicate<A>): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<boolean>;
    /**
     * Conditionally invalidates the entry associated with the specified key in the cache
     * if the predicate returns true for the cached value.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key, f: Predicate.Predicate<A>): Effect.Effect<boolean>;
};
/**
 * Forces a refresh of the value associated with the specified key in the cache.
 *
 * **Details**
 *
 * It will always invoke the lookup function to construct a new value,
 * overwriting any existing value for that key.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const refresh: {
    /**
     * Forces a refresh of the value associated with the specified key in the cache.
     *
     * **Details**
     *
     * It will always invoke the lookup function to construct a new value,
     * overwriting any existing value for that key.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A>(key: Key): <E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<A, E, R>;
    /**
     * Forces a refresh of the value associated with the specified key in the cache.
     *
     * **Details**
     *
     * It will always invoke the lookup function to construct a new value,
     * overwriting any existing value for that key.
     *
     * @category combinators
     * @since 4.0.0
     */
    <Key, A, E, R>(self: ScopedCache<Key, A, E, R>, key: Key): Effect.Effect<A, E, R>;
};
/**
 * Removes every entry from the cache and closes each entry scope.
 *
 * **Details**
 *
 * If the cache is closed, the effect is interrupted.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const invalidateAll: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<void>;
/**
 * Retrieves the approximate number of entries in the cache.
 *
 * **Gotchas**
 *
 * Note that expired entries are counted until they are accessed and removed.
 * The size reflects the current number of entries stored, not the number
 * of valid entries.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const size: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<number>;
/**
 * Retrieves all active keys from the cache, automatically filtering out expired entries.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const keys: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<Array<Key>>;
/**
 * Retrieves all successfully cached values from the cache, excluding failed
 * lookups and expired entries.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const values: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<Array<A>>;
/**
 * Retrieves all key-value pairs from the cache as an iterable. This function
 * only returns entries with successfully resolved values, filtering out any
 * failed lookups or expired entries.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const entries: <Key, A, E, R>(self: ScopedCache<Key, A, E, R>) => Effect.Effect<Array<[Key, A]>>;
export {};
//# sourceMappingURL=ScopedCache.d.ts.map