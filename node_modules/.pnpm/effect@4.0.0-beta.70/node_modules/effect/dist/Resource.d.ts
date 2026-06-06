import * as Effect from "./Effect.ts";
import * as Exit from "./Exit.ts";
import type { Pipeable } from "./Pipeable.ts";
import type * as Schedule from "./Schedule.ts";
import type * as Scope from "./Scope.ts";
import * as ScopedRef from "./ScopedRef.ts";
declare const TypeId: "~effect/Resource";
/**
 * A `Resource` is a value loaded into memory that can be refreshed manually or
 * automatically according to a schedule.
 *
 * @category models
 * @since 2.0.0
 */
export interface Resource<in out A, in out E = never> extends Pipeable {
    readonly [TypeId]: typeof TypeId;
    readonly scopedRef: ScopedRef.ScopedRef<Exit.Exit<A, E>>;
    readonly acquire: Effect.Effect<A, E>;
}
/**
 * Returns `true` if the specified value is a `Resource`.
 *
 * @category guards
 * @since 4.0.0
 */
export declare const isResource: (u: unknown) => u is Resource<unknown, unknown>;
/**
 * Creates a `Resource` that must be refreshed manually.
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const manual: <A, E, R>(acquire: Effect.Effect<A, E, R>) => Effect.Effect<Resource<A, E>, never, Scope.Scope | R>;
/**
 * Creates a `Resource` that refreshes automatically according to the supplied
 * schedule.
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const auto: <A, E, R, Out, E2, R2>(acquire: Effect.Effect<A, E, R>, policy: Schedule.Schedule<Out, unknown, E2, R2>) => Effect.Effect<Resource<A, E>, never, R | R2 | Scope.Scope>;
/**
 * Retrieves the current value stored in this resource.
 *
 * @category getters
 * @since 2.0.0
 */
export declare const get: <A, E>(self: Resource<A, E>) => Effect.Effect<A, E>;
/**
 * Re-runs this resource's acquisition effect and updates the current value.
 *
 * **Details**
 *
 * Refreshing replaces the value stored in the resource's scoped reference and
 * releases resources associated with the previous value. If acquisition fails,
 * the returned effect fails with the acquisition error.
 *
 * @category utils
 * @since 2.0.0
 */
export declare const refresh: <A, E>(self: Resource<A, E>) => Effect.Effect<void, E>;
export {};
//# sourceMappingURL=Resource.d.ts.map