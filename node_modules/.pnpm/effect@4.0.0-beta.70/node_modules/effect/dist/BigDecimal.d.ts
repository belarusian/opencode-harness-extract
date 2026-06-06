/**
 * This module provides utility functions and type class instances for working with the `BigDecimal` type in TypeScript.
 * It includes functions for basic arithmetic operations.
 *
 * A `BigDecimal` allows storing any real number to arbitrary precision; which avoids common floating point errors
 * (such as 0.1 + 0.2 ≠ 0.3) at the cost of complexity.
 *
 * Internally, `BigDecimal` uses a `BigInt` object, paired with a 64-bit integer which determines the position of the
 * decimal point. Therefore, the precision *is not* actually arbitrary, but limited to 2<sup>63</sup> decimal places.
 *
 * It is not recommended to convert a floating point number to a decimal directly, as the floating point representation
 * may be unexpected.
 *
 * @since 2.0.0
 */
import * as Equal from "./Equal.ts";
import * as Equ from "./Equivalence.ts";
import { type Inspectable } from "./Inspectable.ts";
import * as Option from "./Option.ts";
import * as order from "./Order.ts";
import type { Ordering } from "./Ordering.ts";
import { type Pipeable } from "./Pipeable.ts";
declare const TypeId = "~effect/BigDecimal";
/**
 * Represents an arbitrary precision decimal number.
 *
 * **Example** (Inspecting BigDecimal storage)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * const d = BigDecimal.fromStringUnsafe("123.45")
 *
 * console.log(d.value) // 12345n
 * console.log(d.scale) // 2
 * ```
 *
 * @category models
 * @since 2.0.0
 */
export interface BigDecimal extends Equal.Equal, Pipeable, Inspectable {
    readonly [TypeId]: typeof TypeId;
    readonly value: bigint;
    readonly scale: number;
}
/**
 * Checks if a given value is a `BigDecimal`.
 *
 * **Example** (Checking BigDecimal values)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * const decimal = BigDecimal.fromNumber(123.45)
 * console.log(BigDecimal.isBigDecimal(decimal)) // true
 * console.log(BigDecimal.isBigDecimal(123.45)) // false
 * console.log(BigDecimal.isBigDecimal("123.45")) // false
 * ```
 *
 * @category guards
 * @since 2.0.0
 */
export declare const isBigDecimal: (u: unknown) => u is BigDecimal;
/**
 * Creates a `BigDecimal` from a `bigint` value and a scale.
 *
 * **Example** (Creating decimals from bigint and scale)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * // Create 123.45 (12345 with scale 2)
 * const decimal = BigDecimal.make(12345n, 2)
 * console.log(BigDecimal.format(decimal)) // "123.45"
 *
 * // Create 42 (42 with scale 0)
 * const integer = BigDecimal.make(42n, 0)
 * console.log(BigDecimal.format(integer)) // "42"
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const make: (value: bigint, scale: number) => BigDecimal;
/**
 * Normalizes a given `BigDecimal` by removing trailing zeros.
 *
 * **Example** (Normalizing trailing zeros)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.normalize(BigDecimal.fromStringUnsafe("123.00000")),
 *   BigDecimal.normalize(BigDecimal.make(123n, 0))
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.normalize(BigDecimal.fromStringUnsafe("12300000")),
 *   BigDecimal.normalize(BigDecimal.make(123n, -5))
 * )
 * ```
 *
 * @category scaling
 * @since 2.0.0
 */
export declare const normalize: (self: BigDecimal) => BigDecimal;
/**
 * Scales a `BigDecimal` to the specified scale.
 *
 * **Details**
 *
 * Increasing the scale appends decimal zeros. Decreasing the scale discards
 * digits beyond the target scale by `bigint` division, which truncates toward
 * zero.
 *
 * **Example** (Scaling decimal precision)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * const decimal = BigDecimal.fromNumberUnsafe(123.45)
 *
 * // Increase scale (add more precision)
 * const scaled = BigDecimal.scale(decimal, 4)
 * console.log(BigDecimal.format(scaled)) // "123.4500"
 *
 * // Decrease scale (reduce precision, rounds down)
 * const reduced = BigDecimal.scale(decimal, 1)
 * console.log(BigDecimal.format(reduced)) // "123.4"
 * ```
 *
 * @category scaling
 * @since 2.0.0
 */
export declare const scale: {
    /**
     * Scales a `BigDecimal` to the specified scale.
     *
     * **Details**
     *
     * Increasing the scale appends decimal zeros. Decreasing the scale discards
     * digits beyond the target scale by `bigint` division, which truncates toward
     * zero.
     *
     * **Example** (Scaling decimal precision)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * const decimal = BigDecimal.fromNumberUnsafe(123.45)
     *
     * // Increase scale (add more precision)
     * const scaled = BigDecimal.scale(decimal, 4)
     * console.log(BigDecimal.format(scaled)) // "123.4500"
     *
     * // Decrease scale (reduce precision, rounds down)
     * const reduced = BigDecimal.scale(decimal, 1)
     * console.log(BigDecimal.format(reduced)) // "123.4"
     * ```
     *
     * @category scaling
     * @since 2.0.0
     */
    (scale: number): (self: BigDecimal) => BigDecimal;
    /**
     * Scales a `BigDecimal` to the specified scale.
     *
     * **Details**
     *
     * Increasing the scale appends decimal zeros. Decreasing the scale discards
     * digits beyond the target scale by `bigint` division, which truncates toward
     * zero.
     *
     * **Example** (Scaling decimal precision)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * const decimal = BigDecimal.fromNumberUnsafe(123.45)
     *
     * // Increase scale (add more precision)
     * const scaled = BigDecimal.scale(decimal, 4)
     * console.log(BigDecimal.format(scaled)) // "123.4500"
     *
     * // Decrease scale (reduce precision, rounds down)
     * const reduced = BigDecimal.scale(decimal, 1)
     * console.log(BigDecimal.format(reduced)) // "123.4"
     * ```
     *
     * @category scaling
     * @since 2.0.0
     */
    (self: BigDecimal, scale: number): BigDecimal;
};
/**
 * Provides an addition operation on `BigDecimal`s.
 *
 * **Example** (Adding decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.sum(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   BigDecimal.fromStringUnsafe("5")
 * )
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const sum: {
    /**
     * Provides an addition operation on `BigDecimal`s.
     *
     * **Example** (Adding decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.sum(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("5")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => BigDecimal;
    /**
     * Provides an addition operation on `BigDecimal`s.
     *
     * **Example** (Adding decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.sum(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("5")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, that: BigDecimal): BigDecimal;
};
/**
 * Takes an `Iterable` of `BigDecimal`s and returns their sum as a single `BigDecimal`.
 *
 * **Example** (Adding multiple decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.sumAll([BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("4")]),
 *   BigDecimal.fromStringUnsafe("9")
 * )
 * ```
 *
 * @category math
 * @since 3.16.0
 */
export declare const sumAll: (collection: Iterable<BigDecimal>) => BigDecimal;
/**
 * Provides a multiplication operation on `BigDecimal`s.
 *
 * **Example** (Multiplying decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.multiply(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   BigDecimal.fromStringUnsafe("6")
 * )
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const multiply: {
    /**
     * Provides a multiplication operation on `BigDecimal`s.
     *
     * **Example** (Multiplying decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.multiply(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("6")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => BigDecimal;
    /**
     * Provides a multiplication operation on `BigDecimal`s.
     *
     * **Example** (Multiplying decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.multiply(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("6")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, that: BigDecimal): BigDecimal;
};
/**
 * Takes an `Iterable` of `BigDecimal`s and returns their multiplication as a single `BigDecimal`.
 *
 * **Example** (Multiplying multiple decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.multiplyAll([BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("4")]),
 *   BigDecimal.fromStringUnsafe("24")
 * )
 * ```
 *
 * @category math
 * @since 4.0.0
 */
export declare const multiplyAll: (collection: Iterable<BigDecimal>) => BigDecimal;
/**
 * Provides a subtraction operation on `BigDecimal`s.
 *
 * **Example** (Subtracting decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.subtract(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   BigDecimal.fromStringUnsafe("-1")
 * )
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const subtract: {
    /**
     * Provides a subtraction operation on `BigDecimal`s.
     *
     * **Example** (Subtracting decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.subtract(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("-1")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => BigDecimal;
    /**
     * Provides a subtraction operation on `BigDecimal`s.
     *
     * **Example** (Subtracting decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.subtract(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("-1")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, that: BigDecimal): BigDecimal;
};
/**
 * Provides a division operation on `BigDecimal`s.
 *
 * **Details**
 *
 * If the dividend is not a multiple of the divisor, the result will be a `BigDecimal` value
 * with up to the default division precision. If the divisor is `0`, the result
 * will be `Option.none()`.
 *
 * **Example** (Dividing decimals safely)
 *
 * ```ts
 * import { BigDecimal, Option } from "effect"
 *
 * console.log(
 *   Option.getOrThrow(
 *     BigDecimal.divide(
 *       BigDecimal.fromStringUnsafe("6"),
 *       BigDecimal.fromStringUnsafe("3")
 *     )
 *   )
 * ) // BigDecimal(2)
 * console.log(
 *   Option.getOrThrow(
 *     BigDecimal.divide(
 *       BigDecimal.fromStringUnsafe("6"),
 *       BigDecimal.fromStringUnsafe("4")
 *     )
 *   )
 * ) // BigDecimal(1.5)
 * console.log(
 *   Option.isNone(
 *     BigDecimal.divide(
 *       BigDecimal.fromStringUnsafe("6"),
 *       BigDecimal.fromStringUnsafe("0")
 *     )
 *   )
 * ) // true
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const divide: {
    /**
     * Provides a division operation on `BigDecimal`s.
     *
     * **Details**
     *
     * If the dividend is not a multiple of the divisor, the result will be a `BigDecimal` value
     * with up to the default division precision. If the divisor is `0`, the result
     * will be `Option.none()`.
     *
     * **Example** (Dividing decimals safely)
     *
     * ```ts
     * import { BigDecimal, Option } from "effect"
     *
     * console.log(
     *   Option.getOrThrow(
     *     BigDecimal.divide(
     *       BigDecimal.fromStringUnsafe("6"),
     *       BigDecimal.fromStringUnsafe("3")
     *     )
     *   )
     * ) // BigDecimal(2)
     * console.log(
     *   Option.getOrThrow(
     *     BigDecimal.divide(
     *       BigDecimal.fromStringUnsafe("6"),
     *       BigDecimal.fromStringUnsafe("4")
     *     )
     *   )
     * ) // BigDecimal(1.5)
     * console.log(
     *   Option.isNone(
     *     BigDecimal.divide(
     *       BigDecimal.fromStringUnsafe("6"),
     *       BigDecimal.fromStringUnsafe("0")
     *     )
     *   )
     * ) // true
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => Option.Option<BigDecimal>;
    /**
     * Provides a division operation on `BigDecimal`s.
     *
     * **Details**
     *
     * If the dividend is not a multiple of the divisor, the result will be a `BigDecimal` value
     * with up to the default division precision. If the divisor is `0`, the result
     * will be `Option.none()`.
     *
     * **Example** (Dividing decimals safely)
     *
     * ```ts
     * import { BigDecimal, Option } from "effect"
     *
     * console.log(
     *   Option.getOrThrow(
     *     BigDecimal.divide(
     *       BigDecimal.fromStringUnsafe("6"),
     *       BigDecimal.fromStringUnsafe("3")
     *     )
     *   )
     * ) // BigDecimal(2)
     * console.log(
     *   Option.getOrThrow(
     *     BigDecimal.divide(
     *       BigDecimal.fromStringUnsafe("6"),
     *       BigDecimal.fromStringUnsafe("4")
     *     )
     *   )
     * ) // BigDecimal(1.5)
     * console.log(
     *   Option.isNone(
     *     BigDecimal.divide(
     *       BigDecimal.fromStringUnsafe("6"),
     *       BigDecimal.fromStringUnsafe("0")
     *     )
     *   )
     * ) // true
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, that: BigDecimal): Option.Option<BigDecimal>;
};
/**
 * Provides an unsafe division operation on `BigDecimal`s.
 *
 * **Details**
 *
 * If the dividend is not a multiple of the divisor, the result will be a `BigDecimal` value
 * with up to the default division precision.
 *
 * **Gotchas**
 *
 * Throws a `RangeError` if the divisor is `0`.
 *
 * **Example** (Dividing decimals unsafely)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * console.log(BigDecimal.divideUnsafe(BigDecimal.fromStringUnsafe("6"), BigDecimal.fromStringUnsafe("3"))) // BigDecimal(2)
 * console.log(BigDecimal.divideUnsafe(BigDecimal.fromStringUnsafe("6"), BigDecimal.fromStringUnsafe("4"))) // BigDecimal(1.5)
 * ```
 *
 * @category math
 * @since 4.0.0
 */
export declare const divideUnsafe: {
    /**
     * Provides an unsafe division operation on `BigDecimal`s.
     *
     * **Details**
     *
     * If the dividend is not a multiple of the divisor, the result will be a `BigDecimal` value
     * with up to the default division precision.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` if the divisor is `0`.
     *
     * **Example** (Dividing decimals unsafely)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * console.log(BigDecimal.divideUnsafe(BigDecimal.fromStringUnsafe("6"), BigDecimal.fromStringUnsafe("3"))) // BigDecimal(2)
     * console.log(BigDecimal.divideUnsafe(BigDecimal.fromStringUnsafe("6"), BigDecimal.fromStringUnsafe("4"))) // BigDecimal(1.5)
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => BigDecimal;
    /**
     * Provides an unsafe division operation on `BigDecimal`s.
     *
     * **Details**
     *
     * If the dividend is not a multiple of the divisor, the result will be a `BigDecimal` value
     * with up to the default division precision.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` if the divisor is `0`.
     *
     * **Example** (Dividing decimals unsafely)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * console.log(BigDecimal.divideUnsafe(BigDecimal.fromStringUnsafe("6"), BigDecimal.fromStringUnsafe("3"))) // BigDecimal(2)
     * console.log(BigDecimal.divideUnsafe(BigDecimal.fromStringUnsafe("6"), BigDecimal.fromStringUnsafe("4"))) // BigDecimal(1.5)
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (self: BigDecimal, that: BigDecimal): BigDecimal;
};
/**
 * Provides an `Order` instance for `BigDecimal` that allows comparing and sorting BigDecimal values.
 *
 * **Example** (Comparing decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * const a = BigDecimal.fromNumberUnsafe(1.5)
 * const b = BigDecimal.fromNumberUnsafe(2.3)
 * const c = BigDecimal.fromNumberUnsafe(1.5)
 *
 * console.log(BigDecimal.Order(a, b)) // -1 (a < b)
 * console.log(BigDecimal.Order(b, a)) // 1 (b > a)
 * console.log(BigDecimal.Order(a, c)) // 0 (a === c)
 * ```
 *
 * @category instances
 * @since 2.0.0
 */
export declare const Order: order.Order<BigDecimal>;
/**
 * Returns `true` if the first argument is less than the second, otherwise `false`.
 *
 * **Example** (Checking less-than comparisons)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   true
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
 *   false
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
 *   false
 * )
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
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => boolean;
    /**
     * Returns `true` if the first argument is less than the second, otherwise `false`.
     *
     * **Example** (Checking less-than comparisons)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThan(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: BigDecimal, that: BigDecimal): boolean;
};
/**
 * Checks if a given `BigDecimal` is less than or equal to the provided one.
 *
 * **Example** (Checking less-than-or-equal comparisons)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   true
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
 *   true
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
 *   false
 * )
 * ```
 *
 * @category predicates
 * @since 4.0.0
 */
export declare const isLessThanOrEqualTo: {
    /**
     * Checks if a given `BigDecimal` is less than or equal to the provided one.
     *
     * **Example** (Checking less-than-or-equal comparisons)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => boolean;
    /**
     * Checks if a given `BigDecimal` is less than or equal to the provided one.
     *
     * **Example** (Checking less-than-or-equal comparisons)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isLessThanOrEqualTo(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: BigDecimal, that: BigDecimal): boolean;
};
/**
 * Returns `true` if the first argument is greater than the second, otherwise `false`.
 *
 * **Example** (Checking greater-than comparisons)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   false
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
 *   false
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
 *   true
 * )
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
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => boolean;
    /**
     * Returns `true` if the first argument is greater than the second, otherwise `false`.
     *
     * **Example** (Checking greater-than comparisons)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThan(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: BigDecimal, that: BigDecimal): boolean;
};
/**
 * Checks if a given `BigDecimal` is greater than or equal to the provided one.
 *
 * **Example** (Checking greater-than-or-equal comparisons)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   false
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
 *   true
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
 *   true
 * )
 * ```
 *
 * @category predicates
 * @since 4.0.0
 */
export declare const isGreaterThanOrEqualTo: {
    /**
     * Checks if a given `BigDecimal` is greater than or equal to the provided one.
     *
     * **Example** (Checking greater-than-or-equal comparisons)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => boolean;
    /**
     * Checks if a given `BigDecimal` is greater than or equal to the provided one.
     *
     * **Example** (Checking greater-than-or-equal comparisons)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   false
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.isGreaterThanOrEqualTo(BigDecimal.fromStringUnsafe("4"), BigDecimal.fromStringUnsafe("3")),
     *   true
     * )
     * ```
     *
     * @category predicates
     * @since 4.0.0
     */
    (self: BigDecimal, that: BigDecimal): boolean;
};
/**
 * Checks if a `BigDecimal` is between a `minimum` and `maximum` value (inclusive).
 *
 * **Example** (Checking decimal ranges)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * const between = BigDecimal.between({
 *   minimum: BigDecimal.fromStringUnsafe("1"),
 *   maximum: BigDecimal.fromStringUnsafe("5")
 * })
 *
 * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("3")), true)
 * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("0")), false)
 * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("6")), false)
 * ```
 *
 * @category predicates
 * @since 2.0.0
 */
export declare const between: {
    /**
     * Checks if a `BigDecimal` is between a `minimum` and `maximum` value (inclusive).
     *
     * **Example** (Checking decimal ranges)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * const between = BigDecimal.between({
     *   minimum: BigDecimal.fromStringUnsafe("1"),
     *   maximum: BigDecimal.fromStringUnsafe("5")
     * })
     *
     * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("3")), true)
     * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("0")), false)
     * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("6")), false)
     * ```
     *
     * @category predicates
     * @since 2.0.0
     */
    (options: {
        minimum: BigDecimal;
        maximum: BigDecimal;
    }): (self: BigDecimal) => boolean;
    /**
     * Checks if a `BigDecimal` is between a `minimum` and `maximum` value (inclusive).
     *
     * **Example** (Checking decimal ranges)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * const between = BigDecimal.between({
     *   minimum: BigDecimal.fromStringUnsafe("1"),
     *   maximum: BigDecimal.fromStringUnsafe("5")
     * })
     *
     * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("3")), true)
     * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("0")), false)
     * assert.deepStrictEqual(between(BigDecimal.fromStringUnsafe("6")), false)
     * ```
     *
     * @category predicates
     * @since 2.0.0
     */
    (self: BigDecimal, options: {
        minimum: BigDecimal;
        maximum: BigDecimal;
    }): boolean;
};
/**
 * Restricts the given `BigDecimal` to be within the range specified by the `minimum` and `maximum` values.
 *
 * **Details**
 *
 * If the `BigDecimal` is less than the `minimum` value, the function returns
 * the `minimum` value. If it is greater than the `maximum` value, the function
 * returns the `maximum` value. Otherwise, it returns the original `BigDecimal`.
 *
 * **Example** (Clamping decimals to a range)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * const clamp = BigDecimal.clamp({
 *   minimum: BigDecimal.fromStringUnsafe("1"),
 *   maximum: BigDecimal.fromStringUnsafe("5")
 * })
 *
 * assert.deepStrictEqual(
 *   clamp(BigDecimal.fromStringUnsafe("3")),
 *   BigDecimal.fromStringUnsafe("3")
 * )
 * assert.deepStrictEqual(
 *   clamp(BigDecimal.fromStringUnsafe("0")),
 *   BigDecimal.fromStringUnsafe("1")
 * )
 * assert.deepStrictEqual(
 *   clamp(BigDecimal.fromStringUnsafe("6")),
 *   BigDecimal.fromStringUnsafe("5")
 * )
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const clamp: {
    /**
     * Restricts the given `BigDecimal` to be within the range specified by the `minimum` and `maximum` values.
     *
     * **Details**
     *
     * If the `BigDecimal` is less than the `minimum` value, the function returns
     * the `minimum` value. If it is greater than the `maximum` value, the function
     * returns the `maximum` value. Otherwise, it returns the original `BigDecimal`.
     *
     * **Example** (Clamping decimals to a range)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * const clamp = BigDecimal.clamp({
     *   minimum: BigDecimal.fromStringUnsafe("1"),
     *   maximum: BigDecimal.fromStringUnsafe("5")
     * })
     *
     * assert.deepStrictEqual(
     *   clamp(BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("3")
     * )
     * assert.deepStrictEqual(
     *   clamp(BigDecimal.fromStringUnsafe("0")),
     *   BigDecimal.fromStringUnsafe("1")
     * )
     * assert.deepStrictEqual(
     *   clamp(BigDecimal.fromStringUnsafe("6")),
     *   BigDecimal.fromStringUnsafe("5")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (options: {
        minimum: BigDecimal;
        maximum: BigDecimal;
    }): (self: BigDecimal) => BigDecimal;
    /**
     * Restricts the given `BigDecimal` to be within the range specified by the `minimum` and `maximum` values.
     *
     * **Details**
     *
     * If the `BigDecimal` is less than the `minimum` value, the function returns
     * the `minimum` value. If it is greater than the `maximum` value, the function
     * returns the `maximum` value. Otherwise, it returns the original `BigDecimal`.
     *
     * **Example** (Clamping decimals to a range)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * const clamp = BigDecimal.clamp({
     *   minimum: BigDecimal.fromStringUnsafe("1"),
     *   maximum: BigDecimal.fromStringUnsafe("5")
     * })
     *
     * assert.deepStrictEqual(
     *   clamp(BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("3")
     * )
     * assert.deepStrictEqual(
     *   clamp(BigDecimal.fromStringUnsafe("0")),
     *   BigDecimal.fromStringUnsafe("1")
     * )
     * assert.deepStrictEqual(
     *   clamp(BigDecimal.fromStringUnsafe("6")),
     *   BigDecimal.fromStringUnsafe("5")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, options: {
        minimum: BigDecimal;
        maximum: BigDecimal;
    }): BigDecimal;
};
/**
 * Returns the minimum between two `BigDecimal`s.
 *
 * **Example** (Selecting the smaller decimal)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.min(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   BigDecimal.fromStringUnsafe("2")
 * )
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const min: {
    /**
     * Returns the minimum between two `BigDecimal`s.
     *
     * **Example** (Selecting the smaller decimal)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.min(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("2")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => BigDecimal;
    /**
     * Returns the minimum between two `BigDecimal`s.
     *
     * **Example** (Selecting the smaller decimal)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.min(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("2")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, that: BigDecimal): BigDecimal;
};
/**
 * Returns the maximum between two `BigDecimal`s.
 *
 * **Example** (Selecting the larger decimal)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.max(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
 *   BigDecimal.fromStringUnsafe("3")
 * )
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const max: {
    /**
     * Returns the maximum between two `BigDecimal`s.
     *
     * **Example** (Selecting the larger decimal)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.max(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("3")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => BigDecimal;
    /**
     * Returns the maximum between two `BigDecimal`s.
     *
     * **Example** (Selecting the larger decimal)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.max(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("3")),
     *   BigDecimal.fromStringUnsafe("3")
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, that: BigDecimal): BigDecimal;
};
/**
 * Determines the sign of a given `BigDecimal`.
 *
 * **Example** (Reading decimal signs)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.sign(BigDecimal.fromStringUnsafe("-5")), -1)
 * assert.deepStrictEqual(BigDecimal.sign(BigDecimal.fromStringUnsafe("0")), 0)
 * assert.deepStrictEqual(BigDecimal.sign(BigDecimal.fromStringUnsafe("5")), 1)
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const sign: (n: BigDecimal) => Ordering;
/**
 * Determines the absolute value of a given `BigDecimal`.
 *
 * **Example** (Calculating absolute values)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.abs(BigDecimal.fromStringUnsafe("-5")), BigDecimal.fromStringUnsafe("5"))
 * assert.deepStrictEqual(BigDecimal.abs(BigDecimal.fromStringUnsafe("0")), BigDecimal.fromStringUnsafe("0"))
 * assert.deepStrictEqual(BigDecimal.abs(BigDecimal.fromStringUnsafe("5")), BigDecimal.fromStringUnsafe("5"))
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const abs: (n: BigDecimal) => BigDecimal;
/**
 * Provides a negate operation on `BigDecimal`s.
 *
 * **Example** (Negating decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.negate(BigDecimal.fromStringUnsafe("3")), BigDecimal.fromStringUnsafe("-3"))
 * assert.deepStrictEqual(BigDecimal.negate(BigDecimal.fromStringUnsafe("-6")), BigDecimal.fromStringUnsafe("6"))
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const negate: (n: BigDecimal) => BigDecimal;
/**
 * Returns the remainder left over when one operand is divided by a second operand.
 *
 * **Details**
 *
 * If the divisor is `0`, the result will be `Option.none()`.
 *
 * **Example** (Computing remainders safely)
 *
 * ```ts
 * import { BigDecimal, Option } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.remainder(
 *     BigDecimal.fromStringUnsafe("2"),
 *     BigDecimal.fromStringUnsafe("2")
 *   ),
 *   Option.some(BigDecimal.fromStringUnsafe("0"))
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.remainder(
 *     BigDecimal.fromStringUnsafe("3"),
 *     BigDecimal.fromStringUnsafe("2")
 *   ),
 *   Option.some(BigDecimal.fromStringUnsafe("1"))
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.remainder(
 *     BigDecimal.fromStringUnsafe("-4"),
 *     BigDecimal.fromStringUnsafe("2")
 *   ),
 *   Option.some(BigDecimal.fromStringUnsafe("0"))
 * )
 * ```
 *
 * @category math
 * @since 2.0.0
 */
export declare const remainder: {
    /**
     * Returns the remainder left over when one operand is divided by a second operand.
     *
     * **Details**
     *
     * If the divisor is `0`, the result will be `Option.none()`.
     *
     * **Example** (Computing remainders safely)
     *
     * ```ts
     * import { BigDecimal, Option } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.remainder(
     *     BigDecimal.fromStringUnsafe("2"),
     *     BigDecimal.fromStringUnsafe("2")
     *   ),
     *   Option.some(BigDecimal.fromStringUnsafe("0"))
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainder(
     *     BigDecimal.fromStringUnsafe("3"),
     *     BigDecimal.fromStringUnsafe("2")
     *   ),
     *   Option.some(BigDecimal.fromStringUnsafe("1"))
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainder(
     *     BigDecimal.fromStringUnsafe("-4"),
     *     BigDecimal.fromStringUnsafe("2")
     *   ),
     *   Option.some(BigDecimal.fromStringUnsafe("0"))
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (divisor: BigDecimal): (self: BigDecimal) => Option.Option<BigDecimal>;
    /**
     * Returns the remainder left over when one operand is divided by a second operand.
     *
     * **Details**
     *
     * If the divisor is `0`, the result will be `Option.none()`.
     *
     * **Example** (Computing remainders safely)
     *
     * ```ts
     * import { BigDecimal, Option } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.remainder(
     *     BigDecimal.fromStringUnsafe("2"),
     *     BigDecimal.fromStringUnsafe("2")
     *   ),
     *   Option.some(BigDecimal.fromStringUnsafe("0"))
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainder(
     *     BigDecimal.fromStringUnsafe("3"),
     *     BigDecimal.fromStringUnsafe("2")
     *   ),
     *   Option.some(BigDecimal.fromStringUnsafe("1"))
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainder(
     *     BigDecimal.fromStringUnsafe("-4"),
     *     BigDecimal.fromStringUnsafe("2")
     *   ),
     *   Option.some(BigDecimal.fromStringUnsafe("0"))
     * )
     * ```
     *
     * @category math
     * @since 2.0.0
     */
    (self: BigDecimal, divisor: BigDecimal): Option.Option<BigDecimal>;
};
/**
 * Returns the remainder left over when one operand is divided by a second operand.
 *
 * **Gotchas**
 *
 * Throws a `RangeError` if the divisor is `0`.
 *
 * **Example** (Computing remainders unsafely)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("2")),
 *   BigDecimal.fromStringUnsafe("0")
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("2")),
 *   BigDecimal.fromStringUnsafe("1")
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("-4"), BigDecimal.fromStringUnsafe("2")),
 *   BigDecimal.fromStringUnsafe("0")
 * )
 * ```
 *
 * @category math
 * @since 4.0.0
 */
export declare const remainderUnsafe: {
    /**
     * Returns the remainder left over when one operand is divided by a second operand.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` if the divisor is `0`.
     *
     * **Example** (Computing remainders unsafely)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("2")),
     *   BigDecimal.fromStringUnsafe("0")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("2")),
     *   BigDecimal.fromStringUnsafe("1")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("-4"), BigDecimal.fromStringUnsafe("2")),
     *   BigDecimal.fromStringUnsafe("0")
     * )
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (divisor: BigDecimal): (self: BigDecimal) => BigDecimal;
    /**
     * Returns the remainder left over when one operand is divided by a second operand.
     *
     * **Gotchas**
     *
     * Throws a `RangeError` if the divisor is `0`.
     *
     * **Example** (Computing remainders unsafely)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("2"), BigDecimal.fromStringUnsafe("2")),
     *   BigDecimal.fromStringUnsafe("0")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("3"), BigDecimal.fromStringUnsafe("2")),
     *   BigDecimal.fromStringUnsafe("1")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.remainderUnsafe(BigDecimal.fromStringUnsafe("-4"), BigDecimal.fromStringUnsafe("2")),
     *   BigDecimal.fromStringUnsafe("0")
     * )
     * ```
     *
     * @category math
     * @since 4.0.0
     */
    (self: BigDecimal, divisor: BigDecimal): BigDecimal;
};
/**
 * Provides an `Equivalence` instance for `BigDecimal` that determines equality between BigDecimal values.
 *
 * **Example** (Checking decimal equivalence)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * const a = BigDecimal.fromStringUnsafe("1.50")
 * const b = BigDecimal.fromStringUnsafe("1.5")
 * const c = BigDecimal.fromStringUnsafe("2.0")
 *
 * console.log(BigDecimal.Equivalence(a, b)) // true (1.50 === 1.5)
 * console.log(BigDecimal.Equivalence(a, c)) // false (1.50 !== 2.0)
 * ```
 *
 * @category instances
 * @since 2.0.0
 */
export declare const Equivalence: Equ.Equivalence<BigDecimal>;
/**
 * Checks if two `BigDecimal`s are equal.
 *
 * **Example** (Checking decimal equality)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * const a = BigDecimal.fromStringUnsafe("1.5")
 * const b = BigDecimal.fromStringUnsafe("1.50")
 * const c = BigDecimal.fromStringUnsafe("2.0")
 *
 * console.log(BigDecimal.equals(a, b)) // true
 * console.log(BigDecimal.equals(a, c)) // false
 * ```
 *
 * @category predicates
 * @since 2.0.0
 */
export declare const equals: {
    /**
     * Checks if two `BigDecimal`s are equal.
     *
     * **Example** (Checking decimal equality)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * const a = BigDecimal.fromStringUnsafe("1.5")
     * const b = BigDecimal.fromStringUnsafe("1.50")
     * const c = BigDecimal.fromStringUnsafe("2.0")
     *
     * console.log(BigDecimal.equals(a, b)) // true
     * console.log(BigDecimal.equals(a, c)) // false
     * ```
     *
     * @category predicates
     * @since 2.0.0
     */
    (that: BigDecimal): (self: BigDecimal) => boolean;
    /**
     * Checks if two `BigDecimal`s are equal.
     *
     * **Example** (Checking decimal equality)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * const a = BigDecimal.fromStringUnsafe("1.5")
     * const b = BigDecimal.fromStringUnsafe("1.50")
     * const c = BigDecimal.fromStringUnsafe("2.0")
     *
     * console.log(BigDecimal.equals(a, b)) // true
     * console.log(BigDecimal.equals(a, c)) // false
     * ```
     *
     * @category predicates
     * @since 2.0.0
     */
    (self: BigDecimal, that: BigDecimal): boolean;
};
/**
 * Creates a `BigDecimal` from a `bigint` value.
 *
 * **Example** (Creating decimals from bigint)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * const decimal = BigDecimal.fromBigInt(123n)
 * console.log(BigDecimal.format(decimal)) // "123"
 *
 * const largeBigInt = BigDecimal.fromBigInt(9007199254740991n)
 * console.log(BigDecimal.format(largeBigInt)) // "9007199254740991"
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const fromBigInt: (n: bigint) => BigDecimal;
/**
 * Creates a `BigDecimal` from a `number` value.
 *
 * **Gotchas**
 *
 * It is not recommended to convert a floating point number to a decimal
 * directly, as the floating point representation may be unexpected. Throws a
 * `RangeError` if the number is not finite (`NaN`, `+Infinity` or `-Infinity`).
 *
 * **Example** (Creating decimals from finite numbers)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.fromNumberUnsafe(123), BigDecimal.make(123n, 0))
 * assert.deepStrictEqual(BigDecimal.fromNumberUnsafe(123.456), BigDecimal.make(123456n, 3))
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const fromNumberUnsafe: (n: number) => BigDecimal;
/**
 * Creates a `BigDecimal` from a `number` value.
 *
 * **Details**
 *
 * Returns `Option.none()` for `NaN`, `+Infinity` or `-Infinity`.
 *
 * **Gotchas**
 *
 * It is not recommended to convert a floating point number to a decimal
 * directly, as the floating point representation may be unexpected.
 *
 * **Example** (Creating decimals from numbers safely)
 *
 * ```ts
 * import { BigDecimal, Option } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.fromNumber(123), Option.some(BigDecimal.make(123n, 0)))
 * assert.deepStrictEqual(
 *   BigDecimal.fromNumber(123.456),
 *   Option.some(BigDecimal.make(123456n, 3))
 * )
 * assert.deepStrictEqual(BigDecimal.fromNumber(Infinity), Option.none())
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const fromNumber: (n: number) => Option.Option<BigDecimal>;
/**
 * Safely parses a decimal string into a `BigDecimal`.
 *
 * **Details**
 *
 * Returns `Option.some` for valid decimal or exponent notation and
 * `Option.none` when the string cannot be parsed or would produce an unsafe
 * scale. The empty string parses as zero.
 *
 * **Example** (Parsing decimal strings safely)
 *
 * ```ts
 * import { BigDecimal, Option } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.fromString("123"), Option.some(BigDecimal.make(123n, 0)))
 * assert.deepStrictEqual(
 *   BigDecimal.fromString("123.456"),
 *   Option.some(BigDecimal.make(123456n, 3))
 * )
 * assert.deepStrictEqual(BigDecimal.fromString("123.abc"), Option.none())
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export declare const fromString: (s: string) => Option.Option<BigDecimal>;
/**
 * Parses a decimal string into a `BigDecimal`, throwing if the string is
 * invalid.
 *
 * **Details**
 *
 * Accepts the same syntax as `fromString`. Use `fromString` when invalid input
 * should be represented as `Option.none` instead of throwing.
 *
 * **Example** (Parsing decimal strings unsafely)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.fromStringUnsafe("123"), BigDecimal.make(123n, 0))
 * assert.deepStrictEqual(BigDecimal.fromStringUnsafe("123.456"), BigDecimal.make(123456n, 3))
 * assert.throws(() => BigDecimal.fromStringUnsafe("123.abc"))
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const fromStringUnsafe: (s: string) => BigDecimal;
/**
 * Formats a `BigDecimal` as a string.
 *
 * **Details**
 *
 * The value is normalized before formatting. Scientific notation is used when
 * the absolute value of the normalized scale is at least `16`; otherwise plain
 * decimal notation is used.
 *
 * **Example** (Formatting decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.format(BigDecimal.fromStringUnsafe("-5")), "-5")
 * assert.deepStrictEqual(BigDecimal.format(BigDecimal.fromStringUnsafe("123.456")), "123.456")
 * assert.deepStrictEqual(BigDecimal.format(BigDecimal.fromStringUnsafe("-0.00000123")), "-0.00000123")
 * ```
 *
 * @category converting
 * @since 2.0.0
 */
export declare const format: (n: BigDecimal) => string;
/**
 * Formats a given `BigDecimal` as a `string` in scientific notation.
 *
 * **Example** (Formatting decimals exponentially)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.toExponential(BigDecimal.make(123456n, -5)), "1.23456e+10")
 * ```
 *
 * @category converting
 * @since 3.11.0
 */
export declare const toExponential: (n: BigDecimal) => string;
/**
 * Converts a `BigDecimal` to a JavaScript `number`.
 *
 * **Gotchas**
 *
 * This conversion is unsafe because the result can lose integer or fractional
 * precision, round to a nearby representable value, or become `Infinity` when
 * the decimal cannot be represented as a finite JavaScript `number`.
 *
 * **Example** (Converting decimals to numbers)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.toNumberUnsafe(BigDecimal.fromStringUnsafe("123.456")), 123.456)
 * ```
 *
 * @category converting
 * @since 4.0.0
 */
export declare const toNumberUnsafe: (n: BigDecimal) => number;
/**
 * Checks if a given `BigDecimal` is an integer.
 *
 * **Example** (Checking integer decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.isInteger(BigDecimal.fromStringUnsafe("0")), true)
 * assert.deepStrictEqual(BigDecimal.isInteger(BigDecimal.fromStringUnsafe("1")), true)
 * assert.deepStrictEqual(BigDecimal.isInteger(BigDecimal.fromStringUnsafe("1.1")), false)
 * ```
 *
 * @category predicates
 * @since 2.0.0
 */
export declare const isInteger: (n: BigDecimal) => boolean;
/**
 * Checks if a given `BigDecimal` is `0`.
 *
 * **Example** (Checking zero decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.isZero(BigDecimal.fromStringUnsafe("0")), true)
 * assert.deepStrictEqual(BigDecimal.isZero(BigDecimal.fromStringUnsafe("1")), false)
 * ```
 *
 * @category predicates
 * @since 2.0.0
 */
export declare const isZero: (n: BigDecimal) => boolean;
/**
 * Checks if a given `BigDecimal` is negative.
 *
 * **Example** (Checking negative decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.isNegative(BigDecimal.fromStringUnsafe("-1")), true)
 * assert.deepStrictEqual(BigDecimal.isNegative(BigDecimal.fromStringUnsafe("0")), false)
 * assert.deepStrictEqual(BigDecimal.isNegative(BigDecimal.fromStringUnsafe("1")), false)
 * ```
 *
 * @category predicates
 * @since 2.0.0
 */
export declare const isNegative: (n: BigDecimal) => boolean;
/**
 * Checks if a given `BigDecimal` is positive.
 *
 * **Example** (Checking positive decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(BigDecimal.isPositive(BigDecimal.fromStringUnsafe("-1")), false)
 * assert.deepStrictEqual(BigDecimal.isPositive(BigDecimal.fromStringUnsafe("0")), false)
 * assert.deepStrictEqual(BigDecimal.isPositive(BigDecimal.fromStringUnsafe("1")), true)
 * ```
 *
 * @category predicates
 * @since 2.0.0
 */
export declare const isPositive: (n: BigDecimal) => boolean;
/**
 * Rounding modes for `BigDecimal`.
 *
 * **Details**
 *
 * - `ceil`: round towards positive infinity
 * - `floor`: round towards negative infinity
 * - `to-zero`: round towards zero
 * - `from-zero`: round away from zero
 * - `half-ceil`: round to the nearest neighbor; if equidistant round towards positive infinity
 * - `half-floor`: round to the nearest neighbor; if equidistant round towards negative infinity
 * - `half-to-zero`: round to the nearest neighbor; if equidistant round towards zero
 * - `half-from-zero`: round to the nearest neighbor; if equidistant round away from zero
 * - `half-even`: round to the nearest neighbor; if equidistant round to the neighbor with an even digit
 * - `half-odd`: round to the nearest neighbor; if equidistant round to the neighbor with an odd digit
 *
 * @category math
 * @since 3.16.0
 */
export type RoundingMode = "ceil" | "floor" | "to-zero" | "from-zero" | "half-ceil" | "half-floor" | "half-to-zero" | "half-from-zero" | "half-even" | "half-odd";
/**
 * Rounds a `BigDecimal` at the given scale with the specified rounding mode.
 *
 * **Example** (Rounding decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.round(BigDecimal.fromStringUnsafe("145"), { mode: "from-zero", scale: -1 }),
 *   BigDecimal.fromStringUnsafe("150")
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.round(BigDecimal.fromStringUnsafe("-14.5")),
 *   BigDecimal.fromStringUnsafe("-15")
 * )
 * ```
 *
 * @category math
 * @since 3.16.0
 */
export declare const round: {
    /**
     * Rounds a `BigDecimal` at the given scale with the specified rounding mode.
     *
     * **Example** (Rounding decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.round(BigDecimal.fromStringUnsafe("145"), { mode: "from-zero", scale: -1 }),
     *   BigDecimal.fromStringUnsafe("150")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.round(BigDecimal.fromStringUnsafe("-14.5")),
     *   BigDecimal.fromStringUnsafe("-15")
     * )
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (options: {
        scale?: number;
        mode?: RoundingMode;
    }): (self: BigDecimal) => BigDecimal;
    /**
     * Rounds a `BigDecimal` at the given scale with the specified rounding mode.
     *
     * **Example** (Rounding decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.round(BigDecimal.fromStringUnsafe("145"), { mode: "from-zero", scale: -1 }),
     *   BigDecimal.fromStringUnsafe("150")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.round(BigDecimal.fromStringUnsafe("-14.5")),
     *   BigDecimal.fromStringUnsafe("-15")
     * )
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (n: BigDecimal, options?: {
        scale?: number;
        mode?: RoundingMode;
    }): BigDecimal;
};
/**
 * Truncate a `BigDecimal` at the given scale. This removes fractional digits beyond the scale,
 * rounding toward zero.
 *
 * **Example** (Truncating decimals)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 *
 * console.log(BigDecimal.truncate(BigDecimal.fromStringUnsafe("145"), -1)) // BigDecimal(140)
 * console.log(BigDecimal.truncate(BigDecimal.fromStringUnsafe("-14.5"))) // BigDecimal(-14)
 * ```
 *
 * @category math
 * @since 3.16.0
 */
export declare const truncate: {
    /**
     * Truncate a `BigDecimal` at the given scale. This removes fractional digits beyond the scale,
     * rounding toward zero.
     *
     * **Example** (Truncating decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * console.log(BigDecimal.truncate(BigDecimal.fromStringUnsafe("145"), -1)) // BigDecimal(140)
     * console.log(BigDecimal.truncate(BigDecimal.fromStringUnsafe("-14.5"))) // BigDecimal(-14)
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (scale: number): (self: BigDecimal) => BigDecimal;
    /**
     * Truncate a `BigDecimal` at the given scale. This removes fractional digits beyond the scale,
     * rounding toward zero.
     *
     * **Example** (Truncating decimals)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     *
     * console.log(BigDecimal.truncate(BigDecimal.fromStringUnsafe("145"), -1)) // BigDecimal(140)
     * console.log(BigDecimal.truncate(BigDecimal.fromStringUnsafe("-14.5"))) // BigDecimal(-14)
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (self: BigDecimal, scale?: number): BigDecimal;
};
/**
 * Calculate the ceiling of a `BigDecimal` at the given scale.
 *
 * **Example** (Rounding decimals up)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.ceil(BigDecimal.fromStringUnsafe("145"), -1),
 *   BigDecimal.fromStringUnsafe("150")
 * )
 * assert.deepStrictEqual(BigDecimal.ceil(BigDecimal.fromStringUnsafe("-14.5")), BigDecimal.fromStringUnsafe("-14"))
 * ```
 *
 * @category math
 * @since 3.16.0
 */
export declare const ceil: {
    /**
     * Calculate the ceiling of a `BigDecimal` at the given scale.
     *
     * **Example** (Rounding decimals up)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.ceil(BigDecimal.fromStringUnsafe("145"), -1),
     *   BigDecimal.fromStringUnsafe("150")
     * )
     * assert.deepStrictEqual(BigDecimal.ceil(BigDecimal.fromStringUnsafe("-14.5")), BigDecimal.fromStringUnsafe("-14"))
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (scale: number): (self: BigDecimal) => BigDecimal;
    /**
     * Calculate the ceiling of a `BigDecimal` at the given scale.
     *
     * **Example** (Rounding decimals up)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.ceil(BigDecimal.fromStringUnsafe("145"), -1),
     *   BigDecimal.fromStringUnsafe("150")
     * )
     * assert.deepStrictEqual(BigDecimal.ceil(BigDecimal.fromStringUnsafe("-14.5")), BigDecimal.fromStringUnsafe("-14"))
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (self: BigDecimal, scale?: number): BigDecimal;
};
/**
 * Calculate the floor of a `BigDecimal` at the given scale.
 *
 * **Example** (Rounding decimals down)
 *
 * ```ts
 * import { BigDecimal } from "effect"
 * import * as assert from "node:assert"
 *
 * assert.deepStrictEqual(
 *   BigDecimal.floor(BigDecimal.fromStringUnsafe("145"), -1),
 *   BigDecimal.fromStringUnsafe("140")
 * )
 * assert.deepStrictEqual(
 *   BigDecimal.floor(BigDecimal.fromStringUnsafe("-14.5")),
 *   BigDecimal.fromStringUnsafe("-15")
 * )
 * ```
 *
 * @category math
 * @since 3.16.0
 */
export declare const floor: {
    /**
     * Calculate the floor of a `BigDecimal` at the given scale.
     *
     * **Example** (Rounding decimals down)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.floor(BigDecimal.fromStringUnsafe("145"), -1),
     *   BigDecimal.fromStringUnsafe("140")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.floor(BigDecimal.fromStringUnsafe("-14.5")),
     *   BigDecimal.fromStringUnsafe("-15")
     * )
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (scale: number): (self: BigDecimal) => BigDecimal;
    /**
     * Calculate the floor of a `BigDecimal` at the given scale.
     *
     * **Example** (Rounding decimals down)
     *
     * ```ts
     * import { BigDecimal } from "effect"
     * import * as assert from "node:assert"
     *
     * assert.deepStrictEqual(
     *   BigDecimal.floor(BigDecimal.fromStringUnsafe("145"), -1),
     *   BigDecimal.fromStringUnsafe("140")
     * )
     * assert.deepStrictEqual(
     *   BigDecimal.floor(BigDecimal.fromStringUnsafe("-14.5")),
     *   BigDecimal.fromStringUnsafe("-15")
     * )
     * ```
     *
     * @category math
     * @since 3.16.0
     */
    (self: BigDecimal, scale?: number): BigDecimal;
};
export {};
//# sourceMappingURL=BigDecimal.d.ts.map