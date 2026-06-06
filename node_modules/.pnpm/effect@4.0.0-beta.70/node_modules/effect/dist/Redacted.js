/**
 * The Redacted module provides functionality for handling sensitive information
 * securely within your application. By using the `Redacted` data type, you can
 * ensure that sensitive values are not accidentally exposed in logs or error
 * messages.
 *
 * @since 3.3.0
 */
import * as Equal from "./Equal.js";
import * as Equivalence from "./Equivalence.js";
import * as Hash from "./Hash.js";
import { PipeInspectableProto } from "./internal/core.js";
import * as redacted from "./internal/redacted.js";
import { hasProperty, isString } from "./Predicate.js";
const TypeId = "~effect/data/Redacted";
/**
 * Returns `true` if a value is a `Redacted` wrapper.
 *
 * **Details**
 *
 * When this function returns `true`, TypeScript narrows the value to
 * `Redacted<unknown>`.
 *
 * **Example** (Checking for redacted values)
 *
 * ```ts
 * import { Redacted } from "effect"
 *
 * const secret = Redacted.make("my-secret")
 * const plainString = "not-secret"
 *
 * console.log(Redacted.isRedacted(secret)) // true
 * console.log(Redacted.isRedacted(plainString)) // false
 * ```
 *
 * @category refinements
 * @since 3.3.0
 */
export const isRedacted = u => hasProperty(u, TypeId);
/**
 * Creates a `Redacted` wrapper for a sensitive value.
 *
 * **Details**
 *
 * The wrapper redacts string, JSON, and inspection output to reduce accidental
 * disclosure. The original value remains retrievable with `Redacted.value`
 * until the wrapper is wiped or becomes unreachable.
 *
 * **Example** (Creating a redacted value)
 *
 * ```ts
 * import { Redacted } from "effect"
 *
 * const API_KEY = Redacted.make("1234567890")
 * ```
 *
 * @category constructors
 * @since 3.3.0
 */
export const make = (value, options) => {
  const self = Object.create(Proto);
  if (options?.label) {
    self.label = options.label;
  }
  redacted.redactedRegistry.set(self, value);
  return self;
};
const Proto = {
  [TypeId]: {
    _A: _ => _
  },
  label: undefined,
  ...PipeInspectableProto,
  toJSON() {
    return this.toString();
  },
  toString() {
    return `<redacted${isString(this.label) ? ":" + this.label : ""}>`;
  },
  [Hash.symbol]() {
    return Hash.hash(redacted.redactedRegistry.get(this));
  },
  [Equal.symbol](that) {
    return isRedacted(that) && Equal.equals(redacted.redactedRegistry.get(this), redacted.redactedRegistry.get(that));
  }
};
/**
 * Retrieves the original value from a `Redacted` instance. Use this function
 * with caution, as it exposes the sensitive data.
 *
 * **Example** (Retrieving a redacted value)
 *
 * ```ts
 * import { Redacted } from "effect"
 * import * as assert from "node:assert"
 *
 * const API_KEY = Redacted.make("1234567890")
 *
 * assert.equal(Redacted.value(API_KEY), "1234567890")
 * ```
 *
 * @category getters
 * @since 3.3.0
 */
export const value = redacted.value;
/**
 * Deletes the stored value for a `Redacted` wrapper, making future
 * `Redacted.value` calls on that wrapper fail.
 *
 * **Gotchas**
 *
 * This unsafe operation does not zero memory and does not affect other
 * references to the original value. It only removes the value from the
 * internal redacted registry.
 *
 * **Example** (Wiping a redacted value)
 *
 * ```ts
 * import { Redacted } from "effect"
 * import * as assert from "node:assert"
 *
 * const API_KEY = Redacted.make("1234567890")
 *
 * assert.equal(Redacted.value(API_KEY), "1234567890")
 *
 * Redacted.wipeUnsafe(API_KEY)
 *
 * assert.throws(
 *   () => Redacted.value(API_KEY),
 *   new Error("Unable to get redacted value")
 * )
 * ```
 *
 * @category unsafe
 * @since 4.0.0
 */
export const wipeUnsafe = self => redacted.redactedRegistry.delete(self);
/**
 * Generates an equivalence relation for `Redacted<A>` values based on an
 * equivalence relation for the underlying values `A`. This function is useful
 * for comparing `Redacted` instances without exposing their contents.
 *
 * **Example** (Comparing redacted values)
 *
 * ```ts
 * import { Equivalence, Redacted } from "effect"
 * import * as assert from "node:assert"
 *
 * const API_KEY1 = Redacted.make("1234567890")
 * const API_KEY2 = Redacted.make("1-34567890")
 * const API_KEY3 = Redacted.make("1234567890")
 *
 * const equivalence = Redacted.makeEquivalence(Equivalence.strictEqual<string>())
 *
 * assert.equal(equivalence(API_KEY1, API_KEY2), false)
 * assert.equal(equivalence(API_KEY1, API_KEY3), true)
 * ```
 *
 * @category equivalence
 * @since 4.0.0
 */
export const makeEquivalence = isEquivalent => Equivalence.make((x, y) => isEquivalent(value(x), value(y)));
//# sourceMappingURL=Redacted.js.map