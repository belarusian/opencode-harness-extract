/**
 * Durable workflow clocks provide workflow-safe timers and sleep operations.
 *
 * Use this module when a workflow needs to pause until a timeout, reminder,
 * deadline, retry delay, or other scheduled wake-up. Short sleeps can run as
 * in-memory activities, while longer sleeps are scheduled with the workflow
 * engine and resumed through a durable deferred signal when the timer fires.
 *
 * Because workflows may be replayed, timer names and durations should be
 * deterministic and stable for a given workflow path. Avoid deriving them from
 * ambient wall-clock state, and give distinct sleeps distinct names so replayed
 * executions can be matched with the correct scheduled wake-up. Lower the
 * in-memory threshold when a delay must be handled by the workflow engine
 * rather than the current process.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.js";
import * as Duration from "../../Duration.js";
import * as Effect from "../../Effect.js";
import * as Activity from "./Activity.js";
import * as DurableDeferred from "./DurableDeferred.js";
const TypeId = "~effect/workflow/DurableClock";
/**
 * Creates a durable clock definition and its associated deferred wake-up
 * signal.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = options => ({
  [TypeId]: TypeId,
  name: options.name,
  duration: Duration.fromInputUnsafe(options.duration),
  deferred: DurableDeferred.make(`DurableClock/${options.name}`)
});
const EngineTag = /*#__PURE__*/Context.Service("effect/workflow/WorkflowEngine");
const InstanceTag = /*#__PURE__*/Context.Service("effect/workflow/WorkflowEngine/WorkflowInstance");
/**
 * Sleeps inside a workflow, using an in-memory activity for durations at or
 * below the threshold and scheduling a durable clock for longer durations.
 *
 * @category Sleeping
 * @since 4.0.0
 */
export const sleep = /*#__PURE__*/Effect.fnUntraced(function* (options) {
  const duration = Duration.fromInputUnsafe(options.duration);
  if (Duration.isZero(duration)) {
    return;
  }
  const inMemoryThreshold = options.inMemoryThreshold ? Duration.fromInputUnsafe(options.inMemoryThreshold) : defaultInMemoryThreshold;
  if (Duration.isLessThanOrEqualTo(duration, inMemoryThreshold)) {
    return yield* Activity.make({
      name: `DurableClock/${options.name}`,
      execute: Effect.sleep(duration)
    });
  }
  const engine = yield* EngineTag;
  const instance = yield* InstanceTag;
  const clock = make(options);
  yield* engine.scheduleClock(instance.workflow, {
    executionId: instance.executionId,
    clock
  });
  return yield* DurableDeferred.await(clock.deferred);
});
const defaultInMemoryThreshold = /*#__PURE__*/Duration.seconds(60);
//# sourceMappingURL=DurableClock.js.map