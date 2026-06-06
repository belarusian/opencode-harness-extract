/**
 * The `Scheduler` module defines the runtime scheduling services used by
 * Effect fibers. A scheduler decides how runnable tasks are enqueued, when they
 * are dispatched, and whether a fiber should yield after consuming its
 * operation budget.
 *
 * **Common tasks**
 *
 * - Use {@link Scheduler} to provide a custom runtime scheduler
 * - Use {@link MixedScheduler} for the default priority-aware scheduler
 * - Use {@link MaxOpsBeforeYield} to tune fairness for CPU-bound fibers
 * - Use {@link PreventSchedulerYield} only when a runtime should bypass yield checks
 *
 * **Gotchas**
 *
 * - Scheduler priorities affect the order of queued runtime tasks, not the
 *   semantic result of an `Effect`
 * - Disabling scheduler yields can improve throughput for controlled workloads,
 *   but it can also let long-running fibers monopolize the JavaScript thread
 *
 * @since 2.0.0
 */
import * as Context from "./Context.ts";
import type * as Fiber from "./Fiber.ts";
/**
 * A scheduler manages the execution of Effect fibers by controlling when queued
 * tasks run.
 *
 * **Details**
 *
 * A scheduler determines the execution mode, schedules tasks with different
 * priorities, and decides when fibers should yield control after consuming
 * their operation budget.
 *
 * @category models
 * @since 2.0.0
 */
export interface Scheduler {
    readonly executionMode: "sync" | "async";
    shouldYield(fiber: Fiber.Fiber<unknown, unknown>): boolean;
    makeDispatcher(): SchedulerDispatcher;
}
/**
 * A dispatcher created by a `Scheduler` for enqueuing tasks and forcing queued
 * tasks to run.
 *
 * **Details**
 *
 * `scheduleTask` queues a task with a priority. `flush` drains pending work
 * synchronously, which is useful when callers need deterministic completion of
 * already scheduled tasks.
 *
 * @category models
 * @since 4.0.0
 */
export interface SchedulerDispatcher {
    scheduleTask(task: () => void, priority: number): void;
    flush(): void;
}
/**
 * Context reference for the scheduler used by the Effect runtime.
 *
 * **Details**
 *
 * The default value creates a `MixedScheduler`. Provide this service to
 * customize execution mode, task dispatching, or yield behavior.
 *
 * @category references
 * @since 2.0.0
 */
export declare const Scheduler: Context.Reference<Scheduler>;
/**
 * A scheduler implementation that batches queued tasks and dispatches them by
 * priority.
 *
 * **Details**
 *
 * `MixedScheduler` supports synchronous and asynchronous execution modes, uses
 * operation counts to decide when fibers should yield, and is the default
 * scheduler implementation.
 *
 * @category schedulers
 * @since 2.0.0
 */
export declare class MixedScheduler implements Scheduler {
    readonly executionMode: "sync" | "async";
    readonly setImmediate: (f: () => void) => () => void;
    constructor(executionMode?: "sync" | "async", setImmediateFn?: (f: () => void) => () => void);
    /**
     * Returns whether the fiber has reached its operation budget and should yield.
     *
     * @since 2.0.0
     */
    shouldYield(fiber: Fiber.Fiber<unknown, unknown>): boolean;
    /**
     * Creates a dispatcher that schedules work through this scheduler.
     *
     * @since 4.0.0
     */
    makeDispatcher(): MixedSchedulerDispatcher;
}
declare class MixedSchedulerDispatcher implements SchedulerDispatcher {
    private tasks;
    private running;
    readonly setImmediate: (f: () => void) => () => void;
    constructor(setImmediateFn?: (f: () => void) => () => void);
    /**
     * @since 2.0.0
     */
    scheduleTask(task: () => void, priority: number): void;
    /**
     * @since 2.0.0
     */
    afterScheduled: () => void;
    /**
     * @since 2.0.0
     */
    runTasks(): void;
    /**
     * @since 2.0.0
     */
    flush(): void;
}
/**
 * A service reference that controls the maximum number of operations a fiber
 * can perform before yielding control back to the scheduler.
 *
 * **Details**
 *
 * The default value is `2048` operations, which balances performance and
 * fairness by helping prevent long-running fibers from monopolizing the
 * execution thread.
 *
 * @category references
 * @since 4.0.0
 */
export declare const MaxOpsBeforeYield: Context.Reference<number>;
/**
 * A service reference that controls whether the runtime should bypass scheduler
 * yield checks. When set to `true`, the fiber run loop won't call
 * `Scheduler.shouldYield`.
 *
 * @category references
 * @since 4.0.0
 */
export declare const PreventSchedulerYield: Context.Reference<boolean>;
export {};
//# sourceMappingURL=Scheduler.d.ts.map