/**
 * The `Pull` module provides the low-level pull-step abstraction used by
 * stream-like consumers. A `Pull<A, E, Done, R>` is an `Effect` that can
 * produce one value of type `A`, fail with an ordinary error `E`, or signal
 * end-of-input with a `Cause.Done<Done>` value.
 *
 * **Mental model**
 *
 * - `Pull` is an `Effect` with a distinguished completion signal in the error channel
 * - ordinary failures and completion are both represented by `Cause`, but can be separated with the helpers in this module
 * - the `Done` value can carry leftover state or a final value needed by a downstream consumer
 * - `Pull` is useful when repeatedly evaluating an effect until it either produces values, fails, or reports that no more input is available
 *
 * **Common tasks**
 *
 * - Extract type parameters from a pull: {@link Success}, {@link Error}, {@link Leftover}, {@link Services}
 * - Detect and filter completion: {@link isDoneCause}, {@link filterDone}, {@link filterNoDone}
 * - Recover from completion while preserving ordinary failures: {@link catchDone}
 * - Convert done causes to successful exits: {@link doneExitFromCause}
 * - Handle all outcomes explicitly: {@link matchEffect}
 *
 * **Gotchas**
 *
 * - `Cause.Done` is not an ordinary failure; use this module's helpers before treating a pull failure as an error
 * - `Done` lives in the error channel, so generic `Effect` error handling can catch it unless you filter it deliberately
 * - `Pull` is a low-level primitive; most user-facing stream workflows should prefer higher-level stream APIs when available
 *
 * @since 4.0.0
 */
import * as Cause from "./Cause.js";
import * as Exit from "./Exit.js";
import * as Filter from "./Filter.js";
import { dual } from "./Function.js";
import * as internalEffect from "./internal/effect.js";
import * as Result from "./Result.js";
// -----------------------------------------------------------------------------
// Done
// -----------------------------------------------------------------------------
/**
 * Handles `Cause.Done` failures in an effect while leaving ordinary failures
 * in the error channel.
 *
 * **Details**
 *
 * The handler receives the done leftover value and may recover with a new
 * effect. Non-done errors are preserved.
 *
 * @category Done
 * @since 4.0.0
 */
export const catchDone = /*#__PURE__*/dual(2, (effect, f) => internalEffect.catchCauseFilter(effect, filterDoneLeftover, l => f(l)));
/**
 * Checks if a Cause contains any done errors.
 *
 * @category Done
 * @since 4.0.0
 */
export const isDoneCause = cause => cause.reasons.some(isDoneFailure);
/**
 * Checks if a Cause failure is a done error.
 *
 * @category Done
 * @since 4.0.0
 */
export const isDoneFailure = failure => failure._tag === "Fail" && Cause.isDone(failure.error);
/**
 * Finds a `Cause.Done` failure in a `Cause`.
 *
 * **Details**
 *
 * Returns a successful `Result` with the `Cause.Done` value when one is
 * present, otherwise returns a failed `Result` containing the non-done cause.
 *
 * @category Done
 * @since 4.0.0
 */
export const filterDone = /*#__PURE__*/Filter.composePassthrough(Cause.findError, e => Cause.isDone(e) ? Result.succeed(e) : Result.fail(e));
/**
 * Finds a `Cause.Done` failure in a cause whose done value is not used.
 *
 * **Details**
 *
 * Returns a successful `Result` with the done marker when present, otherwise
 * returns a failed `Result` with the non-done cause.
 *
 * @category Done
 * @since 4.0.0
 */
export const filterDoneVoid = /*#__PURE__*/Filter.composePassthrough(Cause.findError, e => Cause.isDone(e) ? Result.succeed(e) : Result.fail(e));
/**
 * Keeps a `Cause` only when it contains no `Cause.Done` failures.
 *
 * **Details**
 *
 * Returns a successful `Result` with the cause when every failure is non-done;
 * otherwise returns a failed `Result` with the original cause.
 *
 * @category Done
 * @since 4.0.0
 */
export const filterNoDone = /*#__PURE__*/Filter.fromPredicate(cause => cause.reasons.every(failure => !isDoneFailure(failure)));
/**
 * Filters a Cause to extract the leftover value from done errors.
 *
 * @category Done
 * @since 4.0.0
 */
export const filterDoneLeftover = /*#__PURE__*/Filter.composePassthrough(Cause.findError, e => Cause.isDone(e) ? Result.succeed(e.value) : Result.fail(e));
/**
 * Converts a `Cause` into an `Exit`, treating `Cause.Done` as successful
 * completion.
 *
 * **Details**
 *
 * If the cause contains a done value, that leftover becomes the successful
 * value. Otherwise the non-done cause becomes the failure cause.
 *
 * @category Done
 * @since 4.0.0
 */
export const doneExitFromCause = cause => {
  const halt = filterDone(cause);
  return !Result.isFailure(halt) ? Exit.succeed(halt.success.value) : Exit.failCause(halt.failure);
};
/**
 * Pattern matches on a Pull, handling success, failure, and done cases.
 *
 * **Example** (Matching Pull outcomes)
 *
 * ```ts
 * import { Cause, Effect, Pull } from "effect"
 *
 * const pull = Cause.done("stream ended")
 *
 * const result = Pull.matchEffect(pull, {
 *   onSuccess: (value) => Effect.succeed(`Got value: ${value}`),
 *   onFailure: (cause) => Effect.succeed(`Got error: ${cause}`),
 *   onDone: (leftover) => Effect.succeed(`Stream halted with: ${leftover}`)
 * })
 * ```
 *
 * @category pattern matching
 * @since 4.0.0
 */
export const matchEffect = /*#__PURE__*/dual(2, (self, options) => internalEffect.matchCauseEffect(self, {
  onSuccess: options.onSuccess,
  onFailure: cause => {
    const halt = filterDone(cause);
    return !Result.isFailure(halt) ? options.onDone(halt.success.value) : options.onFailure(halt.failure);
  }
}));
//# sourceMappingURL=Pull.js.map