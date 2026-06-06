import { pipeArguments } from "./Pipeable.js";
/**
 * Creates a function that can be called in data-first style or data-last
 * (`pipe`-friendly) style.
 *
 * **Details**
 *
 * Pass either the arity of the uncurried function or a predicate that decides
 * whether the current call is data-first. Arity is the common case. Use a
 * predicate when optional arguments make arity ambiguous.
 *
 * **Example** (Using arity to determine data-first or data-last style)
 *
 * ```ts
 * import { Function, pipe } from "effect"
 *
 * const sum = Function.dual<
 *   (that: number) => (self: number) => number,
 *   (self: number, that: number) => number
 * >(2, (self, that) => self + that)
 *
 * console.log(sum(2, 3)) // 5
 * console.log(pipe(2, sum(3))) // 5
 * ```
 *
 * **Example** (Using call signatures to define the overloads)
 *
 * ```ts
 * import { Function, pipe } from "effect"
 *
 * const sum: {
 *   (that: number): (self: number) => number
 *   (self: number, that: number): number
 * } = Function.dual(2, (self: number, that: number): number => self + that)
 *
 * console.log(sum(2, 3)) // 5
 * console.log(pipe(2, sum(3))) // 5
 * ```
 *
 * **Example** (Using a predicate to determine data-first or data-last style)
 *
 * ```ts
 * import { Function, pipe } from "effect"
 *
 * const sum = Function.dual<
 *   (that: number) => (self: number) => number,
 *   (self: number, that: number) => number
 * >(
 *   (args) => args.length === 2,
 *   (self, that) => self + that
 * )
 *
 * console.log(sum(2, 3)) // 5
 * console.log(pipe(2, sum(3))) // 5
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const dual = function (arity, body) {
  if (typeof arity === "function") {
    return function () {
      return arity(arguments) ? body.apply(this, arguments) : self => body(self, ...arguments);
    };
  }
  switch (arity) {
    case 0:
    case 1:
      throw new RangeError(`Invalid arity ${arity}`);
    case 2:
      return function (a, b) {
        if (arguments.length >= 2) {
          return body(a, b);
        }
        return function (self) {
          return body(self, a);
        };
      };
    case 3:
      return function (a, b, c) {
        if (arguments.length >= 3) {
          return body(a, b, c);
        }
        return function (self) {
          return body(self, a, b);
        };
      };
    default:
      return function () {
        if (arguments.length >= arity) {
          // @ts-expect-error
          return body.apply(this, arguments);
        }
        const args = arguments;
        return function (self) {
          return body(self, ...args);
        };
      };
  }
};
/**
 * Apply a function to a given value.
 *
 * **Example** (Applying an argument to a function)
 *
 * ```ts
 * import { Function, pipe, String } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(pipe(String.length, Function.apply("hello")), 5)
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const apply = a => self => self(a);
/**
 * The identity function, i.e. A function that returns its input argument.
 *
 * **Example** (Returning the same value)
 *
 * ```ts
 * import { identity } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(identity(5), 5)
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const identity = a => a;
/**
 * A function that ensures that the type of an expression matches some type,
 * without changing the resulting type of that expression.
 *
 * **Example** (Checking an expression against a type)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * const test1 = Function.satisfies<number>()(5 as const)
 * // ^? const test: 5
 * // @ts-expect-error
 * const test2 = Function.satisfies<string>()(5)
 * // ^? Argument of type 'number' is not assignable to parameter of type 'string'
 *
 * assert.deepStrictEqual(Function.satisfies<number>()(5), 5)
 * ```
 *
 * @category type utils
 * @since 2.0.0
 */
export const satisfies = () => b => b;
/**
 * Returns the input value with a different static type.
 *
 * **Gotchas**
 *
 * This is a type-level cast only; it performs no runtime validation or
 * conversion.
 *
 * @category type utils
 * @since 4.0.0
 */
export const cast = identity;
/**
 * Creates a zero-argument function that always returns the provided value.
 *
 * **When to use**
 *
 * Use `constant` when an API expects a thunk or callback and every invocation
 * should return the same value.
 *
 * **Example** (Creating a constant thunk)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * const constNull = Function.constant(null)
 *
 * assert.deepStrictEqual(constNull(), null)
 * assert.deepStrictEqual(constNull(), null)
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const constant = value => () => value;
/**
 * A thunk that returns always `true`.
 *
 * **Example** (Returning true from a thunk)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(Function.constTrue(), true)
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
export const constTrue = /*#__PURE__*/constant(true);
/**
 * A thunk that returns always `false`.
 *
 * **Example** (Returning false from a thunk)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(Function.constFalse(), false)
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
export const constFalse = /*#__PURE__*/constant(false);
/**
 * A thunk that returns always `null`.
 *
 * **Example** (Returning null from a thunk)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(Function.constNull(), null)
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
export const constNull = /*#__PURE__*/constant(null);
/**
 * A thunk that returns always `undefined`.
 *
 * **Example** (Returning undefined from a thunk)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(Function.constUndefined(), undefined)
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
export const constUndefined = /*#__PURE__*/constant(undefined);
/**
 * A thunk that returns always `void`.
 *
 * **Example** (Returning void from a thunk)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(Function.constVoid(), undefined)
 * ```
 *
 * @category constants
 * @since 2.0.0
 */
export const constVoid = constUndefined;
/**
 * Reverses the order of arguments for a curried function.
 *
 * **Example** (Flipping curried arguments)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * const f = (a: number) => (b: string) => a - b.length
 *
 * assert.deepStrictEqual(Function.flip(f)("aaa")(2), -1)
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const flip = f => (...b) => (...a) => f(...a)(...b);
/**
 * Composes two functions, `ab` and `bc` into a single function that takes in an argument `a` of type `A` and returns a result of type `C`.
 * The result is obtained by first applying the `ab` function to `a` and then applying the `bc` function to the result of `ab`.
 *
 * **Example** (Composing two functions)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * const increment = (n: number) => n + 1
 * const square = (n: number) => n * n
 *
 * assert.strictEqual(Function.compose(increment, square)(2), 9)
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const compose = /*#__PURE__*/dual(2, (ab, bc) => a => bc(ab(a)));
/**
 * Marks an impossible branch by accepting a `never` value and returning any
 * type.
 *
 * **When to use**
 *
 * Use `absurd` when exhaustive checks prove a branch cannot be reached, but
 * TypeScript still needs a return value.
 *
 * **Gotchas**
 *
 * Calling `absurd` throws, because a value of type `never` should be
 * impossible at runtime.
 *
 * **Example** (Handling impossible values)
 *
 * ```ts
 * import { absurd } from "effect"
 *
 * const handleNever = (value: never) => {
 *   return absurd(value) // This will throw an error if called
 * }
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const absurd = _ => {
  throw new Error("Called `absurd` function which should be uncallable");
};
/**
 * Creates a tupled version of this function: instead of `n` arguments, it accepts a single tuple argument.
 *
 * **Example** (Converting arguments to a tuple)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * const sumTupled = Function.tupled((x: number, y: number): number => x + y)
 *
 * assert.deepStrictEqual(sumTupled([1, 2]), 3)
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const tupled = f => a => f(...a);
/**
 * Inverse function of `tupled`
 *
 * **Example** (Converting a tuple to arguments)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * const getFirst = Function.untupled(<A, B>(tuple: [A, B]): A => tuple[0])
 *
 * assert.deepStrictEqual(getFirst(1, 2), 1)
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const untupled = f => (...a) => f(a);
export function pipe(a, ...args) {
  return pipeArguments(a, args);
}
export function flow(ab, bc, cd, de, ef, fg, gh, hi, ij) {
  switch (arguments.length) {
    case 1:
      return ab;
    case 2:
      return function () {
        return bc(ab.apply(this, arguments));
      };
    case 3:
      return function () {
        return cd(bc(ab.apply(this, arguments)));
      };
    case 4:
      return function () {
        return de(cd(bc(ab.apply(this, arguments))));
      };
    case 5:
      return function () {
        return ef(de(cd(bc(ab.apply(this, arguments)))));
      };
    case 6:
      return function () {
        return fg(ef(de(cd(bc(ab.apply(this, arguments))))));
      };
    case 7:
      return function () {
        return gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))));
      };
    case 8:
      return function () {
        return hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments))))))));
      };
    case 9:
      return function () {
        return ij(hi(gh(fg(ef(de(cd(bc(ab.apply(this, arguments)))))))));
      };
  }
  return;
}
/**
 * Creates a compile-time placeholder for a value of any type.
 *
 * **Gotchas**
 *
 * `hole` is intended for temporary development use. If the placeholder is
 * evaluated at runtime, it throws.
 *
 * **Example** (Creating a development placeholder)
 *
 * ```ts
 * import { hole } from "effect"
 *
 * // Intentionally not called: `hole` throws if the placeholder is evaluated.
 * const buildUser = (id: number): { readonly id: number; readonly name: string } => ({
 *   id,
 *   name: hole<string>()
 * })
 *
 * console.log(typeof buildUser) // "function"
 * ```
 *
 * @category utils
 * @since 2.0.0
 */
export const hole = /*#__PURE__*/cast(absurd);
/**
 * The SK combinator, also known as the "S-K combinator" or "S-combinator", is
 * a fundamental combinator in the lambda calculus and the SKI combinator
 * calculus.
 *
 * **When to use**
 *
 * Use `SK` to discard the first argument and return the second argument.
 *
 * **Example** (Discarding the first argument)
 *
 * ```ts
 * import { Function } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(Function.SK(0, "hello"), "hello")
 * ```
 *
 * @category combinators
 * @since 2.0.0
 */
export const SK = (_, b) => b;
/**
 * Memoizes a function whose input is an object, caching results by object
 * identity.
 *
 * @category utils
 * @since 4.0.0
 */
export function memoize(f) {
  const cache = new WeakMap();
  return a => {
    if (cache.has(a)) {
      return cache.get(a);
    }
    const result = f(a);
    cache.set(a, result);
    return result;
  };
}
//# sourceMappingURL=Function.js.map