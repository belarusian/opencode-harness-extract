/**
 * The `GlobalFlag` module defines flags that are available to every command in
 * an Effect CLI application. Global flags are useful for cross-cutting command
 * line behavior such as printing help, showing the application version,
 * generating shell completions, or configuring shared handler settings like the
 * minimum log level.
 *
 * **Common tasks**
 *
 * - Create an action flag with {@link action} for side effects that should run
 *   before the selected command, such as `--help` or `--version`
 * - Create a setting flag with {@link setting} for values that should be made
 *   available to command handlers through the Effect context
 * - Reuse the built-in {@link Help}, {@link Version}, {@link Completions}, and
 *   {@link LogLevel} flags when constructing command runners
 *
 * **Gotchas**
 *
 * - Action flags are intended to perform their effect and exit instead of
 *   continuing into the command handler
 * - Setting flags allocate a distinct context service for each call to
 *   {@link setting}, so reuse exported settings when handlers need to read the
 *   same parsed global value
 *
 * @since 4.0.0
 */
import * as Console from "../../Console.js";
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Option from "../../Option.js";
import * as CliOutput from "./CliOutput.js";
import * as Completions_ from "./Completions.js";
import * as Flag from "./Flag.js";
import * as CommandDescriptor from "./internal/completions/descriptor.js";
import * as HelpInternal from "./internal/help.js";
/* ========================================================================== */
/* Constructors                                                               */
/* ========================================================================== */
/**
 * Creates an Action flag that performs a side effect and exits.
 *
 * @category constructors
 * @since 4.0.0
 */
export const action = options => ({
  _tag: "Action",
  flag: options.flag,
  run: options.run
});
/**
 * Creates a Setting flag that configures the command handler's environment.
 *
 * @category constructors
 * @since 4.0.0
 */
export const setting = id => options => {
  settingIdCounter += 1;
  const ref = Context.Service(`effect/unstable/cli/GlobalFlag/${id}/${settingIdCounter}`);
  return Object.assign(ref, {
    _tag: "Setting",
    id,
    flag: options.flag
  });
};
let settingIdCounter = 0;
/* ========================================================================== */
/* Built-in Flag References                                                   */
/* ========================================================================== */
/**
 * The `--help` / `-h` global flag.
 * Shows help documentation for the command.
 *
 * @category references
 * @since 4.0.0
 */
export const Help = /*#__PURE__*/action({
  flag: /*#__PURE__*/Flag.boolean("help").pipe(/*#__PURE__*/Flag.withAlias("h"), /*#__PURE__*/Flag.withDescription("Show help information")),
  run: (_, {
    command,
    commandPath
  }) => Effect.gen(function* () {
    const formatter = yield* CliOutput.Formatter;
    const helpDoc = yield* HelpInternal.getHelpForCommandPath(command, commandPath, BuiltIns);
    yield* Console.log(formatter.formatHelpDoc(helpDoc));
  })
});
/**
 * The `--version` global flag.
 * Shows version information for the command.
 *
 * @category references
 * @since 4.0.0
 */
export const Version = /*#__PURE__*/action({
  flag: /*#__PURE__*/Flag.boolean("version").pipe(/*#__PURE__*/Flag.withDescription("Show version information")),
  run: (_, {
    command,
    version
  }) => Effect.gen(function* () {
    const formatter = yield* CliOutput.Formatter;
    yield* Console.log(formatter.formatVersion(command.name, version));
  })
});
/**
 * The `--completions` global flag.
 * Prints shell completion script for the given shell.
 *
 * @category references
 * @since 4.0.0
 */
export const Completions = /*#__PURE__*/action({
  flag: /*#__PURE__*/Flag.choice("completions", ["bash", "zsh", "fish", "sh"]).pipe(Flag.optional, /*#__PURE__*/Flag.map(v => Option.map(v, s => s === "sh" ? "bash" : s)), /*#__PURE__*/Flag.withDescription("Print shell completion script")),
  run: (shell, {
    command
  }) => Effect.gen(function* () {
    if (Option.isNone(shell)) return;
    const descriptor = CommandDescriptor.fromCommand(command);
    yield* Console.log(Completions_.generate(command.name, shell.value, descriptor));
  })
});
/**
 * The `--log-level` global flag.
 * Sets the minimum log level for the command.
 *
 * @category references
 * @since 4.0.0
 */
export const LogLevel = /*#__PURE__*/setting("log-level")({
  flag: /*#__PURE__*/Flag.choiceWithValue("log-level", [["all", "All"], ["trace", "Trace"], ["debug", "Debug"], ["info", "Info"], ["warn", "Warn"], ["warning", "Warn"], ["error", "Error"], ["fatal", "Fatal"], ["none", "None"]]).pipe(Flag.optional, /*#__PURE__*/Flag.withDescription("Sets the minimum log level"))
});
/* ========================================================================== */
/* References                                                                 */
/* ========================================================================== */
/**
 * Built-in global flags in default precedence order.
 *
 * @category references
 * @since 4.0.0
 */
export const BuiltIns = [Help, Version, Completions, LogLevel];
//# sourceMappingURL=GlobalFlag.js.map