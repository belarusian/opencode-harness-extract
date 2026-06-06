/**
 * The `SynchronizedRef` module provides mutable references whose updates are
 * serialized, including updates that run effects before deciding the next
 * value. A `SynchronizedRef<A>` behaves like a `Ref<A>` for reading and basic
 * updates, but uses an internal semaphore so concurrent modifications observe a
 * consistent current value and apply one at a time.
 *
 * **When to use**
 *
 * - Coordinating shared state that may be updated by many fibers
 * - Running effectful state transitions that must not overlap
 * - Computing both a return value and a new stored value atomically
 * - Applying partial updates with `Option`, where `None` leaves the value
 *   unchanged
 *
 * **Gotchas**
 *
 * - Effectful update functions run while the semaphore is held, so long-running
 *   effects delay other updates to the same ref
 * - Failed effectful updates do not replace the stored value
 * - `getUnsafe` and `makeUnsafe` bypass the `Effect` API and should be reserved
 *   for low-level or carefully controlled code
 *
 * @since 2.0.0
 */
import * as Effect from "./Effect.ts";
import * as Option from "./Option.ts";
import * as Ref from "./Ref.ts";
import * as Semaphore from "./Semaphore.ts";
declare const TypeId = "~effect/SynchronizedRef";
/**
 * A mutable reference whose update and modify operations are serialized with an
 * internal semaphore, including effectful transformations.
 *
 * @category models
 * @since 2.0.0
 */
export interface SynchronizedRef<in out A> extends Ref.Ref<A> {
    readonly [TypeId]: typeof TypeId;
    readonly backing: Ref.Ref<A>;
    readonly semaphore: Semaphore.Semaphore;
}
/**
 * Creates a `SynchronizedRef` synchronously from an initial value.
 *
 * **When to use**
 *
 * This bypasses `Effect` construction; prefer `make` in effectful code.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeUnsafe: <A>(value: A) => SynchronizedRef<A>;
/**
 * Creates a `SynchronizedRef` from an initial value, wrapped in an `Effect`.
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const make: <A>(value: A) => Effect.Effect<SynchronizedRef<A>>;
/**
 * Reads the current value synchronously, bypassing the `Effect` API and the
 * ref's semaphore.
 *
 * @category getters
 * @since 4.0.0
 */
export declare const getUnsafe: <A>(self: SynchronizedRef<A>) => A;
/**
 * Returns an `Effect` that reads the current value of the `SynchronizedRef`.
 *
 * @category getters
 * @since 2.0.0
 */
export declare const get: <A>(self: SynchronizedRef<A>) => Effect.Effect<A>;
/**
 * Atomically sets a new value and returns the previous value, serialized by the
 * ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const getAndSet: {
    /**
     * Atomically sets a new value and returns the previous value, serialized by the
     * ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(value: A): (self: SynchronizedRef<A>) => Effect.Effect<A>;
    /**
     * Atomically sets a new value and returns the previous value, serialized by the
     * ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, value: A): Effect.Effect<A>;
};
/**
 * Atomically updates the current value with a function and returns the previous
 * value, serialized by the ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const getAndUpdate: {
    /**
     * Atomically updates the current value with a function and returns the previous
     * value, serialized by the ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(f: (a: A) => A): (self: SynchronizedRef<A>) => Effect.Effect<A>;
    /**
     * Atomically updates the current value with a function and returns the previous
     * value, serialized by the ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, f: (a: A) => A): Effect.Effect<A>;
};
/**
 * Atomically runs an effectful update while holding the ref's semaphore, sets
 * the new value if the effect succeeds, and returns the previous value.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const getAndUpdateEffect: {
    /**
     * Atomically runs an effectful update while holding the ref's semaphore, sets
     * the new value if the effect succeeds, and returns the previous value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(f: (a: A) => Effect.Effect<A, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Atomically runs an effectful update while holding the ref's semaphore, sets
     * the new value if the effect succeeds, and returns the previous value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Atomically applies a partial update and returns the previous value. If the
 * function returns `Option.some`, the ref is updated; if it returns
 * `Option.none`, the ref is left unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const getAndUpdateSome: {
    /**
     * Atomically applies a partial update and returns the previous value. If the
     * function returns `Option.some`, the ref is updated; if it returns
     * `Option.none`, the ref is left unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(pf: (a: A) => Option.Option<A>): (self: SynchronizedRef<A>) => Effect.Effect<A>;
    /**
     * Atomically applies a partial update and returns the previous value. If the
     * function returns `Option.some`, the ref is updated; if it returns
     * `Option.none`, the ref is left unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, pf: (a: A) => Option.Option<A>): Effect.Effect<A>;
};
/**
 * Atomically runs an effectful partial update while holding the ref's semaphore
 * and returns the previous value. `Option.some` updates the ref; `Option.none`
 * leaves it unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const getAndUpdateSomeEffect: {
    /**
     * Atomically runs an effectful partial update while holding the ref's semaphore
     * and returns the previous value. `Option.some` updates the ref; `Option.none`
     * leaves it unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Atomically runs an effectful partial update while holding the ref's semaphore
     * and returns the previous value. `Option.some` updates the ref; `Option.none`
     * leaves it unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Atomically computes a return value and a new ref value, stores the new value,
 * and returns the computed result.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const modify: {
    /**
     * Atomically computes a return value and a new ref value, stores the new value,
     * and returns the computed result.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, B>(f: (a: A) => readonly [B, A]): (self: SynchronizedRef<A>) => Effect.Effect<B>;
    /**
     * Atomically computes a return value and a new ref value, stores the new value,
     * and returns the computed result.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, B>(self: SynchronizedRef<A>, f: (a: A) => readonly [B, A]): Effect.Effect<B>;
};
/**
 * Atomically runs an effectful modification while holding the ref's semaphore,
 * stores the new value if the effect succeeds, and returns the computed result.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const modifyEffect: {
    /**
     * Atomically runs an effectful modification while holding the ref's semaphore,
     * stores the new value if the effect succeeds, and returns the computed result.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, B, E, R>(f: (a: A) => Effect.Effect<readonly [B, A], E, R>): (self: SynchronizedRef<A>) => Effect.Effect<B, E, R>;
    /**
     * Atomically runs an effectful modification while holding the ref's semaphore,
     * stores the new value if the effect succeeds, and returns the computed result.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, B, E, R>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<readonly [B, A], E, R>): Effect.Effect<B, E, R>;
};
/**
 * Atomically computes a return value and an optional new ref value.
 * `Option.some` updates the ref; `Option.none` leaves it unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const modifySome: {
    /**
     * Atomically computes a return value and an optional new ref value.
     * `Option.some` updates the ref; `Option.none` leaves it unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <B, A>(pf: (a: A) => readonly [B, Option.Option<A>]): (self: SynchronizedRef<A>) => Effect.Effect<B>;
    /**
     * Atomically computes a return value and an optional new ref value.
     * `Option.some` updates the ref; `Option.none` leaves it unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, B>(self: SynchronizedRef<A>, pf: (a: A) => readonly [B, Option.Option<A>]): Effect.Effect<B>;
};
/**
 * Atomically runs an effectful modification while holding the ref's semaphore.
 * The effect computes a return value and an optional new ref value;
 * `Option.some` updates the ref and `Option.none` leaves it unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const modifySomeEffect: {
    /**
     * Atomically runs an effectful modification while holding the ref's semaphore.
     * The effect computes a return value and an optional new ref value;
     * `Option.some` updates the ref and `Option.none` leaves it unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, B, R, E>(fallback: B, pf: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): (self: SynchronizedRef<A>) => Effect.Effect<B, E, R>;
    /**
     * Atomically runs an effectful modification while holding the ref's semaphore.
     * The effect computes a return value and an optional new ref value;
     * `Option.some` updates the ref and `Option.none` leaves it unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, B, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): Effect.Effect<B, E, R>;
};
/**
 * Sets the value of the `SynchronizedRef`, serialized by the ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const set: {
    /**
     * Sets the value of the `SynchronizedRef`, serialized by the ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(value: A): (self: SynchronizedRef<A>) => Effect.Effect<void>;
    /**
     * Sets the value of the `SynchronizedRef`, serialized by the ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, value: A): Effect.Effect<void>;
};
/**
 * Sets the value of the `SynchronizedRef` and returns the new value.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const setAndGet: {
    /**
     * Sets the value of the `SynchronizedRef` and returns the new value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(value: A): (self: SynchronizedRef<A>) => Effect.Effect<A>;
    /**
     * Sets the value of the `SynchronizedRef` and returns the new value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, value: A): Effect.Effect<A>;
};
/**
 * Updates the value of the `SynchronizedRef` with a function, serialized by the
 * ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const update: {
    /**
     * Updates the value of the `SynchronizedRef` with a function, serialized by the
     * ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(f: (a: A) => A): (self: SynchronizedRef<A>) => Effect.Effect<void>;
    /**
     * Updates the value of the `SynchronizedRef` with a function, serialized by the
     * ref's semaphore.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, f: (a: A) => A): Effect.Effect<void>;
};
/**
 * Runs an effectful update while holding the ref's semaphore and stores the new
 * value if the effect succeeds.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const updateEffect: {
    /**
     * Runs an effectful update while holding the ref's semaphore and stores the new
     * value if the effect succeeds.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(f: (a: A) => Effect.Effect<A, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<void, E, R>;
    /**
     * Runs an effectful update while holding the ref's semaphore and stores the new
     * value if the effect succeeds.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<void, E, R>;
};
/**
 * Updates the value of the `SynchronizedRef` with a function and returns the
 * new value.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const updateAndGet: {
    /**
     * Updates the value of the `SynchronizedRef` with a function and returns the
     * new value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(f: (a: A) => A): (self: SynchronizedRef<A>) => Effect.Effect<A>;
    /**
     * Updates the value of the `SynchronizedRef` with a function and returns the
     * new value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, f: (a: A) => A): Effect.Effect<A>;
};
/**
 * Runs an effectful update while holding the ref's semaphore, stores the new
 * value if the effect succeeds, and returns that new value.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const updateAndGetEffect: {
    /**
     * Runs an effectful update while holding the ref's semaphore, stores the new
     * value if the effect succeeds, and returns that new value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(f: (a: A) => Effect.Effect<A, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Runs an effectful update while holding the ref's semaphore, stores the new
     * value if the effect succeeds, and returns that new value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(self: SynchronizedRef<A>, f: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Applies a partial update to the current value. `Option.some` stores the new
 * value; `Option.none` leaves the ref unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const updateSome: {
    /**
     * Applies a partial update to the current value. `Option.some` stores the new
     * value; `Option.none` leaves the ref unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(f: (a: A) => Option.Option<A>): (self: SynchronizedRef<A>) => Effect.Effect<void>;
    /**
     * Applies a partial update to the current value. `Option.some` stores the new
     * value; `Option.none` leaves the ref unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, f: (a: A) => Option.Option<A>): Effect.Effect<void>;
};
/**
 * Runs an effectful partial update while holding the ref's semaphore.
 * `Option.some` stores the new value; `Option.none` leaves the ref unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const updateSomeEffect: {
    /**
     * Runs an effectful partial update while holding the ref's semaphore.
     * `Option.some` stores the new value; `Option.none` leaves the ref unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<void, E, R>;
    /**
     * Runs an effectful partial update while holding the ref's semaphore.
     * `Option.some` stores the new value; `Option.none` leaves the ref unchanged.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<void, E, R>;
};
/**
 * Applies a partial update and returns the resulting current value.
 * `Option.some` stores and returns the new value; `Option.none` returns the
 * unchanged value.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const updateSomeAndGet: {
    /**
     * Applies a partial update and returns the resulting current value.
     * `Option.some` stores and returns the new value; `Option.none` returns the
     * unchanged value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(pf: (a: A) => Option.Option<A>): (self: SynchronizedRef<A>) => Effect.Effect<A>;
    /**
     * Applies a partial update and returns the resulting current value.
     * `Option.some` stores and returns the new value; `Option.none` returns the
     * unchanged value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A>(self: SynchronizedRef<A>, pf: (a: A) => Option.Option<A>): Effect.Effect<A>;
};
/**
 * Runs an effectful partial update while holding the ref's semaphore and
 * returns the resulting current value. `Option.some` stores and returns the new
 * value; `Option.none` returns the unchanged value.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const updateSomeAndGetEffect: {
    /**
     * Runs an effectful partial update while holding the ref's semaphore and
     * returns the resulting current value. `Option.some` stores and returns the new
     * value; `Option.none` returns the unchanged value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SynchronizedRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Runs an effectful partial update while holding the ref's semaphore and
     * returns the resulting current value. `Option.some` stores and returns the new
     * value; `Option.none` returns the unchanged value.
     *
     * @category utils
     * @since 2.0.0
     */
    <A, R, E>(self: SynchronizedRef<A>, pf: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>;
};
export {};
//# sourceMappingURL=SynchronizedRef.d.ts.map