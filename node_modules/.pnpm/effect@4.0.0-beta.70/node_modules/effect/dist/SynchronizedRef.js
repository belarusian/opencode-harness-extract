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
import * as Effect from "./Effect.js";
import { dual } from "./Function.js";
import { PipeInspectableProto } from "./internal/core.js";
import * as Option from "./Option.js";
import * as Ref from "./Ref.js";
import * as Semaphore from "./Semaphore.js";
const TypeId = "~effect/SynchronizedRef";
const Proto = {
  ...PipeInspectableProto,
  [TypeId]: TypeId,
  toJSON() {
    return {
      _id: "SynchronizedRef",
      value: this.backing.ref.current
    };
  }
};
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
export const makeUnsafe = value => {
  const self = Object.create(Proto);
  self.semaphore = Semaphore.makeUnsafe(1);
  self.backing = Ref.makeUnsafe(value);
  return self;
};
/**
 * Creates a `SynchronizedRef` from an initial value, wrapped in an `Effect`.
 *
 * @category constructors
 * @since 2.0.0
 */
export const make = value => Effect.sync(() => makeUnsafe(value));
/**
 * Reads the current value synchronously, bypassing the `Effect` API and the
 * ref's semaphore.
 *
 * @category getters
 * @since 4.0.0
 */
export const getUnsafe = self => self.backing.ref.current;
/**
 * Returns an `Effect` that reads the current value of the `SynchronizedRef`.
 *
 * @category getters
 * @since 2.0.0
 */
export const get = self => Effect.sync(() => getUnsafe(self));
/**
 * Atomically sets a new value and returns the previous value, serialized by the
 * ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export const getAndSet = /*#__PURE__*/dual(2, (self, value) => self.semaphore.withPermit(Ref.getAndSet(self.backing, value)));
/**
 * Atomically updates the current value with a function and returns the previous
 * value, serialized by the ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export const getAndUpdate = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Ref.getAndUpdate(self.backing, f)));
/**
 * Atomically runs an effectful update while holding the ref's semaphore, sets
 * the new value if the effect succeeds, and returns the previous value.
 *
 * @category utils
 * @since 2.0.0
 */
export const getAndUpdateEffect = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.map(f(value), newValue => {
    self.backing.ref.current = newValue;
    return value;
  });
})));
/**
 * Atomically applies a partial update and returns the previous value. If the
 * function returns `Option.some`, the ref is updated; if it returns
 * `Option.none`, the ref is left unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export const getAndUpdateSome = /*#__PURE__*/dual(2, (self, pf) => self.semaphore.withPermit(Ref.getAndUpdateSome(self, pf)));
/**
 * Atomically runs an effectful partial update while holding the ref's semaphore
 * and returns the previous value. `Option.some` updates the ref; `Option.none`
 * leaves it unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export const getAndUpdateSomeEffect = /*#__PURE__*/dual(2, (self, pf) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.flatMap(pf(value), option => {
    if (Option.isNone(option)) {
      return Effect.succeed(value);
    }
    self.backing.ref.current = option.value;
    return Effect.succeed(value);
  });
})));
/**
 * Atomically computes a return value and a new ref value, stores the new value,
 * and returns the computed result.
 *
 * @category utils
 * @since 2.0.0
 */
export const modify = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Ref.modify(self.backing, f)));
/**
 * Atomically runs an effectful modification while holding the ref's semaphore,
 * stores the new value if the effect succeeds, and returns the computed result.
 *
 * @category utils
 * @since 2.0.0
 */
export const modifyEffect = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.map(f(value), ([b, a]) => {
    self.backing.ref.current = a;
    return b;
  });
})));
/**
 * Atomically computes a return value and an optional new ref value.
 * `Option.some` updates the ref; `Option.none` leaves it unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export const modifySome = /*#__PURE__*/dual(2, (self, pf) => self.semaphore.withPermit(Ref.modifySome(self.backing, pf)));
/**
 * Atomically runs an effectful modification while holding the ref's semaphore.
 * The effect computes a return value and an optional new ref value;
 * `Option.some` updates the ref and `Option.none` leaves it unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export const modifySomeEffect = /*#__PURE__*/dual(2, (self, pf) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.flatMap(pf(value), ([b, maybeA]) => {
    if (Option.isNone(maybeA)) {
      return Effect.succeed(b);
    }
    self.backing.ref.current = maybeA.value;
    return Effect.succeed(b);
  });
})));
/**
 * Sets the value of the `SynchronizedRef`, serialized by the ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export const set = /*#__PURE__*/dual(2, (self, value) => self.semaphore.withPermit(Ref.set(self.backing, value)));
/**
 * Sets the value of the `SynchronizedRef` and returns the new value.
 *
 * @category utils
 * @since 2.0.0
 */
export const setAndGet = /*#__PURE__*/dual(2, (self, value) => self.semaphore.withPermit(Ref.setAndGet(self.backing, value)));
/**
 * Updates the value of the `SynchronizedRef` with a function, serialized by the
 * ref's semaphore.
 *
 * @category utils
 * @since 2.0.0
 */
export const update = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Ref.update(self.backing, f)));
/**
 * Runs an effectful update while holding the ref's semaphore and stores the new
 * value if the effect succeeds.
 *
 * @category utils
 * @since 2.0.0
 */
export const updateEffect = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.map(f(value), newValue => {
    self.backing.ref.current = newValue;
  });
})));
/**
 * Updates the value of the `SynchronizedRef` with a function and returns the
 * new value.
 *
 * @category utils
 * @since 2.0.0
 */
export const updateAndGet = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Ref.updateAndGet(self.backing, f)));
/**
 * Runs an effectful update while holding the ref's semaphore, stores the new
 * value if the effect succeeds, and returns that new value.
 *
 * @category utils
 * @since 2.0.0
 */
export const updateAndGetEffect = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.map(f(value), newValue => {
    self.backing.ref.current = newValue;
    return newValue;
  });
})));
/**
 * Applies a partial update to the current value. `Option.some` stores the new
 * value; `Option.none` leaves the ref unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export const updateSome = /*#__PURE__*/dual(2, (self, f) => self.semaphore.withPermit(Ref.updateSome(self.backing, f)));
/**
 * Runs an effectful partial update while holding the ref's semaphore.
 * `Option.some` stores the new value; `Option.none` leaves the ref unchanged.
 *
 * @category utils
 * @since 2.0.0
 */
export const updateSomeEffect = /*#__PURE__*/dual(2, (self, pf) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.map(pf(value), option => {
    if (Option.isNone(option)) {
      return;
    }
    self.backing.ref.current = option.value;
  });
})));
/**
 * Applies a partial update and returns the resulting current value.
 * `Option.some` stores and returns the new value; `Option.none` returns the
 * unchanged value.
 *
 * @category utils
 * @since 2.0.0
 */
export const updateSomeAndGet = /*#__PURE__*/dual(2, (self, pf) => self.semaphore.withPermit(Ref.updateSomeAndGet(self.backing, pf)));
/**
 * Runs an effectful partial update while holding the ref's semaphore and
 * returns the resulting current value. `Option.some` stores and returns the new
 * value; `Option.none` returns the unchanged value.
 *
 * @category utils
 * @since 2.0.0
 */
export const updateSomeAndGetEffect = /*#__PURE__*/dual(2, (self, pf) => self.semaphore.withPermit(Effect.suspend(() => {
  const value = getUnsafe(self);
  return Effect.flatMap(pf(value), option => {
    if (Option.isNone(option)) {
      return Effect.succeed(value);
    }
    self.backing.ref.current = option.value;
    return Effect.succeed(option.value);
  });
})));
//# sourceMappingURL=SynchronizedRef.js.map