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
import * as Context from "../../Context.ts";
import * as Effect from "../../Effect.ts";
import type { LogLevel as LogLevelType } from "../../LogLevel.ts";
import * as Option from "../../Option.ts";
import type * as Command from "./Command.ts";
import * as Flag from "./Flag.ts";
/**
 * Context passed to action handlers.
 *
 * @category models
 * @since 4.0.0
 */
export interface HandlerContext {
    readonly command: Command.Command.Any;
    readonly commandPath: ReadonlyArray<string>;
    readonly version: string;
}
/**
 * Action flag: side effect + exit (--help, --version, --completions).
 *
 * @category models
 * @since 4.0.0
 */
export interface Action<A> {
    readonly _tag: "Action";
    readonly flag: Flag.Flag<A>;
    readonly run: (value: A, context: HandlerContext) => Effect.Effect<void>;
}
/**
 * Setting flag: configure command handler's environment (--log-level, --config).
 *
 * @category models
 * @since 4.0.0
 */
export interface Setting<Id extends string, A> extends Context.Service<Setting.Identifier<Id>, A> {
    readonly _tag: "Setting";
    readonly id: Id;
    readonly flag: Flag.Flag<A>;
}
/**
 * Namespace containing type helpers for global setting flags.
 *
 * @since 4.0.0
 */
export declare namespace Setting {
    /**
     * Type-level service identifier used by `Setting` global flags for the
     * parsed value associated with a setting id.
     *
     * @category models
     * @since 4.0.0
     */
    type Identifier<Id extends string> = `effect/unstable/cli/GlobalFlag/${Id}`;
}
/**
 * Global flag discriminated union.
 *
 * @category models
 * @since 4.0.0
 */
export type GlobalFlag<A> = Action<A> | Setting<any, A>;
/**
 * Creates an Action flag that performs a side effect and exits.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const action: <A>(options: {
    readonly flag: Flag.Flag<A>;
    readonly run: (value: A, context: HandlerContext) => Effect.Effect<void>;
}) => Action<A>;
/**
 * Creates a Setting flag that configures the command handler's environment.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const setting: <const Id extends string>(id: Id) => <A>(options: {
    readonly flag: Flag.Flag<A>;
}) => Setting<Id, A>;
/**
 * The `--help` / `-h` global flag.
 * Shows help documentation for the command.
 *
 * @category references
 * @since 4.0.0
 */
export declare const Help: Action<boolean>;
/**
 * The `--version` global flag.
 * Shows version information for the command.
 *
 * @category references
 * @since 4.0.0
 */
export declare const Version: Action<boolean>;
/**
 * The `--completions` global flag.
 * Prints shell completion script for the given shell.
 *
 * @category references
 * @since 4.0.0
 */
export declare const Completions: Action<Option.Option<"bash" | "zsh" | "fish">>;
/**
 * The `--log-level` global flag.
 * Sets the minimum log level for the command.
 *
 * @category references
 * @since 4.0.0
 */
export declare const LogLevel: Setting<"log-level", Option.Option<LogLevelType>>;
/**
 * Built-in global flags in default precedence order.
 *
 * @category references
 * @since 4.0.0
 */
export declare const BuiltIns: ReadonlyArray<GlobalFlag<any>>;
/**
 * Built-in setting context identifiers.
 *
 * @category models
 * @since 4.0.0
 */
export type BuiltInSettingContext = Setting.Identifier<"log-level">;
//# sourceMappingURL=GlobalFlag.d.ts.map