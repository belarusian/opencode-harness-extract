/**
 * The `Resource` module provides refreshable, scoped values. A
 * `Resource<A, E>` stores the latest successful or failed acquisition result and
 * can be read with {@link get}, refreshed manually with {@link refresh}, or
 * refreshed automatically with {@link auto}.
 *
 * **Mental model**
 *
 * - A `Resource` wraps an acquisition `Effect` whose result is kept in a
 *   `ScopedRef`
 * - Each refresh re-runs acquisition and replaces the stored `Exit`
 * - Replacing the stored value releases resources associated with the previous
 *   scoped value
 * - Reading a resource returns the current acquired value or fails with the
 *   current acquisition error
 *
 * **Common tasks**
 *
 * - Create a manually refreshed resource with {@link manual}
 * - Create a schedule-driven resource with {@link auto}
 * - Read the current value with {@link get}
 * - Force a reload with {@link refresh}
 * - Check whether an unknown value is a resource with {@link isResource}
 *
 * **Gotchas**
 *
 * - Creating a resource requires a `Scope`; when the scope closes, scoped
 *   values held by the resource are released
 * - Failed acquisitions are stored too, so subsequent {@link get} calls fail
 *   until a refresh succeeds
 * - Automatic refreshes run in the resource scope and stop when that scope is
 *   closed
 *
 * @since 2.0.0
 */
import * as Context from "./Context.js";
import * as Effect from "./Effect.js";
import * as Exit from "./Exit.js";
import { identity } from "./Function.js";
import { PipeInspectableProto } from "./internal/core.js";
import { hasProperty } from "./Predicate.js";
import * as ScopedRef from "./ScopedRef.js";
const TypeId = "~effect/Resource";
/**
 * Returns `true` if the specified value is a `Resource`.
 *
 * @category guards
 * @since 4.0.0
 */
export const isResource = u => hasProperty(u, TypeId);
const Proto = {
  ...PipeInspectableProto,
  [TypeId]: TypeId,
  toJSON() {
    return {
      _id: "Resource"
    };
  }
};
const makeUnsafe = (scopedRef, acquire) => {
  const self = Object.create(Proto);
  self.scopedRef = scopedRef;
  self.acquire = acquire;
  return self;
};
/**
 * Creates a `Resource` that must be refreshed manually.
 *
 * @category constructors
 * @since 2.0.0
 */
export const manual = acquire => Effect.contextWith(context => {
  const providedAcquire = Effect.updateContext(acquire, input => Context.merge(context, input));
  return Effect.map(ScopedRef.fromAcquire(Effect.exit(providedAcquire)), scopedRef => makeUnsafe(scopedRef, providedAcquire));
});
/**
 * Creates a `Resource` that refreshes automatically according to the supplied
 * schedule.
 *
 * @category constructors
 * @since 2.0.0
 */
export const auto = (acquire, policy) => Effect.tap(manual(acquire), self => Effect.forkScoped(Effect.repeat(refresh(self), policy)));
/**
 * Retrieves the current value stored in this resource.
 *
 * @category getters
 * @since 2.0.0
 */
export const get = self => Effect.flatMap(ScopedRef.get(self.scopedRef), identity);
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
export const refresh = self => ScopedRef.set(self.scopedRef, Effect.map(self.acquire, Exit.succeed));
//# sourceMappingURL=Resource.js.map