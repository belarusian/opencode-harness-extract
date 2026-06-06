/**
 * This module provides utility functions and type class instances for working with the `bigint` type in TypeScript.
 * It includes functions for basic arithmetic operations.
 *
 * @since 2.0.0
 */
import * as Combiner from "./Combiner.ts";
import * as Equ from "./Equivalence.ts";
import * as Option from "./Option.ts";
import * as order from "./Order.ts";
import type { Ordering } from "./Ordering.ts";
import * as Reducer from "./Reducer.ts";
/**
 * Reference to the global BigInt constructor.
 *
 * **Example** (Constructing bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 *
 * const bigInt = BigInt.BigInt(123)
 * console.log(bigInt) // 123n
 *
 * const fromString = BigInt.BigInt("456")
 * console.log(fromString) // 456n
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const BigInt: BigIntConstructor;
/**
 * Tests if a value is a `bigint`.
 *
 * **Example** (Checking for bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.isBigInt(1n), true)
 * assert.deepStrictEqual(BigInt.isBigInt(1), false)
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
export declare const isBigInt: (u: unknown) => u is bigint;
/**
 * Provides an addition operation on `bigint`s.
 *
 * **Example** (Adding bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.sum(2n, 3n), 5n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const sum: {
    /**
     * Provides an addition operation on `bigint`s.
     *
     * **Example** (Adding bigints)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.sum(2n, 3n), 5n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Provides an addition operation on `bigint`s.
     *
     * **Example** (Adding bigints)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.sum(2n, 3n), 5n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Provides a multiplication operation on `bigint`s.
 *
 * **Example** (Multiplying bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.multiply(2n, 3n), 6n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const multiply: {
    /**
     * Provides a multiplication operation on `bigint`s.
     *
     * **Example** (Multiplying bigints)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.multiply(2n, 3n), 6n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Provides a multiplication operation on `bigint`s.
     *
     * **Example** (Multiplying bigints)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.multiply(2n, 3n), 6n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Provides a subtraction operation on `bigint`s.
 *
 * **Example** (Subtracting bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.subtract(2n, 3n), -1n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const subtract: {
    /**
     * Provides a subtraction operation on `bigint`s.
     *
     * **Example** (Subtracting bigints)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.subtract(2n, 3n), -1n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Provides a subtraction operation on `bigint`s.
     *
     * **Example** (Subtracting bigints)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.subtract(2n, 3n), -1n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Safely divides one `bigint` by another.
 *
 * **Details**
 *
 * Uses JavaScript `bigint` division, so non-exact quotients are truncated
 * toward zero. Returns `Option.none()` when the divisor is `0n`.
 *
 * **Example** (Dividing bigints safely)
 *
 * ```ts
 * import { BigInt, Option } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.divide(6n, 3n), Option.some(2n))
 * assert.deepStrictEqual(BigInt.divide(6n, 0n), Option.none())
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const divide: {
    /**
     * Safely divides one `bigint` by another.
     *
     * **Details**
     *
     * Uses JavaScript `bigint` division, so non-exact quotients are truncated
     * toward zero. Returns `Option.none()` when the divisor is `0n`.
     *
     * **Example** (Dividing bigints safely)
     *
     * ```ts
     * import { BigInt, Option } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.divide(6n, 3n), Option.some(2n))
     * assert.deepStrictEqual(BigInt.divide(6n, 0n), Option.none())
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => Option.Option<bigint>;
    /**
     * Safely divides one `bigint` by another.
     *
     * **Details**
     *
     * Uses JavaScript `bigint` division, so non-exact quotients are truncated
     * toward zero. Returns `Option.none()` when the divisor is `0n`.
     *
     * **Example** (Dividing bigints safely)
     *
     * ```ts
     * import { BigInt, Option } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.divide(6n, 3n), Option.some(2n))
     * assert.deepStrictEqual(BigInt.divide(6n, 0n), Option.none())
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): Option.Option<bigint>;
};
/**
 * Divides one `bigint` by another, throwing if the divisor is zero.
 *
 * **Details**
 *
 * Uses JavaScript `bigint` division, so non-exact quotients are truncated
 * toward zero.
 *
 * **Gotchas**
 *
 * Throws a `RangeError` when the divisor is `0n`.
 *
 * **Example** (Dividing bigints unsafely)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.divideUnsafe(6n, 3n), 2n)
 * assert.deepStrictEqual(BigInt.divideUnsafe(6n, 4n), 1n)
 * ```
 *
 * @category math
 * @since 4.0.0
 */
export declare const divideUnsafe: {
    /**
     * Divides one `bigint` by another, throwing if the divisor is zero.
     *
     * **Details**
     *
     * Uses JavaScript `bigint` division, so non-exact quotients are truncated
     * toward zero.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` when the divisor is `0n`.
     *
     * **Example** (Dividing bigints unsafely)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.divideUnsafe(6n, 3n), 2n)
     * assert.deepStrictEqual(BigInt.divideUnsafe(6n, 4n), 1n)
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Divides one `bigint` by another, throwing if the divisor is zero.
     *
     * **Details**
     *
     * Uses JavaScript `bigint` division, so non-exact quotients are truncated
     * toward zero.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` when the divisor is `0n`.
     *
     * **Example** (Dividing bigints unsafely)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.divideUnsafe(6n, 3n), 2n)
     * assert.deepStrictEqual(BigInt.divideUnsafe(6n, 4n), 1n)
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Returns the result of adding `1n` to a `bigint`.
 *
 * **Example** (Incrementing a bigint)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.increment(2n), 3n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const increment: (n: bigint) => bigint;
/**
 * Returns the result of subtracting `1n` from a `bigint`.
 *
 * **Example** (Decrementing a bigint)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.decrement(3n), 2n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const decrement: (n: bigint) => bigint;
/**
 * Provides an `Order` instance for `bigint` that allows comparing and sorting BigInt values.
 *
 * **Example** (Comparing bigints with Order)
 *
 * ```ts
 * import { BigInt } from "effect"
 *
 * const a = 123n
 * const b = 456n
 * const c = 123n
 *
 * console.log(BigInt.Order(a, b)) // -1 (a < b)
 * console.log(BigInt.Order(b, a)) // 1 (b > a)
 * console.log(BigInt.Order(a, c)) // 0 (a === c)
 * ```
 *
 * @category instances
 * @since 2.0.0
 */
export declare const Order: order.Order<bigint>;
/**
 * An `Equivalence` instance for bigints using strict equality (`===`).
 *
 * **Example** (Comparing bigints for equivalence)
 *
 * ```ts
 * import { BigInt } from "effect"
 *
 * console.log(BigInt.Equivalence(1n, 1n)) // true
 * console.log(BigInt.Equivalence(1n, 2n)) // false
 * ```
 *
 * @category instances
 * @since 2.0.0
 */
export declare const Equivalence: Equ.Equivalence<bigint>;
/**
 * Returns `true` if the first argument is less than the second, otherwise `false`.
 *
 * **Example** (Checking less-than comparisons)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.isLessThan(2n, 3n), true)
 * assert.deepStrictEqual(BigInt.isLessThan(3n, 3n), false)
 * assert.deepStrictEqual(BigInt.isLessThan(4n, 3n), false)
 * ```
 *
 * @category predicates
 * @since 4.0.0
 */
export declare const isLessThan: {
    /**
     * Returns `true` if the first argument is less than the second, otherwise `false`.
     *
     * **Example** (Checking less-than comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isLessThan(2n, 3n), true)
     * assert.deepStrictEqual(BigInt.isLessThan(3n, 3n), false)
     * assert.deepStrictEqual(BigInt.isLessThan(4n, 3n), false)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: bigint): (self: bigint) => boolean;
    /**
     * Returns `true` if the first argument is less than the second, otherwise `false`.
     *
     * **Example** (Checking less-than comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isLessThan(2n, 3n), true)
     * assert.deepStrictEqual(BigInt.isLessThan(3n, 3n), false)
     * assert.deepStrictEqual(BigInt.isLessThan(4n, 3n), false)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: bigint, that: bigint): boolean;
};
/**
 * Returns a function that checks if a given `bigint` is less than or equal to the provided one.
 *
 * **Example** (Checking less-than-or-equal comparisons)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(2n, 3n), true)
 * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(3n, 3n), true)
 * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(4n, 3n), false)
 * ```
 *
 * @category predicates
 * @since 4.0.0
 */
export declare const isLessThanOrEqualTo: {
    /**
     * Returns a function that checks if a given `bigint` is less than or equal to the provided one.
     *
     * **Example** (Checking less-than-or-equal comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(2n, 3n), true)
     * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(3n, 3n), true)
     * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(4n, 3n), false)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: bigint): (self: bigint) => boolean;
    /**
     * Returns a function that checks if a given `bigint` is less than or equal to the provided one.
     *
     * **Example** (Checking less-than-or-equal comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(2n, 3n), true)
     * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(3n, 3n), true)
     * assert.deepStrictEqual(BigInt.isLessThanOrEqualTo(4n, 3n), false)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: bigint, that: bigint): boolean;
};
/**
 * Returns `true` if the first argument is greater than the second, otherwise `false`.
 *
 * **Example** (Checking greater-than comparisons)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.isGreaterThan(2n, 3n), false)
 * assert.deepStrictEqual(BigInt.isGreaterThan(3n, 3n), false)
 * assert.deepStrictEqual(BigInt.isGreaterThan(4n, 3n), true)
 * ```
 *
 * @category predicates
 * @since 4.0.0
 */
export declare const isGreaterThan: {
    /**
     * Returns `true` if the first argument is greater than the second, otherwise `false`.
     *
     * **Example** (Checking greater-than comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isGreaterThan(2n, 3n), false)
     * assert.deepStrictEqual(BigInt.isGreaterThan(3n, 3n), false)
     * assert.deepStrictEqual(BigInt.isGreaterThan(4n, 3n), true)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: bigint): (self: bigint) => boolean;
    /**
     * Returns `true` if the first argument is greater than the second, otherwise `false`.
     *
     * **Example** (Checking greater-than comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isGreaterThan(2n, 3n), false)
     * assert.deepStrictEqual(BigInt.isGreaterThan(3n, 3n), false)
     * assert.deepStrictEqual(BigInt.isGreaterThan(4n, 3n), true)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: bigint, that: bigint): boolean;
};
/**
 * Returns a function that checks if a given `bigint` is greater than or equal to the provided one.
 *
 * **Example** (Checking greater-than-or-equal comparisons)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(2n, 3n), false)
 * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(3n, 3n), true)
 * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(4n, 3n), true)
 * ```
 *
 * @category predicates
 * @since 4.0.0
 */
export declare const isGreaterThanOrEqualTo: {
    /**
     * Returns a function that checks if a given `bigint` is greater than or equal to the provided one.
     *
     * **Example** (Checking greater-than-or-equal comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(2n, 3n), false)
     * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(3n, 3n), true)
     * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(4n, 3n), true)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: bigint): (self: bigint) => boolean;
    /**
     * Returns a function that checks if a given `bigint` is greater than or equal to the provided one.
     *
     * **Example** (Checking greater-than-or-equal comparisons)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(2n, 3n), false)
     * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(3n, 3n), true)
     * assert.deepStrictEqual(BigInt.isGreaterThanOrEqualTo(4n, 3n), true)
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: bigint, that: bigint): boolean;
};
/**
 * Checks if a `bigint` is between a `minimum` and `maximum` value (inclusive).
 *
 * **Example** (Checking whether a bigint is within bounds)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * const between = BigInt.between({ minimum: 0n, maximum: 5n })
 *
 * assert.deepStrictEqual(between(3n), true)
 * assert.deepStrictEqual(between(-1n), false)
 * assert.deepStrictEqual(between(6n), false)
 * ```
 *
 * @category predicates
 * @since 2.0.0
 */
export declare const between: {
    /**
     * Checks if a `bigint` is between a `minimum` and `maximum` value (inclusive).
     *
     * **Example** (Checking whether a bigint is within bounds)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * const between = BigInt.between({ minimum: 0n, maximum: 5n })
     *
     * assert.deepStrictEqual(between(3n), true)
     * assert.deepStrictEqual(between(-1n), false)
     * assert.deepStrictEqual(between(6n), false)
     * ```
     *
     * @category predicates
     * @since 2.0.0
     */
    (options: {
        minimum: bigint;
        maximum: bigint;
    }): (self: bigint) => boolean;
    /**
     * Checks if a `bigint` is between a `minimum` and `maximum` value (inclusive).
     *
     * **Example** (Checking whether a bigint is within bounds)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * const between = BigInt.between({ minimum: 0n, maximum: 5n })
     *
     * assert.deepStrictEqual(between(3n), true)
     * assert.deepStrictEqual(between(-1n), false)
     * assert.deepStrictEqual(between(6n), false)
     * ```
     *
     * @category predicates
     * @since 2.0.0
     */
    (self: bigint, options: {
        minimum: bigint;
        maximum: bigint;
    }): boolean;
};
/**
 * Restricts the given `bigint` to be within the range specified by the `minimum` and `maximum` values.
 *
 * **Details**
 *
 * - If the `bigint` is less than the `minimum` value, the function returns the `minimum` value.
 * - If the `bigint` is greater than the `maximum` value, the function returns the `maximum` value.
 * - Otherwise, it returns the original `bigint`.
 *
 * **Example** (Clamping a bigint to bounds)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * const clamp = BigInt.clamp({ minimum: 1n, maximum: 5n })
 *
 * assert.equal(clamp(3n), 3n)
 * assert.equal(clamp(0n), 1n)
 * assert.equal(clamp(6n), 5n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const clamp: {
    /**
     * Restricts the given `bigint` to be within the range specified by the `minimum` and `maximum` values.
     *
     * **Details**
     *
     * - If the `bigint` is less than the `minimum` value, the function returns the `minimum` value.
     * - If the `bigint` is greater than the `maximum` value, the function returns the `maximum` value.
     * - Otherwise, it returns the original `bigint`.
     *
     * **Example** (Clamping a bigint to bounds)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * const clamp = BigInt.clamp({ minimum: 1n, maximum: 5n })
     *
     * assert.equal(clamp(3n), 3n)
     * assert.equal(clamp(0n), 1n)
     * assert.equal(clamp(6n), 5n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (options: {
        minimum: bigint;
        maximum: bigint;
    }): (self: bigint) => bigint;
    /**
     * Restricts the given `bigint` to be within the range specified by the `minimum` and `maximum` values.
     *
     * **Details**
     *
     * - If the `bigint` is less than the `minimum` value, the function returns the `minimum` value.
     * - If the `bigint` is greater than the `maximum` value, the function returns the `maximum` value.
     * - Otherwise, it returns the original `bigint`.
     *
     * **Example** (Clamping a bigint to bounds)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * const clamp = BigInt.clamp({ minimum: 1n, maximum: 5n })
     *
     * assert.equal(clamp(3n), 3n)
     * assert.equal(clamp(0n), 1n)
     * assert.equal(clamp(6n), 5n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, options: {
        minimum: bigint;
        maximum: bigint;
    }): bigint;
};
/**
 * Returns the minimum between two `bigint`s.
 *
 * **Example** (Finding the minimum bigint)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.min(2n, 3n), 2n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const min: {
    /**
     * Returns the minimum between two `bigint`s.
     *
     * **Example** (Finding the minimum bigint)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.min(2n, 3n), 2n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Returns the minimum between two `bigint`s.
     *
     * **Example** (Finding the minimum bigint)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.min(2n, 3n), 2n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Returns the maximum between two `bigint`s.
 *
 * **Example** (Finding the maximum bigint)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.max(2n, 3n), 3n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const max: {
    /**
     * Returns the maximum between two `bigint`s.
     *
     * **Example** (Finding the maximum bigint)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.max(2n, 3n), 3n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Returns the maximum between two `bigint`s.
     *
     * **Example** (Finding the maximum bigint)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.max(2n, 3n), 3n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Determines the sign of a given `bigint`.
 *
 * **Example** (Determining bigint signs)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.sign(-5n), -1)
 * assert.deepStrictEqual(BigInt.sign(0n), 0)
 * assert.deepStrictEqual(BigInt.sign(5n), 1)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const sign: (n: bigint) => Ordering;
/**
 * Determines the absolute value of a given `bigint`.
 *
 * **Example** (Calculating absolute values)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.abs(-5n), 5n)
 * assert.deepStrictEqual(BigInt.abs(0n), 0n)
 * assert.deepStrictEqual(BigInt.abs(5n), 5n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const abs: (n: bigint) => bigint;
/**
 * Determines the greatest common divisor of two `bigint`s.
 *
 * **Example** (Calculating greatest common divisors)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.gcd(2n, 3n), 1n)
 * assert.deepStrictEqual(BigInt.gcd(2n, 4n), 2n)
 * assert.deepStrictEqual(BigInt.gcd(16n, 24n), 8n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const gcd: {
    /**
     * Determines the greatest common divisor of two `bigint`s.
     *
     * **Example** (Calculating greatest common divisors)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.gcd(2n, 3n), 1n)
     * assert.deepStrictEqual(BigInt.gcd(2n, 4n), 2n)
     * assert.deepStrictEqual(BigInt.gcd(16n, 24n), 8n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Determines the greatest common divisor of two `bigint`s.
     *
     * **Example** (Calculating greatest common divisors)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.gcd(2n, 3n), 1n)
     * assert.deepStrictEqual(BigInt.gcd(2n, 4n), 2n)
     * assert.deepStrictEqual(BigInt.gcd(16n, 24n), 8n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Determines the least common multiple of two `bigint`s.
 *
 * **Example** (Calculating least common multiples)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.lcm(2n, 3n), 6n)
 * assert.deepStrictEqual(BigInt.lcm(2n, 4n), 4n)
 * assert.deepStrictEqual(BigInt.lcm(16n, 24n), 48n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const lcm: {
    /**
     * Determines the least common multiple of two `bigint`s.
     *
     * **Example** (Calculating least common multiples)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.lcm(2n, 3n), 6n)
     * assert.deepStrictEqual(BigInt.lcm(2n, 4n), 4n)
     * assert.deepStrictEqual(BigInt.lcm(16n, 24n), 48n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: bigint): (self: bigint) => bigint;
    /**
     * Determines the least common multiple of two `bigint`s.
     *
     * **Example** (Calculating least common multiples)
     *
     * ```ts
     * import { BigInt } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(BigInt.lcm(2n, 3n), 6n)
     * assert.deepStrictEqual(BigInt.lcm(2n, 4n), 4n)
     * assert.deepStrictEqual(BigInt.lcm(16n, 24n), 48n)
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: bigint, that: bigint): bigint;
};
/**
 * Returns the integer square root of a non-negative `bigint`.
 *
 * **Details**
 *
 * For non-perfect squares, returns the largest `bigint` whose square is less
 * than or equal to the input.
 *
 * **Gotchas**
 *
 * Throws a `RangeError` if the input is negative.
 *
 * **Example** (Calculating square roots unsafely)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.sqrtUnsafe(4n), 2n)
 * assert.deepStrictEqual(BigInt.sqrtUnsafe(9n), 3n)
 * assert.deepStrictEqual(BigInt.sqrtUnsafe(16n), 4n)
 * ```
 *
 * @category math
 * @since 4.0.0
 */
export declare const sqrtUnsafe: (n: bigint) => bigint;
/**
 * Safely returns the integer square root of a `bigint`.
 *
 * **Details**
 *
 * For non-perfect squares, returns the largest `bigint` whose square is less
 * than or equal to the input. Returns `Option.none()` when the input is
 * negative.
 *
 * **Example** (Calculating square roots safely)
 *
 * ```ts
 * import { BigInt } from "effect"
 *
 * BigInt.sqrt(4n) // Option.some(2n)
 * BigInt.sqrt(9n) // Option.some(3n)
 * BigInt.sqrt(16n) // Option.some(4n)
 * BigInt.sqrt(-1n) // Option.none()
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const sqrt: (n: bigint) => Option.Option<bigint>;
/**
 * Takes an `Iterable` of `bigint`s and returns their sum as a single `bigint`. Returns `0n` for an empty iterable.
 *
 * **Example** (Summing iterable bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.sumAll([2n, 3n, 4n]), 9n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const sumAll: (collection: Iterable<bigint>) => bigint;
/**
 * Takes an `Iterable` of `bigint`s and returns their product as a single `bigint`. Returns `1n` for an empty iterable.
 *
 * **Example** (Multiplying iterable bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigInt.multiplyAll([2n, 3n, 4n]), 24n)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const multiplyAll: (collection: Iterable<bigint>) => bigint;
/**
 * Converts a `bigint` to a `number`.
 *
 * **Details**
 *
 * If the `bigint` is outside the safe integer range for JavaScript (`Number.MAX_SAFE_INTEGER`
 * and `Number.MIN_SAFE_INTEGER`), it returns `Option.none()`.
 *
 * **Example** (Converting bigints to numbers)
 *
 * ```ts
 * import { BigInt as BI } from "effect"
 *
 * BI.toNumber(42n) // Option.some(42)
 * BI.toNumber(BigInt(Number.MAX_SAFE_INTEGER) + 1n) // Option.none()
 * BI.toNumber(BigInt(Number.MIN_SAFE_INTEGER) - 1n) // Option.none()
 * ```
 *
 * @category converting
 * @since 2.0.0
 */
export declare const toNumber: (b: bigint) => Option.Option<number>;
/**
 * Converts a string to a `bigint`.
 *
 * **Details**
 *
 * If the string is empty or contains characters that cannot be converted into a
 * `bigint`, it returns `Option.none()`.
 *
 * **Example** (Parsing strings as bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 *
 * BigInt.fromString("42") // Option.some(42n)
 * BigInt.fromString(" ") // Option.none()
 * BigInt.fromString("a") // Option.none()
 * ```
 *
 * @category converting
 * @since 2.4.12
 */
export declare const fromString: (s: string) => Option.Option<bigint>;
/**
 * Converts a number to a `bigint`.
 *
 * **Details**
 *
 * If the number is outside the safe integer range for JavaScript
 * (`Number.MAX_SAFE_INTEGER` and `Number.MIN_SAFE_INTEGER`) or if the number is
 * not a valid `bigint`, it returns `Option.none()`.
 *
 * **Example** (Converting numbers to bigints)
 *
 * ```ts
 * import { BigInt } from "effect"
 *
 * BigInt.fromNumber(42) // Option.some(42n)
 *
 * BigInt.fromNumber(Number.MAX_SAFE_INTEGER + 1) // Option.none()
 * BigInt.fromNumber(Number.MIN_SAFE_INTEGER - 1) // Option.none()
 * ```
 *
 * @category converting
 * @since 2.4.12
 */
export declare function fromNumber(n: number): Option.Option<bigint>;
/**
 * Returns the JavaScript remainder of dividing one `bigint` by another.
 *
 * **Details**
 *
 * The result follows JavaScript `%` semantics, including the sign of the
 * dividend.
 *
 * **Gotchas**
 *
 * Throws a `RangeError` when the divisor is `0n`.
 *
 * **Example** (Calculating remainders)
 *
 * ```ts
 * import { BigInt } from "effect"
 *
 * BigInt.remainder(10n, 3n) // 1n
 *
 * BigInt.remainder(15n, 4n) // 3n
 * ```
 *
 * @category math
 * @since 4.0.0
 */
export declare const remainder: {
    /**
     * Returns the JavaScript remainder of dividing one `bigint` by another.
     *
     * **Details**
     *
     * The result follows JavaScript `%` semantics, including the sign of the
     * dividend.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` when the divisor is `0n`.
     *
     * **Example** (Calculating remainders)
     *
     * ```ts
     * import { BigInt } from "effect"
     *
     * BigInt.remainder(10n, 3n) // 1n
     *
     * BigInt.remainder(15n, 4n) // 3n
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (divisor: bigint): (self: bigint) => bigint;
    /**
     * Returns the JavaScript remainder of dividing one `bigint` by another.
     *
     * **Details**
     *
     * The result follows JavaScript `%` semantics, including the sign of the
     * dividend.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` when the divisor is `0n`.
     *
     * **Example** (Calculating remainders)
     *
     * ```ts
     * import { BigInt } from "effect"
     *
     * BigInt.remainder(10n, 3n) // 1n
     *
     * BigInt.remainder(15n, 4n) // 3n
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (self: bigint, divisor: bigint): bigint;
};
/**
 * A `Reducer` for combining `bigint`s using addition.
 *
 * @category math
 * @since 4.0.0
 */
export declare const ReducerSum: Reducer.Reducer<bigint>;
/**
 * A `Reducer` for combining `bigint`s using multiplication.
 *
 * @category math
 * @since 4.0.0
 */
export declare const ReducerMultiply: Reducer.Reducer<bigint>;
/**
 * A `Combiner` that returns the maximum `bigint`.
 *
 * @category math
 * @since 4.0.0
 */
export declare const CombinerMax: Combiner.Combiner<bigint>;
/**
 * A `Combiner` that returns the minimum `bigint`.
 *
 * @category math
 * @since 4.0.0
 */
export declare const CombinerMin: Combiner.Combiner<bigint>;
//# sourceMappingURL=BigInt.d.ts.map