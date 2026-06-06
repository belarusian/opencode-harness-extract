/**
 * The `Unify` module contains the type-level protocol Effect uses to normalize
 * unions of data types that opt in to unification. It is primarily a library
 * authoring tool: data types expose hidden symbol properties describing how
 * their variants should be widened, and {@link Unify} turns those protocol
 * entries into the user-facing union type that TypeScript should infer.
 *
 * Most application code does not need to interact with these symbols directly.
 * The main runtime helper, {@link unify}, is an identity function that preserves
 * values and functions at runtime while applying {@link Unify} to the relevant
 * static type. This is useful when authoring APIs that return branded or
 * protocol-enabled values and need inference to collapse to the public Effect
 * data type rather than exposing implementation details.
 *
 * @since 2.0.0
 */
import { identity } from "./Function.js";
/**
 * Applies `Unify` to a value or function return type at compile time.
 *
 * **Details**
 *
 * This is an identity function at runtime. For functions, the returned function
 * has the same runtime behavior while its return type is normalized with the
 * Effect unification protocol.
 *
 * **Example** (Unifying values and function results)
 *
 * ```ts
 * import { Unify } from "effect"
 *
 * // Unify a simple value
 * const unifiedValue = Unify.unify("hello")
 * // Type: string
 *
 * // Unify a function result
 * const createUnifiableValue = () => ({
 *   value: "test",
 *   [Unify.typeSymbol]: "string" as const,
 *   [Unify.unifySymbol]: { String: () => "test" as const }
 * })
 *
 * const unifiedFunction = Unify.unify(createUnifiableValue)
 * // The result will be properly unified
 *
 * // Unify with curried functions
 * const curriedFunction = (a: string) => (b: number) => ({ result: a + b })
 * const unifiedCurried = Unify.unify(curriedFunction)
 * // Type: (a: string) => (b: number) => Unify<{ result: string }>
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const unify = identity;
//# sourceMappingURL=Unify.js.map