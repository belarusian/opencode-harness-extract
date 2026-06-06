/**
 * The `Reactivity` module provides an in-memory service for connecting writes to
 * dependent reads through explicit invalidation keys. It is useful for keeping
 * query results, UI subscriptions, read models, or other derived views fresh
 * after mutations without coupling the writer to every consumer that should
 * rerun.
 *
 * Reads are modeled with {@link query} and {@link stream}: the effect runs once
 * immediately and then runs again whenever one of its keys is invalidated.
 * Writes can use {@link mutation} to invalidate keys only after the wrapped
 * effect succeeds, or call {@link invalidate} directly. Keys may be supplied as
 * a flat collection or as a record of namespaces with ids, which lets callers
 * invalidate both broad groups and individual records.
 *
 * The service tracks handlers by hashed keys and does not cache values by
 * itself; consumers receive fresh queue or stream emissions and decide how to
 * store them. Registrations are tied to the surrounding scope, failures from a
 * query fail the queue or stream, and invalidations that arrive while a query is
 * already running schedule a single follow-up run. Use stable key values, be
 * aware that the default layer is process-local, and use the {@link Reactivity}
 * service when many invalidations should be coalesced until the batch exits.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.ts";
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import * as Queue from "../../Queue.ts";
import type { ReadonlyRecord } from "../../Record.ts";
import * as Scope from "../../Scope.ts";
import * as Stream from "../../Stream.ts";
declare const Reactivity_base: Context.ServiceClass<Reactivity, "effect/reactivity/Reactivity", {
    readonly invalidateUnsafe: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>) => void;
    readonly registerUnsafe: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, handler: () => void) => () => void;
    readonly invalidate: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>) => Effect.Effect<void>;
    readonly mutation: <A, E, R>(keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    readonly query: <A, E, R>(keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, effect: Effect.Effect<A, E, R>) => Effect.Effect<Queue.Dequeue<A, E>, never, R | Scope.Scope>;
    readonly stream: <A, E, R>(keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, effect: Effect.Effect<A, E, R>) => Stream.Stream<A, E, Exclude<R, Scope.Scope>>;
    readonly withBatch: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
}>;
/**
 * A service for key-based reactive invalidation.
 *
 * **Details**
 *
 * The service can register handlers for keys, invalidate those keys, wrap
 * mutations so successful effects invalidate keys, and turn query effects into
 * queues or streams that rerun when keys are invalidated.
 *
 * @category tags
 * @since 4.0.0
 */
export declare class Reactivity extends Reactivity_base {
}
/**
 * Creates an in-memory `Reactivity` service.
 *
 * **Details**
 *
 * The service tracks handlers by hashed keys and runs the registered handlers when
 * matching keys are invalidated.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: Effect.Effect<{
    readonly invalidateUnsafe: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>) => void;
    readonly registerUnsafe: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, handler: () => void) => () => void;
    readonly invalidate: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>) => Effect.Effect<void>;
    readonly mutation: <A, E, R>(keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
    readonly query: <A, E, R>(keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, effect: Effect.Effect<A, E, R>) => Effect.Effect<Queue.Dequeue<A, E>, never, R | Scope.Scope>;
    readonly stream: <A, E, R>(keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>, effect: Effect.Effect<A, E, R>) => Stream.Stream<A, E, Exclude<R, Scope.Scope>>;
    readonly withBatch: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R>;
}, never, never>;
/**
 * Wraps an effect so the supplied keys are invalidated after the effect succeeds.
 *
 * **Gotchas**
 *
 * If the effect fails, the keys are not invalidated.
 *
 * @category accessors
 * @since 4.0.0
 */
export declare const mutation: {
    /**
     * Wraps an effect so the supplied keys are invalidated after the effect succeeds.
     *
     * **Gotchas**
     *
     * If the effect fails, the keys are not invalidated.
     *
     * @category accessors
     * @since 4.0.0
     */
    (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, E, R | Reactivity>;
    /**
     * Wraps an effect so the supplied keys are invalidated after the effect succeeds.
     *
     * **Gotchas**
     *
     * If the effect fails, the keys are not invalidated.
     *
     * @category accessors
     * @since 4.0.0
     */
    <A, E, R>(effect: Effect.Effect<A, E, R>, keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): Effect.Effect<A, E, R | Reactivity>;
};
/**
 * Runs an effect as a query tied to the supplied invalidation keys.
 *
 * **Details**
 *
 * The returned queue receives the initial result and each later result after the
 * keys are invalidated. The registration is removed when the current scope closes.
 *
 * @category accessors
 * @since 4.0.0
 */
export declare const query: {
    /**
     * Runs an effect as a query tied to the supplied invalidation keys.
     *
     * **Details**
     *
     * The returned queue receives the initial result and each later result after the
     * keys are invalidated. The registration is removed when the current scope closes.
     *
     * @category accessors
     * @since 4.0.0
     */
    (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<Queue.Dequeue<A, E>, never, R | Scope.Scope | Reactivity>;
    /**
     * Runs an effect as a query tied to the supplied invalidation keys.
     *
     * **Details**
     *
     * The returned queue receives the initial result and each later result after the
     * keys are invalidated. The registration is removed when the current scope closes.
     *
     * @category accessors
     * @since 4.0.0
     */
    <A, E, R>(effect: Effect.Effect<A, E, R>, keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): Effect.Effect<Queue.Dequeue<A, E>, never, R | Scope.Scope | Reactivity>;
};
/**
 * Runs an effect as a stream of query results tied to the supplied invalidation
 * keys.
 *
 * **Details**
 *
 * The effect runs initially and reruns whenever the keys are invalidated.
 *
 * @category accessors
 * @since 4.0.0
 */
export declare const stream: {
    /**
     * Runs an effect as a stream of query results tied to the supplied invalidation
     * keys.
     *
     * **Details**
     *
     * The effect runs initially and reruns whenever the keys are invalidated.
     *
     * @category accessors
     * @since 4.0.0
     */
    (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): <A, E, R>(effect: Effect.Effect<A, E, R>) => Stream.Stream<A, E, Exclude<R, Scope.Scope> | Reactivity>;
    /**
     * Runs an effect as a stream of query results tied to the supplied invalidation
     * keys.
     *
     * **Details**
     *
     * The effect runs initially and reruns whenever the keys are invalidated.
     *
     * @category accessors
     * @since 4.0.0
     */
    <A, E, R>(effect: Effect.Effect<A, E, R>, keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>): Stream.Stream<A, E, Exclude<R, Scope.Scope> | Reactivity>;
};
/**
 * Invalidates the supplied keys through the `Reactivity` service.
 *
 * **Details**
 *
 * Registered queries for matching keys are rerun immediately, or collected until
 * the enclosing reactivity batch completes.
 *
 * @category accessors
 * @since 4.0.0
 */
export declare const invalidate: (keys: ReadonlyArray<unknown> | ReadonlyRecord<string, ReadonlyArray<unknown>>) => Effect.Effect<void, never, Reactivity>;
/**
 * The default layer that provides an in-memory `Reactivity` service.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<Reactivity>;
export {};
//# sourceMappingURL=Reactivity.d.ts.map