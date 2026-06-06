/**
 * The `TestConsole` module provides a test implementation of the `Console`
 * service that records console calls instead of writing them to the host
 * environment. It is useful when testing workflows that use `Console.log` or
 * `Console.error` and need to assert on the produced output.
 *
 * Use {@link layer} to provide the test console to an effect, then inspect
 * captured output with {@link logLines} and {@link errorLines}. Because console
 * operations are service-based effects, programs under test must be run with
 * this layer for their output to be captured.
 *
 * @since 4.0.0
 */
import * as Array from "../Array.js";
import * as Console from "../Console.js";
import * as Effect from "../Effect.js";
import * as Layer from "../Layer.js";
/**
 * Creates a new TestConsole instance that captures all console output.
 * The returned TestConsole implements the Console interface and provides
 * additional methods to retrieve logged messages.
 *
 * **Example** (Creating a test console)
 *
 * ```ts
 * import { Console, Effect } from "effect"
 * import { TestConsole } from "effect/testing"
 *
 * const program = Effect.gen(function*() {
 *   yield* Console.log("Debug message")
 *   yield* Console.error("Error occurred")
 *
 *   const logs = yield* TestConsole.logLines
 *   const errors = yield* TestConsole.errorLines
 *
 *   console.log("Captured logs:", logs)
 *   console.log("Captured errors:", errors)
 * }).pipe(Effect.provide(TestConsole.layer))
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = /*#__PURE__*/Effect.gen(function* () {
  const entries = [];
  function createEntryUnsafe(method) {
    return (...parameters) => {
      entries.push({
        method,
        parameters
      });
    };
  }
  const logLines = Effect.sync(() => Array.flatMap(entries, entry => entry.method === "log" ? entry.parameters : []));
  const errorLines = Effect.sync(() => Array.flatMap(entries, entry => entry.method === "error" ? entry.parameters : []));
  return {
    assert: createEntryUnsafe("assert"),
    clear: createEntryUnsafe("clear"),
    count: createEntryUnsafe("count"),
    countReset: createEntryUnsafe("countReset"),
    debug: createEntryUnsafe("debug"),
    dir: createEntryUnsafe("dir"),
    dirxml: createEntryUnsafe("dirxml"),
    error: createEntryUnsafe("error"),
    group: createEntryUnsafe("group"),
    groupCollapsed: createEntryUnsafe("groupCollapsed"),
    groupEnd: createEntryUnsafe("groupEnd"),
    info: createEntryUnsafe("info"),
    log: createEntryUnsafe("log"),
    table: createEntryUnsafe("table"),
    time: createEntryUnsafe("time"),
    timeEnd: createEntryUnsafe("timeEnd"),
    timeLog: createEntryUnsafe("timeLog"),
    trace: createEntryUnsafe("trace"),
    warn: createEntryUnsafe("warn"),
    logLines,
    errorLines
  };
});
/**
 * Retrieves the `TestConsole` service for this test and uses it to run the
 * specified workflow.
 *
 * **Example** (Accessing the test console service)
 *
 * ```ts
 * import { Effect } from "effect"
 * import { TestConsole } from "effect/testing"
 *
 * const program = TestConsole.testConsoleWith((testConsole) =>
 *   Effect.gen(function*() {
 *     testConsole.log("Test message")
 *     testConsole.error("Test error")
 *
 *     const logs = yield* testConsole.logLines
 *     const errors = yield* testConsole.errorLines
 *
 *     console.log("Logs:", logs) // [["Test message"]]
 *     console.log("Errors:", errors) // [["Test error"]]
 *   })
 * ).pipe(Effect.provide(TestConsole.layer))
 * ```
 *
 * @category utils
 * @since 4.0.0
 */
export const testConsoleWith = f => Console.consoleWith(console => f(console));
/**
 * Creates a `Layer` which constructs a `TestConsole`.
 * This layer can be used to provide a TestConsole implementation
 * for testing purposes.
 *
 * **Example** (Providing a test console layer)
 *
 * ```ts
 * import { Console, Effect } from "effect"
 * import { TestConsole } from "effect/testing"
 *
 * const program = Effect.gen(function*() {
 *   yield* Console.log("This will be captured")
 *   yield* Console.error("This error will be captured")
 *
 *   const logs = yield* TestConsole.logLines
 *   const errors = yield* TestConsole.errorLines
 *
 *   console.log("Captured logs:", logs)
 *   console.log("Captured errors:", errors)
 * }).pipe(Effect.provide(TestConsole.layer))
 * ```
 *
 * @category layers
 * @since 4.0.0
 */
export const layer = /*#__PURE__*/Layer.effect(Console.Console)(make);
/**
 * Returns an array of all items that have been logged by the program using
 * `Console.log` thus far.
 *
 * **Example** (Reading captured log lines)
 *
 * ```ts
 * import { Console, Effect } from "effect"
 * import { TestConsole } from "effect/testing"
 *
 * const program = Effect.gen(function*() {
 *   yield* Console.log("First message")
 *   yield* Console.log("Second message", { key: "value" })
 *   yield* Console.log("Third message", 42, true)
 *
 *   const logs = yield* TestConsole.logLines
 *
 *   console.log(logs)
 *   // [
 *   //   ["First message"],
 *   //   ["Second message", { key: "value" }],
 *   //   ["Third message", 42, true]
 *   // ]
 * }).pipe(Effect.provide(TestConsole.layer))
 * ```
 *
 * @category utils
 * @since 4.0.0
 */
export const logLines = /*#__PURE__*/testConsoleWith(console => console.logLines);
/**
 * Returns an array of all items that have been logged by the program using
 * `Console.error` thus far.
 *
 * **Example** (Reading captured error lines)
 *
 * ```ts
 * import { Console, Effect } from "effect"
 * import { TestConsole } from "effect/testing"
 *
 * const program = Effect.gen(function*() {
 *   yield* Console.error("Error message")
 *   yield* Console.error("Another error", new Error("Something went wrong"))
 *
 *   const errors = yield* TestConsole.errorLines
 *
 *   console.log(errors)
 *   // [
 *   //   ["Error message"],
 *   //   ["Another error", Error: Something went wrong]
 *   // ]
 * }).pipe(Effect.provide(TestConsole.layer))
 * ```
 *
 * @category utils
 * @since 4.0.0
 */
export const errorLines = /*#__PURE__*/testConsoleWith(console => console.errorLines);
//# sourceMappingURL=TestConsole.js.map