import { pipeArguments } from "./Pipeable.js";
import { hasProperty } from "./Predicate.js";
/**
 * Symbol used to identify objects that implement the {@link Redactable}
 * protocol.
 *
 * **When to use**
 *
 * Use this symbol as the property key when implementing {@link Redactable}.
 *
 * **Details**
 *
 * Add a method under this key to make an object redactable. The method receives
 * the current `Context` and must return the replacement value. The symbol is
 * registered globally via `Symbol.for("~effect/Redactable")`, so it is
 * identical across multiple copies of the library at runtime.
 *
 * **Example** (Masking an API key)
 *
 * ```ts
 * import { Context, Redactable } from "effect"
 *
 * class ApiKey {
 *   constructor(readonly raw: string) {}
 *
 *   [Redactable.symbolRedactable](_ctx: Context.Context<never>) {
 *     return this.raw.slice(0, 4) + "..."
 *   }
 * }
 * ```
 *
 * @see {@link Redactable} - the interface this symbol belongs to
 * @see {@link isRedactable} - check whether a value has this symbol
 * @category symbol
 * @since 3.10.0
 */
export const symbolRedactable = /*#__PURE__*/Symbol.for("~effect/Redactable");
/**
 * Type guard that checks whether a value implements the {@link Redactable}
 * interface.
 *
 * @see {@link Redactable} - the interface being checked
 * @see {@link redact} - applies redaction if the value is redactable
 * @category guards
 * @since 3.10.0
 */
export const isRedactable = u => hasProperty(u, symbolRedactable);
/**
 * Redacts a value if it implements {@link Redactable}, otherwise returns it
 * unchanged.
 *
 * **When to use**
 *
 * Use this as the general-purpose entry point for redaction when the input may
 * or may not implement the redaction protocol.
 *
 * **Details**
 *
 * This function calls {@link isRedactable} and, when it returns `true`,
 * delegates to {@link getRedacted}. It does not mutate the input.
 *
 * **Gotchas**
 *
 * Redaction is not recursive. Nested redactable values inside the returned
 * object are not automatically redacted.
 *
 * @see {@link isRedactable} - check before redacting
 * @see {@link getRedacted} - lower-level variant for known redactables
 * @category destructors
 * @since 3.10.0
 */
export function redact(u) {
  if (isRedactable(u)) return getRedacted(u);
  return u;
}
/**
 * Calls `[symbolRedactable]` on a value that is already known to be
 * {@link Redactable} and returns the result.
 *
 * **When to use**
 *
 * Use this when you have already verified the value is `Redactable`, for
 * example with {@link isRedactable}, and want to avoid a second check.
 *
 * **Details**
 *
 * This function reads the current fiber's `Context` from the global fiber
 * reference and passes it to the redaction method. It does not mutate the input.
 *
 * **Gotchas**
 *
 * If no fiber is active, an empty `Context` is passed to the redaction method.
 *
 * @see {@link redact} - higher-level variant that handles non-redactable values
 * @see {@link isRedactable} - type guard to verify before calling this
 * @category destructors
 * @since 4.0.0
 */
export function getRedacted(redactable) {
  return redactable[symbolRedactable](globalThis[currentFiberTypeId]?.context ?? emptyContext);
}
/** @internal */
export const currentFiberTypeId = "~effect/Fiber/currentFiber";
const emptyContext = {
  "~effect/Context": {},
  mapUnsafe: /*#__PURE__*/new Map(),
  pipe() {
    return pipeArguments(this, arguments);
  }
};
//# sourceMappingURL=Redactable.js.map