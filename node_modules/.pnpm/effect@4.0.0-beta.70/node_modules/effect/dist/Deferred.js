import { dual, identity } from "./Function.js";
import * as core from "./internal/core.js";
import * as internalEffect from "./internal/effect.js";
import * as Option from "./Option.js";
import { pipeArguments } from "./Pipeable.js";
import { hasProperty } from "./Predicate.js";
const TypeId = "~effect/Deferred";
/**
 * Checks whether a value is a `Deferred`.
 *
 * @category guards
 * @since 4.0.0
 */
export const isDeferred = u => hasProperty(u, TypeId);
const DeferredProto = {
  [TypeId]: {
    _A: identity,
    _E: identity
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
/**
 * Synchronously creates an empty `Deferred` outside the `Effect` runtime.
 *
 * **When to use**
 *
 * Prefer `Deferred.make` in effectful code so allocation is represented in
 * `Effect`; use this only when direct synchronous allocation is required.
 *
 * **Example** (Creating a Deferred unsafely)
 *
 * ```ts
 * import { Deferred } from "effect"
 *
 * const deferred = Deferred.makeUnsafe<number>()
 * console.log(deferred)
 * ```
 *
 * @category unsafe
 * @since 4.0.0
 */
export const makeUnsafe = () => {
  const self = Object.create(DeferredProto);
  self.resumes = undefined;
  self.effect = undefined;
  return self;
};
/**
 * Creates a new `Deferred`.
 *
 * **Example** (Creating a Deferred)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   yield* Deferred.succeed(deferred, 42)
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value) // 42
 * })
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const make = () => internalEffect.sync(() => makeUnsafe());
const _await = self => internalEffect.callback(resume => {
  if (self.effect) return resume(self.effect);
  self.resumes ??= [];
  self.resumes.push(resume);
  return internalEffect.sync(() => {
    const index = self.resumes.indexOf(resume);
    self.resumes.splice(index, 1);
  });
});
export {
/**
 * Retrieves the value of the `Deferred`, suspending the fiber running the
 * workflow until the result is available.
 *
 * **Example** (Awaiting a Deferred value)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   yield* Deferred.succeed(deferred, 42)
 *
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value) // 42
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
_await as await };
/**
 * Runs the supplied `Effect` and attempts to complete the `Deferred` with its
 * memoized result.
 *
 * **When to use**
 *
 * Use `Deferred.complete` when the effect should be evaluated once and the
 * resulting `Exit` memoized. Use `Deferred.completeWith` when you need to store
 * an effect directly without memoizing its result.
 *
 * **Details**
 *
 * The returned effect succeeds with `true` when this call completed the
 * `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Completing a Deferred from an effect)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const completed = yield* Deferred.complete(deferred, Effect.succeed(42))
 *   console.log(completed) // true
 *
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value) // 42
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const complete = /*#__PURE__*/dual(2, (self, effect) => internalEffect.suspend(() => self.effect ? internalEffect.succeed(false) : into(effect, self)));
/**
 * Completes the deferred with the result of the specified effect. If the
 * deferred has already been completed, the method will produce false.
 *
 * **Example** (Completing a Deferred with an effect)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const completed = yield* Deferred.completeWith(deferred, Effect.succeed(42))
 *   console.log(completed) // true
 *
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value) // 42
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const completeWith = /*#__PURE__*/dual(2, (self, effect) => internalEffect.sync(() => doneUnsafe(self, effect)));
/**
 * Exits the `Deferred` with the specified `Exit` value, which will be
 * propagated to all fibers waiting on the value of the `Deferred`.
 *
 * **Example** (Completing a Deferred with an Exit)
 *
 * ```ts
 * import { Deferred, Effect, Exit } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   yield* Deferred.done(deferred, Exit.succeed(42))
 *
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value) // 42
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const done = completeWith;
/**
 * Attempts to complete the `Deferred` with the specified error.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` fail with that error only if this call
 * completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Failing a Deferred with an error)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number, string>()
 *   const success = yield* Deferred.fail(deferred, "Operation failed")
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const fail = /*#__PURE__*/dual(2, (self, error) => done(self, core.exitFail(error)));
/**
 * Computes an error when the returned effect is run, then attempts to complete
 * the `Deferred` with that error.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` fail with the computed error only if this
 * call completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Failing a Deferred with a lazy error)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number, string>()
 *   const success = yield* Deferred.failSync(deferred, () => "Lazy error")
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const failSync = /*#__PURE__*/dual(2, (self, evaluate) => internalEffect.suspend(() => fail(self, evaluate())));
/**
 * Attempts to complete the `Deferred` with the specified `Cause`.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` observe that cause only if this call
 * completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Failing a Deferred with a Cause)
 *
 * ```ts
 * import { Cause, Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number, string>()
 *   const success = yield* Deferred.failCause(
 *     deferred,
 *     Cause.fail("Operation failed")
 *   )
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const failCause = /*#__PURE__*/dual(2, (self, cause) => done(self, core.exitFailCause(cause)));
/**
 * Computes a `Cause` when the returned effect is run, then attempts to
 * complete the `Deferred` with that cause.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` observe the computed cause only if this
 * call completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Failing a Deferred with a lazy Cause)
 *
 * ```ts
 * import { Cause, Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number, string>()
 *   const success = yield* Deferred.failCauseSync(
 *     deferred,
 *     () => Cause.fail("Lazy error")
 *   )
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const failCauseSync = /*#__PURE__*/dual(2, (self, evaluate) => internalEffect.suspend(() => failCause(self, evaluate())));
/**
 * Attempts to complete the `Deferred` with a defect.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` die with that defect only if this call
 * completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Killing a Deferred with a defect)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const success = yield* Deferred.die(
 *     deferred,
 *     new Error("Something went wrong")
 *   )
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const die = /*#__PURE__*/dual(2, (self, defect) => done(self, core.exitDie(defect)));
/**
 * Computes a defect when the returned effect is run, then attempts to complete
 * the `Deferred` with that defect.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` die with the computed defect only if this
 * call completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Killing a Deferred with a lazy defect)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const success = yield* Deferred.dieSync(
 *     deferred,
 *     () => new Error("Lazy error")
 *   )
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const dieSync = /*#__PURE__*/dual(2, (self, evaluate) => internalEffect.suspend(() => die(self, evaluate())));
/**
 * Attempts to complete the `Deferred` with interruption by the current fiber.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` are interrupted with the current fiber id
 * only if this call completes it. The returned effect succeeds with `true`
 * when this call completed the `Deferred`, or `false` if it was already
 * completed.
 *
 * **Example** (Interrupting a Deferred)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const success = yield* Deferred.interrupt(deferred)
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const interrupt = self => core.withFiber(fiber => interruptWith(self, fiber.id));
/**
 * Attempts to complete the `Deferred` with interruption by the specified
 * `FiberId`.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` are interrupted with that fiber id only if
 * this call completes it. The returned effect succeeds with `true` when this
 * call completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Interrupting a Deferred with a fiber id)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const success = yield* Deferred.interruptWith(deferred, 42)
 *   console.log(success) // true
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const interruptWith = /*#__PURE__*/dual(2, (self, fiberId) => failCause(self, internalEffect.causeInterrupt(fiberId)));
/**
 * Returns `true` if this `Deferred` has already been completed with a value or
 * an error, `false` otherwise.
 *
 * **Example** (Checking Deferred completion)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const beforeCompletion = yield* Deferred.isDone(deferred)
 *   console.log(beforeCompletion) // false
 *
 *   yield* Deferred.succeed(deferred, 42)
 *   const afterCompletion = yield* Deferred.isDone(deferred)
 *   console.log(afterCompletion) // true
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export const isDone = self => internalEffect.sync(() => isDoneUnsafe(self));
/**
 * Returns `true` if this `Deferred` has already been completed with a value or
 * an error, `false` otherwise.
 *
 * @category getters
 * @since 4.0.0
 */
export const isDoneUnsafe = self => self.effect !== undefined;
/**
 * Returns the current completion effect as an `Option`. This returns
 * `Option.some(effect)` when the `Deferred` is completed, `Option.none()`
 * otherwise.
 *
 * **Example** (Polling Deferred completion)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   const beforeCompletion = yield* Deferred.poll(deferred)
 *   console.log(beforeCompletion._tag === "None") // true
 *
 *   yield* Deferred.succeed(deferred, 42)
 *   const afterCompletion = yield* Deferred.poll(deferred)
 *   console.log(afterCompletion._tag === "Some") // true
 * })
 * ```
 *
 * @category getters
 * @since 2.0.0
 */
export function poll(self) {
  return internalEffect.sync(() => Option.fromUndefinedOr(self.effect));
}
/**
 * Attempts to complete the `Deferred` with the specified value.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` receive the value only if this call
 * completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Completing a Deferred with a value)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   yield* Deferred.succeed(deferred, 42)
 *
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value) // 42
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const succeed = /*#__PURE__*/dual(2, (self, value) => done(self, core.exitSucceed(value)));
/**
 * Computes a value when the returned effect is run, then attempts to complete
 * the `Deferred` with that value.
 *
 * **Details**
 *
 * Fibers waiting on the `Deferred` receive the computed value only if this call
 * completes it. The returned effect succeeds with `true` when this call
 * completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Completing a Deferred with a lazy value)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const deferred = yield* Deferred.make<number>()
 *   yield* Deferred.sync(deferred, () => 42)
 *
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value) // 42
 * })
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const sync = /*#__PURE__*/dual(2, (self, evaluate) => internalEffect.suspend(() => succeed(self, evaluate())));
/**
 * Synchronously attempts to complete the `Deferred` with the specified
 * completion effect.
 *
 * **Details**
 *
 * This mutates the `Deferred` directly and should be reserved for low-level
 * code; prefer the effectful completion APIs when possible. Returns `true` if
 * this call completed the `Deferred`, or `false` if it was already completed.
 *
 * **Example** (Completing a Deferred unsafely)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * const deferred = Deferred.makeUnsafe<number>()
 * const success = Deferred.doneUnsafe(deferred, Effect.succeed(42))
 * console.log(success) // true
 * ```
 *
 * @category unsafe
 * @since 4.0.0
 */
export const doneUnsafe = (self, effect) => {
  if (self.effect) return false;
  self.effect = effect;
  if (self.resumes) {
    for (let i = 0; i < self.resumes.length; i++) {
      self.resumes[i](effect);
    }
    self.resumes = undefined;
  }
  return true;
};
/**
 * Runs an `Effect` and attempts to complete a `Deferred` with the effect's
 * result.
 *
 * **Details**
 *
 * If the effect succeeds, fails, dies, or is interrupted, that result is used
 * as the attempted completion. The returned effect cannot fail; it succeeds
 * with `true` if it completed the `Deferred`, or `false` if the `Deferred` was
 * already completed.
 *
 * **Example** (Completing a Deferred from an effect result)
 *
 * ```ts
 * import { Deferred, Effect } from "effect"
 *
 * // Define an effect that succeeds
 * const successEffect = Effect.succeed(42)
 *
 * const program = Effect.gen(function*() {
 *   // Create a deferred
 *   const deferred = yield* Deferred.make<number, string>()
 *
 *   // Complete the deferred using the successEffect
 *   const isCompleted = yield* Deferred.into(successEffect, deferred)
 *
 *   // Access the value of the deferred
 *   const value = yield* Deferred.await(deferred)
 *   console.log(value)
 *
 *   return isCompleted
 * })
 *
 * Effect.runPromise(program).then(console.log)
 * // Output:
 * // 42
 * // true
 * ```
 *
 * @category Synchronization Utilities
 * @since 4.0.0
 */
export const into = /*#__PURE__*/dual(2, (self, deferred) => internalEffect.uninterruptibleMask(restore => internalEffect.flatMap(internalEffect.exit(restore(self)), exit => done(deferred, exit))));
//# sourceMappingURL=Deferred.js.map