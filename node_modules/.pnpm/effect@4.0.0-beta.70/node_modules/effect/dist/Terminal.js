import * as Context from "./Context.js";
import * as Predicate from "./Predicate.js";
import * as Schema from "./Schema.js";
const TypeId = "~effect/platform/Terminal";
const QuitErrorTypeId = "effect/platform/Terminal/QuitError";
/**
 * A `QuitError` represents an error that occurs when a user attempts to
 * quit out of a `Terminal` prompt for input (usually by entering `ctrl`+`c`).
 *
 * @category QuitError
 * @since 4.0.0
 */
export class QuitError extends /*#__PURE__*/Schema.ErrorClass("QuitError")({
  _tag: /*#__PURE__*/Schema.tag("QuitError")
}) {
  /**
   * Marks this value as a terminal quit error for runtime guards.
   *
   * @since 4.0.0
   */
  [QuitErrorTypeId] = QuitErrorTypeId;
}
/**
 * Returns `true` if the provided value is a `Terminal.QuitError`.
 *
 * @category QuitError
 * @since 4.0.0
 */
export const isQuitError = u => Predicate.hasProperty(u, QuitErrorTypeId);
/**
 * Context service tag for accessing a `Terminal` implementation.
 *
 * @category services
 * @since 4.0.0
 */
export const Terminal = /*#__PURE__*/Context.Service("effect/platform/Terminal");
/**
 * Creates a Terminal implementation
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = impl => Terminal.of({
  ...impl,
  [TypeId]: TypeId
});
//# sourceMappingURL=Terminal.js.map