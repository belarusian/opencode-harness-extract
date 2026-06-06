import * as Context from "./Context.js";
import { constant } from "./Function.js";
import * as effect from "./internal/effect.js";
import * as Layer from "./Layer.js";
import { pipeArguments } from "./Pipeable.js";
import * as Predicate from "./Predicate.js";
/**
 * Runtime type identifier attached to `ExecutionPlan` values and used by
 * `isExecutionPlan`.
 *
 * @category type IDs
 * @since 3.16.0
 */
export const TypeId = "~effect/ExecutionPlan";
/**
 * Returns `true` if a value is an `ExecutionPlan` by checking for the
 * `ExecutionPlan.TypeId` marker.
 *
 * @category guards
 * @since 3.16.0
 */
export const isExecutionPlan = u => Predicate.hasProperty(u, TypeId);
/**
 * Create an `ExecutionPlan`, which can be used with `Effect.withExecutionPlan` or `Stream.withExecutionPlan`, allowing you to provide different resources for each step of execution until the effect succeeds or the plan is exhausted.
 *
 * **Example** (Creating an execution plan)
 *
 * ```ts
 * import { Effect, ExecutionPlan, Schedule } from "effect"
 * import type { Layer } from "effect"
 * import type { LanguageModel } from "effect/unstable/ai"
 *
 * declare const layerBad: Layer.Layer<LanguageModel.LanguageModel>
 * declare const layerGood: Layer.Layer<LanguageModel.LanguageModel>
 *
 * const ThePlan = ExecutionPlan.make(
 *   {
 *     // First try with the bad layer 2 times with a 3 second delay between attempts
 *     provide: layerBad,
 *     attempts: 2,
 *     schedule: Schedule.spaced(3000)
 *   },
 *   // Then try with the bad layer 3 times with a 1 second delay between attempts
 *   {
 *     provide: layerBad,
 *     attempts: 3,
 *     schedule: Schedule.spaced(1000)
 *   },
 *   // Finally try with the good layer.
 *   //
 *   // If `attempts` is omitted, the plan will only attempt once, unless a schedule is provided.
 *   {
 *     provide: layerGood
 *   }
 * )
 *
 * declare const effect: Effect.Effect<
 *   void,
 *   never,
 *   LanguageModel.LanguageModel
 * >
 * const withPlan: Effect.Effect<void> = Effect.withExecutionPlan(effect, ThePlan)
 * ```
 *
 * @category constructors
 * @since 3.16.0
 */
export const make = (...steps) => makeProto(steps.map((options, i) => {
  if (options.attempts && options.attempts < 1) {
    throw new Error(`ExecutionPlan.make: step[${i}].attempts must be greater than 0`);
  }
  return {
    schedule: options.schedule,
    attempts: options.attempts,
    while: options.while ? input => effect.suspend(() => {
      const result = options.while(input);
      return typeof result === "boolean" ? effect.succeed(result) : result;
    }) : undefined,
    provide: options.provide
  };
}));
const Proto = {
  [TypeId]: TypeId,
  get captureRequirements() {
    const self = this;
    return effect.contextWith(context => effect.succeed(makeProto(self.steps.map(step => ({
      ...step,
      provide: Layer.isLayer(step.provide) ? Layer.provide(step.provide, Layer.succeedContext(context)) : step.provide
    })))));
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const makeProto = steps => {
  const self = Object.create(Proto);
  self.steps = steps;
  return self;
};
/**
 * Combines multiple execution plans by concatenating their steps in order.
 *
 * **Details**
 *
 * The resulting plan tries every step from the first plan, then every step from
 * the next plan, and so on.
 *
 * @category Combining
 * @since 3.16.0
 */
export const merge = (...plans) => makeProto(plans.flatMap(plan => plan.steps));
/**
 * `Context.Reference` containing metadata for the currently running
 * execution-plan attempt.
 *
 * @category Metadata
 * @since 4.0.0
 */
export const CurrentMetadata = /*#__PURE__*/Context.Reference("effect/ExecutionPlan/CurrentMetadata", {
  defaultValue: /*#__PURE__*/constant({
    attempt: 0,
    stepIndex: 0
  })
});
//# sourceMappingURL=ExecutionPlan.js.map