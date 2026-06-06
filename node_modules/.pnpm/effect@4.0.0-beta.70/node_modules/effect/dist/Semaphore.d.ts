/**
 * The `Semaphore` module provides a counting semaphore for coordinating
 * concurrent access to shared or limited resources. A semaphore tracks a fixed
 * number of permits: effects acquire permits before entering a critical section
 * and release them when they leave.
 *
 * Use semaphores to bound parallel work, protect rate-limited services, or
 * serialize access to resources that cannot safely handle unlimited
 * concurrency. Prefer {@link withPermit} and {@link withPermits} when possible,
 * because they release permits automatically when the protected effect exits.
 * Use {@link take} and {@link release} for lower-level protocols that need
 * manual control.
 *
 * **Gotchas**
 *
 * - Pending acquisitions wait until enough permits are available.
 * - {@link withPermitsIfAvailable} does not wait; it returns `Option.none` when
 *   the requested permits cannot be acquired immediately.
 * - Manual `take` / `release` usage must keep permit counts balanced.
 *
 * @since 4.0.0
 */
import type * as Effect from "./Effect.ts";
import type * as Option from "./Option.ts";
/**
 * A counting semaphore that coordinates concurrent access with permits.
 *
 * **Details**
 *
 * Effects can acquire permits, wait until enough permits are available,
 * release permits, or run with permits that are automatically released when
 * the effect exits.
 *
 * **Example** (Controlling concurrent access)
 *
 * ```ts
 * import { Effect, Semaphore } from "effect"
 *
 * // Create and use a semaphore for controlling concurrent access
 * const program = Effect.gen(function*() {
 *   const semaphore = yield* Semaphore.make(2)
 *
 *   return yield* semaphore.withPermits(1)(
 *     Effect.succeed("Resource accessed")
 *   )
 * })
 * ```
 *
 * @category models
 * @since 4.0.0
 */
export interface Semaphore {
    /**
     * Adjusts the number of permits available in the semaphore.
     */
    resize(this: Semaphore, permits: number): Effect.Effect<void>;
    /**
     * Runs an effect with the given number of permits and releases the permits
     * when the effect completes.
     *
     * **Details**
     *
     * This function acquires the specified number of permits before executing
     * the provided effect. Once the effect finishes, the permits are released.
     * If insufficient permits are available, the function will wait until they
     * are released by other tasks.
     */
    withPermits(this: Semaphore, permits: number): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    /**
     * Runs an effect with the given number of permits and releases the permits
     * when the effect completes.
     *
     * **Details**
     *
     * This function acquires the specified number of permits before executing
     * the provided effect. Once the effect finishes, the permits are released.
     * If insufficient permits are available, the function will wait until they
     * are released by other tasks.
     */
    withPermit<A, E, R>(self: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
    /**
     * Runs an effect only if the specified number of permits are immediately
     * available.
     *
     * **Details**
     *
     * This function attempts to acquire the specified number of permits. If they
     * are available, it runs the effect and releases the permits after the effect
     * completes. If permits are not available, the effect does not execute, and
     * the result is `Option.none`.
     */
    withPermitsIfAvailable(this: Semaphore, permits: number): <A, E, R>(self: Effect.Effect<A, E, R>) => Effect.Effect<Option.Option<A>, E, R>;
    /**
     * Acquires the specified number of permits and returns the resulting
     * available permits, suspending the task if they are not yet available.
     * Concurrent pending `take` calls are processed in a first-in, first-out manner.
     */
    take(this: Semaphore, permits: number): Effect.Effect<number>;
    /**
     * Releases the specified number of permits and returns the resulting
     * available permits.
     */
    release(this: Semaphore, permits: number): Effect.Effect<number>;
    /**
     * Releases all permits held by this semaphore and returns the resulting available permits.
     */
    readonly releaseAll: Effect.Effect<number>;
}
/**
 * Synchronously creates a `Semaphore` initialized with the specified total
 * number of permits.
 *
 * **When to use**
 *
 * Use this low-level constructor when an immediate semaphore value is required;
 * otherwise prefer the effectful `make` constructor.
 *
 * **Example** (Creating an unsafe semaphore)
 *
 * ```ts
 * import { Effect, Semaphore } from "effect"
 *
 * const semaphore = Semaphore.makeUnsafe(3)
 *
 * const task = (id: number) =>
 *   semaphore.withPermits(1)(
 *     Effect.gen(function*() {
 *       yield* Effect.log(`Task ${id} started`)
 *       yield* Effect.sleep("1 second")
 *       yield* Effect.log(`Task ${id} completed`)
 *     })
 *   )
 *
 * // Only 3 tasks can run concurrently
 * const program = Effect.all([
 *   task(1),
 *   task(2),
 *   task(3),
 *   task(4),
 *   task(5)
 * ], { concurrency: "unbounded" })
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeUnsafe: (permits: number) => Semaphore;
/**
 * Creates a `Semaphore` initialized with the specified total number of permits.
 *
 * **When to use**
 *
 * Use the returned semaphore to limit concurrency with `withPermit` or
 * `withPermits`, or to manually `take` and `release` permits.
 *
 * **Example** (Creating a semaphore)
 *
 * ```ts
 * import { Effect, Semaphore } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const semaphore = yield* Semaphore.make(2)
 *
 *   const task = (id: number) =>
 *     semaphore.withPermits(1)(
 *       Effect.gen(function*() {
 *         yield* Effect.log(`Task ${id} acquired permit`)
 *         yield* Effect.sleep("1 second")
 *         yield* Effect.log(`Task ${id} releasing permit`)
 *       })
 *     )
 *
 *   // Run 4 tasks, but only 2 can run concurrently
 *   yield* Effect.all([task(1), task(2), task(3), task(4)])
 * })
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (permits: number) => Effect.Effect<Semaphore>;
/**
 * Adjusts the number of permits available in the semaphore.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const resize: {
    /**
     * Adjusts the number of permits available in the semaphore.
     *
     * @category combinators
     * @since 4.0.0
     */
    (permits: number): (self: Semaphore) => Effect.Effect<void>;
    /**
     * Adjusts the number of permits available in the semaphore.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Semaphore, permits: number): Effect.Effect<void>;
};
/**
 * Runs an effect with the given number of permits and releases the permits when
 * the effect completes.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const withPermits: {
    /**
     * Runs an effect with the given number of permits and releases the permits when
     * the effect completes.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Semaphore, permits: number): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    /**
     * Runs an effect with the given number of permits and releases the permits when
     * the effect completes.
     *
     * @category combinators
     * @since 4.0.0
     */
    <A, E, R>(self: Semaphore, permits: number, effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Runs an effect with a single permit and releases the permit when the effect
 * completes.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const withPermit: {
    /**
     * Runs an effect with a single permit and releases the permit when the effect
     * completes.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Semaphore): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    /**
     * Runs an effect with a single permit and releases the permit when the effect
     * completes.
     *
     * @category combinators
     * @since 4.0.0
     */
    <A, E, R>(self: Semaphore, effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Runs an effect only if the specified number of permits are immediately
 * available.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const withPermitsIfAvailable: {
    /**
     * Runs an effect only if the specified number of permits are immediately
     * available.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Semaphore, permits: number): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<Option.Option<A>, E, R>;
    /**
     * Runs an effect only if the specified number of permits are immediately
     * available.
     *
     * @category combinators
     * @since 4.0.0
     */
    <A, E, R>(self: Semaphore, permits: number, effect: Effect.Effect<A, E, R>): Effect.Effect<Option.Option<A>, E, R>;
};
/**
 * Acquires the specified number of permits and returns the resulting available
 * permits, suspending the task if they are not yet available.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const take: {
    /**
     * Acquires the specified number of permits and returns the resulting available
     * permits, suspending the task if they are not yet available.
     *
     * @category combinators
     * @since 4.0.0
     */
    (permits: number): (self: Semaphore) => Effect.Effect<number>;
    /**
     * Acquires the specified number of permits and returns the resulting available
     * permits, suspending the task if they are not yet available.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Semaphore, permits: number): Effect.Effect<number>;
};
/**
 * Releases the specified number of permits and returns the resulting available
 * permits.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const release: {
    /**
     * Releases the specified number of permits and returns the resulting available
     * permits.
     *
     * @category combinators
     * @since 4.0.0
     */
    (permits: number): (self: Semaphore) => Effect.Effect<number>;
    /**
     * Releases the specified number of permits and returns the resulting available
     * permits.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Semaphore, permits: number): Effect.Effect<number>;
};
/**
 * Releases all permits held by this semaphore and returns the resulting
 * available permits.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const releaseAll: (self: Semaphore) => Effect.Effect<number>;
//# sourceMappingURL=Semaphore.d.ts.map