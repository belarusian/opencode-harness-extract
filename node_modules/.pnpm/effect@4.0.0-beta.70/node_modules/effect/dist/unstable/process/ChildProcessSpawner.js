/**
 * A module providing a generic service interface for spawning child processes.
 *
 * This module provides the `ChildProcessSpawner` service tag which can be
 * implemented by platform-specific packages (e.g., Node.js).
 *
 * @since 4.0.0
 */
import * as Brand from "../../Brand.js";
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Inspectable from "../../Inspectable.js";
import * as Stream from "../../Stream.js";
/**
 * Brand constructor for child process `ExitCode` values.
 *
 * @category constructors
 * @since 4.0.0
 */
export const ExitCode = /*#__PURE__*/Brand.nominal();
/**
 * Brand constructor for child process `ProcessId` values.
 *
 * @category constructors
 * @since 4.0.0
 */
export const ProcessId = /*#__PURE__*/Brand.nominal();
const HandleTypeId = "~effect/ChildProcessSpawner/ChildProcessHandle";
const HandleProto = {
  [HandleTypeId]: HandleTypeId,
  ...Inspectable.BaseProto,
  toJSON() {
    return {
      _id: "ChildProcessHandle",
      pid: this.pid
    };
  }
};
/**
 * Constructs a new `ChildProcessHandle`.
 *
 * @category constructors
 * @since 4.0.0
 */
export const makeHandle = params => Object.assign(Object.create(HandleProto), params);
/**
 * Creates a `ChildProcessSpawner` service from a `spawn` function, deriving
 * helpers for exit codes and output collection from that implementation.
 *
 * @category models
 * @since 4.0.0
 */
export const make = spawn => {
  const streamString = (command, options) => spawn(command).pipe(Effect.map(handle => Stream.decodeText(options?.includeStderr === true ? handle.all : handle.stdout)), Stream.unwrap);
  const streamLines = (command, options) => Stream.splitLines(streamString(command, options));
  return ChildProcessSpawner.of({
    spawn,
    exitCode: command => Effect.scoped(Effect.flatMap(spawn(command), handle => handle.exitCode)),
    streamString,
    streamLines,
    lines: (command, options) => Stream.runCollect(streamLines(command, options)),
    string: (command, options) => Stream.mkString(streamString(command, options))
  });
};
/**
 * Service tag for child process spawning.
 *
 * @category services
 * @since 4.0.0
 */
export class ChildProcessSpawner extends /*#__PURE__*/Context.Service()("effect/process/ChildProcessSpawner") {}
//# sourceMappingURL=ChildProcessSpawner.js.map