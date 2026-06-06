/**
 * The `PlatformError` module defines the normalized error model used by
 * platform APIs when adapting host operations into Effect programs. It gives
 * callers a stable `PlatformError` wrapper whose `reason` is either a
 * `BadArgument`, for invalid inputs rejected before an operation runs, or a
 * `SystemError`, for failures reported by the host platform or operating
 * system.
 *
 * Use this module when implementing or consuming platform services such as
 * file systems, terminal access, sockets, or other environment-specific APIs.
 * `SystemError` intentionally groups many low-level failures into a small set
 * of portable tags like `NotFound`, `PermissionDenied`, and `TimedOut`, while
 * still preserving operation details such as the module, method, syscall, path
 * or descriptor, description, and original cause when available.
 *
 * **Common tasks**
 *
 * - Create platform failures from system operations with {@link systemError}
 * - Report rejected caller input with {@link badArgument}
 * - Inspect the underlying reason via {@link PlatformError.reason}
 * - Match normalized system failures with {@link SystemErrorTag}
 *
 * **Gotchas**
 *
 * - `PlatformError` is a wrapper; inspect `reason` to distinguish
 *   `BadArgument` from `SystemError`
 * - `SystemErrorTag` values are normalized categories, not necessarily raw
 *   platform error codes
 * - The original cause is preserved when provided, but portable handling
 *   should rely on the normalized fields
 *
 * @since 4.0.0
 */
import * as Data from "./Data.js";
const TypeId = "~effect/platform/PlatformError";
/**
 * Error data for an invalid argument passed to a platform API.
 *
 * **Details**
 *
 * The error records the module and method that rejected the argument, with an
 * optional description and cause. It is usually wrapped in `PlatformError`.
 *
 * @category models
 * @since 4.0.0
 */
export class BadArgument extends /*#__PURE__*/Data.TaggedError("BadArgument") {
  /**
   * Formats the module, method, and optional description that rejected the argument.
   *
   * @since 4.0.0
   */
  get message() {
    return `${this.module}.${this.method}${this.description ? `: ${this.description}` : ""}`;
  }
}
/**
 * Error data for a platform or system operation failure.
 *
 * **Details**
 *
 * The error records a normalized `_tag`, the module and method that failed,
 * and optional details such as the syscall, path or descriptor, description,
 * and original cause. It is usually wrapped in `PlatformError`.
 *
 * @category models
 * @since 4.0.0
 */
export class SystemError extends Data.Error {
  /**
   * Formats the normalized system error tag with operation and path details.
   *
   * @since 4.0.0
   */
  get message() {
    return `${this._tag}: ${this.module}.${this.method}${this.pathOrDescriptor !== undefined ? ` (${this.pathOrDescriptor})` : ""}${this.description ? `: ${this.description}` : ""}`;
  }
}
/**
 * Tagged error used by platform APIs to report either invalid arguments or
 * system-level failures.
 *
 * **Details**
 *
 * The `reason` field contains the underlying `BadArgument` or `SystemError`.
 * When that reason has a cause, the cause is preserved on the wrapper.
 *
 * @category models
 * @since 4.0.0
 */
export class PlatformError extends /*#__PURE__*/Data.TaggedError("PlatformError") {
  constructor(reason) {
    if ("cause" in reason) {
      super({
        reason,
        cause: reason.cause
      });
    } else {
      super({
        reason
      });
    }
  }
  /**
   * Marks this value as a platform error wrapper for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId] = TypeId;
  get message() {
    return this.reason.message;
  }
}
/**
 * Creates a `PlatformError` whose reason is a `SystemError`.
 *
 * **When to use**
 *
 * Use this helper when adapting an operating-system or platform failure into
 * the normalized platform error model.
 *
 * @category constructors
 * @since 4.0.0
 */
export const systemError = options => new PlatformError(new SystemError(options));
/**
 * Creates a `PlatformError` whose reason is a `BadArgument`.
 *
 * **When to use**
 *
 * Use this helper when a platform API rejects caller input before performing
 * the underlying operation.
 *
 * @category constructors
 * @since 4.0.0
 */
export const badArgument = options => new PlatformError(new BadArgument(options));
//# sourceMappingURL=PlatformError.js.map