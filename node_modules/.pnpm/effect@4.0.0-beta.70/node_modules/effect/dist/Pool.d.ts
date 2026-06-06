import * as Duration from "./Duration.ts";
import * as Effect from "./Effect.ts";
import type * as Exit from "./Exit.ts";
import * as Latch from "./Latch.ts";
import { type Pipeable } from "./Pipeable.ts";
import * as Scope from "./Scope.ts";
import * as Semaphore from "./Semaphore.ts";
declare const TypeId = "~effect/Pool";
/**
 * A `Pool<A, E>` is a pool of items of type `A`, each of which may be
 * associated with the acquisition and release of resources. An attempt to get
 * an item `A` from a pool may fail with an error of type `E`.
 *
 * @category models
 * @since 2.0.0
 */
export interface Pool<in out A, in out E = never> extends Pipeable {
    readonly [TypeId]: typeof TypeId;
    readonly config: Config<A, E>;
    readonly state: State<A, E>;
}
/**
 * Normalized configuration used by a `Pool`.
 *
 * **Details**
 *
 * The config stores the acquire effect, size bounds, per-item concurrency,
 * target utilization, and resizing strategy used by the pool implementation.
 *
 * @category models
 * @since 4.0.0
 */
export interface Config<A, E> {
    readonly acquire: Effect.Effect<A, E, Scope.Scope>;
    readonly concurrency: number;
    readonly minSize: number;
    readonly maxSize: number;
    readonly strategy: Strategy<A, E>;
    readonly targetUtilization: number;
}
/**
 * Mutable runtime state maintained by a `Pool`.
 *
 * **Details**
 *
 * This state tracks the pool scope, active and available items, invalidated
 * items, semaphores, waiters, and shutdown status. It is exposed for
 * inspection and implementation support; user code should prefer the
 * high-level pool operations.
 *
 * @category models
 * @since 4.0.0
 */
export interface State<A, E> {
    readonly scope: Scope.Scope;
    isShuttingDown: boolean;
    readonly semaphore: Semaphore.Semaphore;
    readonly resizeSemaphore: Semaphore.Semaphore;
    readonly items: Set<PoolItem<A, E>>;
    readonly available: Set<PoolItem<A, E>>;
    readonly availableLatch: Latch.Latch;
    readonly invalidated: Set<PoolItem<A, E>>;
    waiters: number;
}
/**
 * Internal record for a value managed by a `Pool`.
 *
 * **Details**
 *
 * Each item stores the acquisition `Exit`, its finalizer, the current
 * reference count, and whether automatic reclaiming has been disabled because
 * the item was invalidated.
 *
 * @category models
 * @since 4.0.0
 */
export interface PoolItem<A, E> {
    readonly exit: Exit.Exit<A, E>;
    finalizer: Effect.Effect<void>;
    refCount: number;
    disableReclaim: boolean;
}
/**
 * Strategy used by a `Pool` to manage background resizing and item
 * reclamation.
 *
 * **Details**
 *
 * `run` starts any strategy-specific background work, `onAcquire` is invoked
 * when an item is acquired, and `reclaim` selects an item that can be removed
 * or replaced.
 *
 * @category models
 * @since 4.0.0
 */
export interface Strategy<A, E> {
    readonly run: (pool: Pool<A, E>) => Effect.Effect<void>;
    readonly onAcquire: (item: PoolItem<A, E>) => Effect.Effect<void>;
    readonly reclaim: (pool: Pool<A, E>) => Effect.Effect<PoolItem<A, E> | undefined>;
}
/**
 * Returns `true` if the specified value is a `Pool`, `false` otherwise.
 *
 * @category refinements
 * @since 2.0.0
 */
export declare const isPool: (u: unknown) => u is Pool<unknown, unknown>;
/**
 * Makes a new pool of the specified fixed size.
 *
 * **Details**
 *
 * The pool is returned in a `Scope`, which governs the lifetime of the pool.
 * When the pool is shutdown because the `Scope` is closed, the individual
 * items allocated by the pool will be released in some unspecified order.
 *
 * By setting the `concurrency` parameter, you can control the level of concurrent
 * access per pool item. By default, the number of permits is set to `1`.
 *
 * `targetUtilization` determines when to create new pool items. It is a value
 * between 0 and 1, where 1 means only create new pool items when all the existing
 * items are fully utilized.
 *
 * A `targetUtilization` of 0.5 will create new pool items when the existing items are
 * 50% utilized.
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const make: <A, E, R>(options: {
    readonly acquire: Effect.Effect<A, E, R>;
    readonly size: number;
    readonly concurrency?: number | undefined;
    readonly targetUtilization?: number | undefined;
}) => Effect.Effect<Pool<A, E>, never, R | Scope.Scope>;
/**
 * Creates a scoped pool with minimum and maximum sizes and a time-to-live
 * policy for shrinking unused excess items.
 *
 * **Details**
 *
 * The returned pool requires `Scope`; when that scope is closed, allocated
 * items are released in an unspecified order. `concurrency` controls how many
 * fibers may use each pool item at once and defaults to `1`.
 *
 * `targetUtilization` controls when new items are created and is clamped by the
 * pool implementation. A value of `1` waits until existing items are fully
 * utilized before creating more items.
 *
 * `timeToLiveStrategy` controls when excess items expire: `"creation"` measures
 * from item creation, while `"usage"` measures from pool usage. The default is
 * `"usage"`.
 *
 * **Example** (Create a connection pool)
 *
 * ```ts
 * import { Duration, Effect, Pool } from "effect"
 *
 * interface Connection {
 *   readonly execute: (sql: string) => Effect.Effect<ReadonlyArray<string>>
 *   readonly close: Effect.Effect<void>
 * }
 *
 * const acquireDBConnection = Effect.acquireRelease(
 *   Effect.succeed({
 *     execute: (sql) => Effect.succeed([`executed: ${sql}`]),
 *     close: Effect.void
 *   } satisfies Connection),
 *   (connection) => connection.close
 * )
 *
 * const program = Effect.scoped(
 *   Effect.flatMap(
 *     Pool.makeWithTTL({
 *       acquire: acquireDBConnection,
 *       min: 10,
 *       max: 20,
 *       timeToLive: Duration.seconds(60)
 *     }),
 *     (pool) => Effect.flatMap(Pool.get(pool), (connection) => connection.execute("select 1"))
 *   )
 * )
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const makeWithTTL: <A, E, R>(options: {
    readonly acquire: Effect.Effect<A, E, R>;
    readonly min: number;
    readonly max: number;
    readonly concurrency?: number | undefined;
    readonly targetUtilization?: number | undefined;
    readonly timeToLive: Duration.Input;
    readonly timeToLiveStrategy?: "creation" | "usage" | undefined;
}) => Effect.Effect<Pool<A, E>, never, R | Scope.Scope>;
/**
 * Creates a scoped pool using a custom resizing and reclamation strategy.
 *
 * **Details**
 *
 * The returned pool requires `Scope`; closing the scope shuts down the pool and
 * releases allocated items. Use this constructor when `make` and `makeWithTTL`
 * do not provide the desired item lifecycle behavior.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeWithStrategy: <A, E, R>(options: {
    readonly acquire: Effect.Effect<A, E, R>;
    readonly min: number;
    readonly max: number;
    readonly concurrency?: number | undefined;
    readonly targetUtilization?: number | undefined;
    readonly strategy: Strategy<A, E>;
}) => Effect.Effect<Pool<A, E>, never, Scope.Scope | R>;
/**
 * Retrieves an item from the pool in a scoped effect. Note that if
 * acquisition fails, then the returned effect will fail for that same reason.
 * Retrying a failed acquisition attempt will repeat the acquisition attempt.
 *
 * @category getters
 * @since 2.0.0
 */
export declare const get: <A, E>(self: Pool<A, E>) => Effect.Effect<A, E, Scope.Scope>;
/**
 * Invalidates the specified item. This will cause the pool to eventually
 * reallocate the item, although this reallocation may occur lazily rather
 * than eagerly.
 *
 * @category combinators
 * @since 2.0.0
 */
export declare const invalidate: {
    /**
     * Invalidates the specified item. This will cause the pool to eventually
     * reallocate the item, although this reallocation may occur lazily rather
     * than eagerly.
     *
     * @category combinators
     * @since 2.0.0
     */
    <A>(item: A): <E>(self: Pool<A, E>) => Effect.Effect<void, never, Scope.Scope>;
    /**
     * Invalidates the specified item. This will cause the pool to eventually
     * reallocate the item, although this reallocation may occur lazily rather
     * than eagerly.
     *
     * @category combinators
     * @since 2.0.0
     */
    <A, E>(self: Pool<A, E>, item: A): Effect.Effect<void, never, Scope.Scope>;
};
export {};
//# sourceMappingURL=Pool.d.ts.map