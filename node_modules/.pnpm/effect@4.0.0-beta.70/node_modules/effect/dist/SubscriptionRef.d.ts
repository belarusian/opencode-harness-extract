/**
 * The `SubscriptionRef` module provides a mutable reference that can be read
 * and updated like a `Ref`, while also exposing a stream of its current value
 * and every subsequent change. It is useful when one part of an application
 * owns evolving state and many fibers need to subscribe to consistent updates,
 * such as configuration, coordination state, cached snapshots, or UI models.
 *
 * Updates are serialized with an internal semaphore and each update is
 * published to subscribers. The {@link changes} stream replays the latest value
 * first, then emits future updates, so new subscribers can start from the
 * current state without performing a separate read. Prefer the effectful
 * getters and update operations for concurrent code; the unsafe helpers bypass
 * synchronization and should only be used when the caller already controls
 * access.
 *
 * @since 2.0.0
 */
import * as Effect from "./Effect.ts";
import * as Option from "./Option.ts";
import type { Pipeable } from "./Pipeable.ts";
import * as PubSub from "./PubSub.ts";
import * as Semaphore from "./Semaphore.ts";
import * as Stream from "./Stream.ts";
import type { Invariant } from "./Types.ts";
declare const TypeId = "~effect/SubscriptionRef";
/**
 * A mutable reference whose updates are serialized and published to
 * subscribers.
 *
 * **When to use**
 *
 * Use `changes` to observe the current value and subsequent updates as a
 * stream.
 *
 * @category models
 * @since 2.0.0
 */
export interface SubscriptionRef<in out A> extends SubscriptionRef.Variance<A>, Pipeable {
    value: A;
    readonly semaphore: Semaphore.Semaphore;
    readonly pubsub: PubSub.PubSub<A>;
}
/**
 * Returns `true` if the provided value is a `SubscriptionRef`.
 *
 * @category guards
 * @since 4.0.0
 */
export declare const isSubscriptionRef: (u: unknown) => u is SubscriptionRef<unknown>;
/**
 * The `SubscriptionRef` namespace containing type definitions associated with
 * subscription references.
 *
 * @since 2.0.0
 */
export declare namespace SubscriptionRef {
    /**
     * Type-level variance marker for the value type carried by a
     * `SubscriptionRef`.
     *
     * @category models
     * @since 2.0.0
     */
    interface Variance<in out A> {
        readonly [TypeId]: {
            readonly _A: Invariant<A>;
        };
    }
}
/**
 * Constructs a new `SubscriptionRef` from an initial value.
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const make: <A>(value: A) => Effect.Effect<SubscriptionRef<A>>;
/**
 * Creates a stream that emits the current value and all subsequent changes to
 * the `SubscriptionRef`.
 *
 * **Details**
 *
 * The stream will first emit the current value, then emit all future changes
 * as they occur.
 *
 * **Example** (Streaming changes)
 *
 * ```ts
 * import { Deferred, Effect, Fiber, Stream, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(0)
 *   const ready = yield* Deferred.make<void>()
 *
 *   const fiber = yield* SubscriptionRef.changes(ref).pipe(
 *     Stream.tap(() => Deferred.succeed(ready, void 0)),
 *     Stream.take(3),
 *     Stream.runCollect,
 *     Effect.forkChild
 *   )
 *
 *   yield* Deferred.await(ready)
 *   yield* SubscriptionRef.set(ref, 1)
 *   yield* SubscriptionRef.set(ref, 2)
 *
 *   const values = yield* Fiber.join(fiber)
 *   console.log(values) // [ 0, 1, 2 ]
 * })
 *
 * Effect.runPromise(program)
 * ```
 *
 * @category changes
 * @since 4.0.0
 */
export declare const changes: <A>(self: SubscriptionRef<A>) => Stream.Stream<A>;
/**
 * Unsafely retrieves the current value of the `SubscriptionRef`.
 *
 * **Gotchas**
 *
 * This function directly accesses the underlying reference without any
 * synchronization. It should only be used when you are certain there are no
 * concurrent modifications.
 *
 * **Example** (Reading the current value unsafely)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(42)
 *
 *   const value = SubscriptionRef.getUnsafe(ref)
 *   console.log(value)
 * })
 * ```
 *
 * @category getters
 * @since 4.0.0
 */
export declare const getUnsafe: <A>(self: SubscriptionRef<A>) => A;
/**
 * Retrieves the current value of the `SubscriptionRef`.
 *
 * **Example** (Reading the current value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(42)
 *
 *   const value = yield* SubscriptionRef.get(ref)
 *   console.log(value)
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export declare const get: <A>(self: SubscriptionRef<A>) => Effect.Effect<A>;
/**
 * Atomically retrieves the current value and sets a new value, notifying
 * subscribers of the change.
 *
 * **Example** (Getting and setting a value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const oldValue = yield* SubscriptionRef.getAndSet(ref, 20)
 *   console.log("Old value:", oldValue)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export declare const getAndSet: {
    /**
     * Atomically retrieves the current value and sets a new value, notifying
     * subscribers of the change.
     *
     * **Example** (Getting and setting a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndSet(ref, 20)
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A>(value: A): (self: SubscriptionRef<A>) => Effect.Effect<A>;
    /**
     * Atomically retrieves the current value and sets a new value, notifying
     * subscribers of the change.
     *
     * **Example** (Getting and setting a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndSet(ref, 20)
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, value: A): Effect.Effect<A>;
};
/**
 * Atomically retrieves the current value and updates it with the result of
 * applying a function, notifying subscribers of the change.
 *
 * **Example** (Getting and updating a value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const oldValue = yield* SubscriptionRef.getAndUpdate(ref, (n) => n * 2)
 *   console.log("Old value:", oldValue)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export declare const getAndUpdate: {
    /**
     * Atomically retrieves the current value and updates it with the result of
     * applying a function, notifying subscribers of the change.
     *
     * **Example** (Getting and updating a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdate(ref, (n) => n * 2)
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A>(update: (a: A) => A): (self: SubscriptionRef<A>) => Effect.Effect<A>;
    /**
     * Atomically retrieves the current value and updates it with the result of
     * applying a function, notifying subscribers of the change.
     *
     * **Example** (Getting and updating a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdate(ref, (n) => n * 2)
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, update: (a: A) => A): Effect.Effect<A>;
};
/**
 * Atomically retrieves the current value and updates it with the result of
 * applying an effectful function, notifying subscribers of the change.
 *
 * **Example** (Getting and updating with an effect)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const oldValue = yield* SubscriptionRef.getAndUpdateEffect(
 *     ref,
 *     (n) => Effect.succeed(n + 5)
 *   )
 *   console.log("Old value:", oldValue)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export declare const getAndUpdateEffect: {
    /**
     * Atomically retrieves the current value and updates it with the result of
     * applying an effectful function, notifying subscribers of the change.
     *
     * **Example** (Getting and updating with an effect)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdateEffect(
     *     ref,
     *     (n) => Effect.succeed(n + 5)
     *   )
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A, E, R>(update: (a: A) => Effect.Effect<A, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Atomically retrieves the current value and updates it with the result of
     * applying an effectful function, notifying subscribers of the change.
     *
     * **Example** (Getting and updating with an effect)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdateEffect(
     *     ref,
     *     (n) => Effect.succeed(n + 5)
     *   )
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Atomically retrieves the current value and applies an update function. If
 * the function returns `Option.some`, sets and publishes that value; if it
 * returns `Option.none`, leaves the reference unchanged and does not publish.
 *
 * **Example** (Getting and conditionally updating a value)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const oldValue = yield* SubscriptionRef.getAndUpdateSome(
 *     ref,
 *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
 *   )
 *   console.log("Old value:", oldValue)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export declare const getAndUpdateSome: {
    /**
     * Atomically retrieves the current value and applies an update function. If
     * the function returns `Option.some`, sets and publishes that value; if it
     * returns `Option.none`, leaves the reference unchanged and does not publish.
     *
     * **Example** (Getting and conditionally updating a value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdateSome(
     *     ref,
     *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
     *   )
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A>(update: (a: A) => Option.Option<A>): (self: SubscriptionRef<A>) => Effect.Effect<A>;
    /**
     * Atomically retrieves the current value and applies an update function. If
     * the function returns `Option.some`, sets and publishes that value; if it
     * returns `Option.none`, leaves the reference unchanged and does not publish.
     *
     * **Example** (Getting and conditionally updating a value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdateSome(
     *     ref,
     *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
     *   )
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, update: (a: A) => Option.Option<A>): Effect.Effect<A>;
};
/**
 * Atomically retrieves the current value and applies an effectful update
 * function. If it succeeds with `Option.some`, sets and publishes that value;
 * if it succeeds with `Option.none`, leaves the reference unchanged and does
 * not publish.
 *
 * **Example** (Getting and conditionally updating with an effect)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const oldValue = yield* SubscriptionRef.getAndUpdateSomeEffect(
 *     ref,
 *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
 *   )
 *   console.log("Old value:", oldValue)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export declare const getAndUpdateSomeEffect: {
    /**
     * Atomically retrieves the current value and applies an effectful update
     * function. If it succeeds with `Option.some`, sets and publishes that value;
     * if it succeeds with `Option.none`, leaves the reference unchanged and does
     * not publish.
     *
     * **Example** (Getting and conditionally updating with an effect)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdateSomeEffect(
     *     ref,
     *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
     *   )
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A, R, E>(update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Atomically retrieves the current value and applies an effectful update
     * function. If it succeeds with `Option.some`, sets and publishes that value;
     * if it succeeds with `Option.none`, leaves the reference unchanged and does
     * not publish.
     *
     * **Example** (Getting and conditionally updating with an effect)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const oldValue = yield* SubscriptionRef.getAndUpdateSomeEffect(
     *     ref,
     *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
     *   )
     *   console.log("Old value:", oldValue)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category getters
     * @since 2.0.0
     */
    <A, R, E>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Atomically modifies the `SubscriptionRef` with a function that computes a
 * return value and a new value, notifying subscribers of the change.
 *
 * **Example** (Modifying a value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const result = yield* SubscriptionRef.modify(ref, (n) => [
 *     `Old value was ${n}`,
 *     n * 2
 *   ])
 *   console.log(result)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category modifications
 * @since 2.0.0
 */
export declare const modify: {
    /**
     * Atomically modifies the `SubscriptionRef` with a function that computes a
     * return value and a new value, notifying subscribers of the change.
     *
     * **Example** (Modifying a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modify(ref, (n) => [
     *     `Old value was ${n}`,
     *     n * 2
     *   ])
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <A, B>(modify: (a: A) => readonly [B, A]): (self: SubscriptionRef<A>) => Effect.Effect<B>;
    /**
     * Atomically modifies the `SubscriptionRef` with a function that computes a
     * return value and a new value, notifying subscribers of the change.
     *
     * **Example** (Modifying a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modify(ref, (n) => [
     *     `Old value was ${n}`,
     *     n * 2
     *   ])
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <A, B>(self: SubscriptionRef<A>, f: (a: A) => readonly [B, A]): Effect.Effect<B>;
};
/**
 * Atomically modifies the `SubscriptionRef` with an effectful function that
 * computes a return value and a new value, notifying subscribers of the
 * change.
 *
 * **Example** (Modifying with an effect)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const result = yield* SubscriptionRef.modifyEffect(
 *     ref,
 *     (n) => Effect.succeed([`Doubled from ${n}`, n * 2] as const)
 *   )
 *   console.log(result)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category modifications
 * @since 2.0.0
 */
export declare const modifyEffect: {
    /**
     * Atomically modifies the `SubscriptionRef` with an effectful function that
     * computes a return value and a new value, notifying subscribers of the
     * change.
     *
     * **Example** (Modifying with an effect)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modifyEffect(
     *     ref,
     *     (n) => Effect.succeed([`Doubled from ${n}`, n * 2] as const)
     *   )
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <B, A, E, R>(modify: (a: A) => Effect.Effect<readonly [B, A], E, R>): (self: SubscriptionRef<A>) => Effect.Effect<B, E, R>;
    /**
     * Atomically modifies the `SubscriptionRef` with an effectful function that
     * computes a return value and a new value, notifying subscribers of the
     * change.
     *
     * **Example** (Modifying with an effect)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modifyEffect(
     *     ref,
     *     (n) => Effect.succeed([`Doubled from ${n}`, n * 2] as const)
     *   )
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <A, B, E, R>(self: SubscriptionRef<A>, modify: (a: A) => Effect.Effect<readonly [B, A], E, R>): Effect.Effect<B, E, R>;
};
/**
 * Atomically computes a return value and an optional new value. If the function
 * returns `Option.some` for the new value, sets and publishes it; if it returns
 * `Option.none`, leaves the reference unchanged and does not publish.
 *
 * **Example** (Conditionally modifying a value)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const result = yield* SubscriptionRef.modifySome(
 *     ref,
 *     (n) =>
 *       n > 5 ? ["Updated", Option.some(n * 2)] : ["Not updated", Option.none()]
 *   )
 *   console.log(result)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category modifications
 * @since 2.0.0
 */
export declare const modifySome: {
    /**
     * Atomically computes a return value and an optional new value. If the function
     * returns `Option.some` for the new value, sets and publishes it; if it returns
     * `Option.none`, leaves the reference unchanged and does not publish.
     *
     * **Example** (Conditionally modifying a value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modifySome(
     *     ref,
     *     (n) =>
     *       n > 5 ? ["Updated", Option.some(n * 2)] : ["Not updated", Option.none()]
     *   )
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <B, A>(modify: (a: A) => readonly [B, Option.Option<A>]): (self: SubscriptionRef<A>) => Effect.Effect<B>;
    /**
     * Atomically computes a return value and an optional new value. If the function
     * returns `Option.some` for the new value, sets and publishes it; if it returns
     * `Option.none`, leaves the reference unchanged and does not publish.
     *
     * **Example** (Conditionally modifying a value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modifySome(
     *     ref,
     *     (n) =>
     *       n > 5 ? ["Updated", Option.some(n * 2)] : ["Not updated", Option.none()]
     *   )
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <A, B>(self: SubscriptionRef<A>, modify: (a: A) => readonly [B, Option.Option<A>]): Effect.Effect<B>;
};
/**
 * Atomically computes a return value and an optional new value with an
 * effectful function. If the effect succeeds with `Option.some`, sets and
 * publishes the new value; if it succeeds with `Option.none`, leaves the
 * reference unchanged and does not publish.
 *
 * **Example** (Conditionally modifying with an effect)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const result = yield* SubscriptionRef.modifySomeEffect(
 *     ref,
 *     (n) =>
 *       Effect.succeed(
 *         n > 5
 *           ? (["Updated", Option.some(n + 5)] as const)
 *           : (["Not updated", Option.none()] as const)
 *       )
 *   )
 *   console.log(result)
 *
 *   const newValue = yield* SubscriptionRef.get(ref)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category modifications
 * @since 2.0.0
 */
export declare const modifySomeEffect: {
    /**
     * Atomically computes a return value and an optional new value with an
     * effectful function. If the effect succeeds with `Option.some`, sets and
     * publishes the new value; if it succeeds with `Option.none`, leaves the
     * reference unchanged and does not publish.
     *
     * **Example** (Conditionally modifying with an effect)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modifySomeEffect(
     *     ref,
     *     (n) =>
     *       Effect.succeed(
     *         n > 5
     *           ? (["Updated", Option.some(n + 5)] as const)
     *           : (["Not updated", Option.none()] as const)
     *       )
     *   )
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <A, B, R, E>(modify: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): (self: SubscriptionRef<A>) => Effect.Effect<B, E, R>;
    /**
     * Atomically computes a return value and an optional new value with an
     * effectful function. If the effect succeeds with `Option.some`, sets and
     * publishes the new value; if it succeeds with `Option.none`, leaves the
     * reference unchanged and does not publish.
     *
     * **Example** (Conditionally modifying with an effect)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const result = yield* SubscriptionRef.modifySomeEffect(
     *     ref,
     *     (n) =>
     *       Effect.succeed(
     *         n > 5
     *           ? (["Updated", Option.some(n + 5)] as const)
     *           : (["Not updated", Option.none()] as const)
     *       )
     *   )
     *   console.log(result)
     *
     *   const newValue = yield* SubscriptionRef.get(ref)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category modifications
     * @since 2.0.0
     */
    <A, B, R, E>(self: SubscriptionRef<A>, modify: (a: A) => Effect.Effect<readonly [B, Option.Option<A>], E, R>): Effect.Effect<B, E, R>;
};
/**
 * Sets the value of the `SubscriptionRef`, notifying all subscribers of the
 * change.
 *
 * **Example** (Setting a value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(0)
 *
 *   yield* SubscriptionRef.set(ref, 42)
 *
 *   const value = yield* SubscriptionRef.get(ref)
 *   console.log(value)
 * })
 * ```
 *
 * @category setters
 * @since 2.0.0
 */
export declare const set: {
    /**
     * Sets the value of the `SubscriptionRef`, notifying all subscribers of the
     * change.
     *
     * **Example** (Setting a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(0)
     *
     *   yield* SubscriptionRef.set(ref, 42)
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category setters
     * @since 2.0.0
     */
    <A>(value: A): (self: SubscriptionRef<A>) => Effect.Effect<void>;
    /**
     * Sets the value of the `SubscriptionRef`, notifying all subscribers of the
     * change.
     *
     * **Example** (Setting a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(0)
     *
     *   yield* SubscriptionRef.set(ref, 42)
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category setters
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, value: A): Effect.Effect<void>;
};
/**
 * Sets the value of the `SubscriptionRef` and returns the new value,
 * notifying all subscribers of the change.
 *
 * **Example** (Setting and reading the new value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(0)
 *
 *   const newValue = yield* SubscriptionRef.setAndGet(ref, 42)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category setters
 * @since 2.0.0
 */
export declare const setAndGet: {
    /**
     * Sets the value of the `SubscriptionRef` and returns the new value,
     * notifying all subscribers of the change.
     *
     * **Example** (Setting and reading the new value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(0)
     *
     *   const newValue = yield* SubscriptionRef.setAndGet(ref, 42)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category setters
     * @since 2.0.0
     */
    <A>(value: A): (self: SubscriptionRef<A>) => Effect.Effect<A>;
    /**
     * Sets the value of the `SubscriptionRef` and returns the new value,
     * notifying all subscribers of the change.
     *
     * **Example** (Setting and reading the new value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(0)
     *
     *   const newValue = yield* SubscriptionRef.setAndGet(ref, 42)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category setters
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, value: A): Effect.Effect<A>;
};
/**
 * Updates the value of the `SubscriptionRef` with the result of applying a
 * function, notifying subscribers of the change.
 *
 * **Example** (Updating a value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   yield* SubscriptionRef.update(ref, (n) => n * 2)
 *
 *   const value = yield* SubscriptionRef.get(ref)
 *   console.log(value)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const update: {
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying a
     * function, notifying subscribers of the change.
     *
     * **Example** (Updating a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.update(ref, (n) => n * 2)
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(update: (a: A) => A): (self: SubscriptionRef<A>) => Effect.Effect<void>;
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying a
     * function, notifying subscribers of the change.
     *
     * **Example** (Updating a value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.update(ref, (n) => n * 2)
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, update: (a: A) => A): Effect.Effect<void>;
};
/**
 * Updates the value of the `SubscriptionRef` with the result of applying an
 * effectful function, notifying subscribers of the change.
 *
 * **Example** (Updating with an effect)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   yield* SubscriptionRef.updateEffect(ref, (n) => Effect.succeed(n + 5))
 *
 *   const value = yield* SubscriptionRef.get(ref)
 *   console.log(value)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const updateEffect: {
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying an
     * effectful function, notifying subscribers of the change.
     *
     * **Example** (Updating with an effect)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.updateEffect(ref, (n) => Effect.succeed(n + 5))
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(update: (a: A) => Effect.Effect<A, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<void, E, R>;
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying an
     * effectful function, notifying subscribers of the change.
     *
     * **Example** (Updating with an effect)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.updateEffect(ref, (n) => Effect.succeed(n + 5))
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<void, E, R>;
};
/**
 * Updates the value of the `SubscriptionRef` with the result of applying a
 * function and returns the new value, notifying subscribers of the change.
 *
 * **Example** (Updating and reading the new value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const newValue = yield* SubscriptionRef.updateAndGet(ref, (n) => n * 2)
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const updateAndGet: {
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying a
     * function and returns the new value, notifying subscribers of the change.
     *
     * **Example** (Updating and reading the new value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateAndGet(ref, (n) => n * 2)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(update: (a: A) => A): (self: SubscriptionRef<A>) => Effect.Effect<A>;
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying a
     * function and returns the new value, notifying subscribers of the change.
     *
     * **Example** (Updating and reading the new value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateAndGet(ref, (n) => n * 2)
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, update: (a: A) => A): Effect.Effect<A>;
};
/**
 * Updates the value of the `SubscriptionRef` with the result of applying an
 * effectful function and returns the new value, notifying subscribers of the
 * change.
 *
 * **Example** (Updating with an effect and reading the new value)
 *
 * ```ts
 * import { Effect, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const newValue = yield* SubscriptionRef.updateAndGetEffect(
 *     ref,
 *     (n) => Effect.succeed(n + 5)
 *   )
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const updateAndGetEffect: {
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying an
     * effectful function and returns the new value, notifying subscribers of the
     * change.
     *
     * **Example** (Updating with an effect and reading the new value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateAndGetEffect(
     *     ref,
     *     (n) => Effect.succeed(n + 5)
     *   )
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(update: (a: A) => Effect.Effect<A, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Updates the value of the `SubscriptionRef` with the result of applying an
     * effectful function and returns the new value, notifying subscribers of the
     * change.
     *
     * **Example** (Updating with an effect and reading the new value)
     *
     * ```ts
     * import { Effect, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateAndGetEffect(
     *     ref,
     *     (n) => Effect.succeed(n + 5)
     *   )
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<A, E, R>): Effect.Effect<A, E, R>;
};
/**
 * Applies an update function to the current value. If it returns
 * `Option.some`, sets and publishes that value; if it returns `Option.none`,
 * leaves the reference unchanged and does not publish.
 *
 * **Example** (Conditionally updating a value)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   yield* SubscriptionRef.updateSome(
 *     ref,
 *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
 *   )
 *
 *   const value = yield* SubscriptionRef.get(ref)
 *   console.log(value)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const updateSome: {
    /**
     * Applies an update function to the current value. If it returns
     * `Option.some`, sets and publishes that value; if it returns `Option.none`,
     * leaves the reference unchanged and does not publish.
     *
     * **Example** (Conditionally updating a value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.updateSome(
     *     ref,
     *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
     *   )
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(update: (a: A) => Option.Option<A>): (self: SubscriptionRef<A>) => Effect.Effect<void>;
    /**
     * Applies an update function to the current value. If it returns
     * `Option.some`, sets and publishes that value; if it returns `Option.none`,
     * leaves the reference unchanged and does not publish.
     *
     * **Example** (Conditionally updating a value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.updateSome(
     *     ref,
     *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
     *   )
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, update: (a: A) => Option.Option<A>): Effect.Effect<void>;
};
/**
 * Applies an effectful update function to the current value. If it succeeds
 * with `Option.some`, sets and publishes that value; if it succeeds with
 * `Option.none`, leaves the reference unchanged and does not publish.
 *
 * **Example** (Conditionally updating with an effect)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   yield* SubscriptionRef.updateSomeEffect(
 *     ref,
 *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
 *   )
 *
 *   const value = yield* SubscriptionRef.get(ref)
 *   console.log(value)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const updateSomeEffect: {
    /**
     * Applies an effectful update function to the current value. If it succeeds
     * with `Option.some`, sets and publishes that value; if it succeeds with
     * `Option.none`, leaves the reference unchanged and does not publish.
     *
     * **Example** (Conditionally updating with an effect)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.updateSomeEffect(
     *     ref,
     *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
     *   )
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<void, E, R>;
    /**
     * Applies an effectful update function to the current value. If it succeeds
     * with `Option.some`, sets and publishes that value; if it succeeds with
     * `Option.none`, leaves the reference unchanged and does not publish.
     *
     * **Example** (Conditionally updating with an effect)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   yield* SubscriptionRef.updateSomeEffect(
     *     ref,
     *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
     *   )
     *
     *   const value = yield* SubscriptionRef.get(ref)
     *   console.log(value)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<void, E, R>;
};
/**
 * Applies an update function and returns the resulting current value. If the
 * function returns `Option.some`, sets, publishes, and returns that value; if
 * it returns `Option.none`, returns the unchanged current value without
 * publishing.
 *
 * **Example** (Conditionally updating and reading the new value)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const newValue = yield* SubscriptionRef.updateSomeAndGet(
 *     ref,
 *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
 *   )
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const updateSomeAndGet: {
    /**
     * Applies an update function and returns the resulting current value. If the
     * function returns `Option.some`, sets, publishes, and returns that value; if
     * it returns `Option.none`, returns the unchanged current value without
     * publishing.
     *
     * **Example** (Conditionally updating and reading the new value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateSomeAndGet(
     *     ref,
     *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
     *   )
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(update: (a: A) => Option.Option<A>): (self: SubscriptionRef<A>) => Effect.Effect<A>;
    /**
     * Applies an update function and returns the resulting current value. If the
     * function returns `Option.some`, sets, publishes, and returns that value; if
     * it returns `Option.none`, returns the unchanged current value without
     * publishing.
     *
     * **Example** (Conditionally updating and reading the new value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateSomeAndGet(
     *     ref,
     *     (n) => n > 5 ? Option.some(n * 2) : Option.none()
     *   )
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A>(self: SubscriptionRef<A>, update: (a: A) => Option.Option<A>): Effect.Effect<A>;
};
/**
 * Applies an effectful update function and returns the resulting current
 * value. If the effect succeeds with `Option.some`, sets, publishes, and
 * returns that value; if it succeeds with `Option.none`, returns the unchanged
 * current value without publishing.
 *
 * **Example** (Conditionally updating with an effect and reading the new value)
 *
 * ```ts
 * import { Effect, Option, SubscriptionRef } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const ref = yield* SubscriptionRef.make(10)
 *
 *   const newValue = yield* SubscriptionRef.updateSomeAndGetEffect(
 *     ref,
 *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
 *   )
 *   console.log("New value:", newValue)
 * })
 * ```
 *
 * @category updating
 * @since 2.0.0
 */
export declare const updateSomeAndGetEffect: {
    /**
     * Applies an effectful update function and returns the resulting current
     * value. If the effect succeeds with `Option.some`, sets, publishes, and
     * returns that value; if it succeeds with `Option.none`, returns the unchanged
     * current value without publishing.
     *
     * **Example** (Conditionally updating with an effect and reading the new value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateSomeAndGetEffect(
     *     ref,
     *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
     *   )
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): (self: SubscriptionRef<A>) => Effect.Effect<A, E, R>;
    /**
     * Applies an effectful update function and returns the resulting current
     * value. If the effect succeeds with `Option.some`, sets, publishes, and
     * returns that value; if it succeeds with `Option.none`, returns the unchanged
     * current value without publishing.
     *
     * **Example** (Conditionally updating with an effect and reading the new value)
     *
     * ```ts
     * import { Effect, Option, SubscriptionRef } from "effect"
     *
     * const program = Effect.gen(function*() {
     *   const ref = yield* SubscriptionRef.make(10)
     *
     *   const newValue = yield* SubscriptionRef.updateSomeAndGetEffect(
     *     ref,
     *     (n) => Effect.succeed(n > 5 ? Option.some(n + 3) : Option.none())
     *   )
     *   console.log("New value:", newValue)
     * })
     * ```
     *
     * @category updating
     * @since 2.0.0
     */
    <A, E, R>(self: SubscriptionRef<A>, update: (a: A) => Effect.Effect<Option.Option<A>, E, R>): Effect.Effect<A, E, R>;
};
export {};
//# sourceMappingURL=SubscriptionRef.d.ts.map