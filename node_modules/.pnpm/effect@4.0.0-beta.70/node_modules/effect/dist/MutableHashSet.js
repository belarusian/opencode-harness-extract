/**
 * The `MutableHashSet` module provides a mutable hash set for storing unique
 * values with efficient membership checks, insertion, removal, and iteration.
 * It is built on {@link MutableHashMap}: each set value is stored as a map key,
 * so uniqueness follows the same hashing and equality rules as the underlying
 * mutable hash map.
 *
 * **Mental model**
 *
 * - `MutableHashSet<V>` is a mutable collection of unique values of type `V`
 * - Operations such as {@link add}, {@link remove}, and {@link clear} mutate
 *   the set in place
 * - Duplicate values are ignored according to Effect equality and hashing semantics
 * - Values that implement `Equal` / `Hash` are compared structurally
 * - Primitive values and references that do not implement Effect equality use
 *   the normal hash map behavior
 * - The set is iterable, so `Array.from(set)` or `for...of` can be used to
 *   inspect its values
 *
 * **Common tasks**
 *
 * - Create an empty set: {@link empty}
 * - Create from values: {@link make}
 * - Create from any iterable: {@link fromIterable}
 * - Add a value: {@link add}
 * - Check membership: {@link has}
 * - Remove a value: {@link remove}
 * - Remove all values: {@link clear}
 * - Count unique values: {@link size}
 * - Narrow unknown values: {@link isMutableHashSet}
 *
 * **Gotchas**
 *
 * - This data structure is intentionally mutable; keep ownership clear when
 *   sharing it between callers
 * - Mutating operations return the same set instance for convenient piping, not
 *   a copy
 * - Iteration order should not be used as a stable sorting mechanism
 * - For immutable set operations, use Effect's immutable collection modules
 *   instead
 *
 * **Performance**
 *
 * - Add, membership checks, and removal are O(1) on average and O(n) in the
 *   presence of hash collisions
 * - Clearing and reading the size are O(1)
 * - Iteration is O(n)
 *
 * **Quickstart**
 *
 * **Example** (Tracking unique values)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.make("apple", "banana", "apple")
 *
 * MutableHashSet.add(set, "cherry")
 * MutableHashSet.remove(set, "banana")
 *
 * console.log(MutableHashSet.has(set, "apple"))
 * // Output: true
 *
 * console.log(MutableHashSet.size(set))
 * // Output: 2
 *
 * console.log(Array.from(set))
 * // Output: ["apple", "cherry"]
 * ```
 *
 * @since 2.0.0
 */
import { format } from "./Formatter.js";
import * as Dual from "./Function.js";
import { NodeInspectSymbol, toJson } from "./Inspectable.js";
import * as MutableHashMap from "./MutableHashMap.js";
import { pipeArguments } from "./Pipeable.js";
import { hasProperty } from "./Predicate.js";
const TypeId = "~effect/collections/MutableHashSet";
/**
 * Checks if the specified value is a `MutableHashSet`, `false` otherwise.
 *
 * @category refinements
 * @since 4.0.0
 */
export const isMutableHashSet = value => hasProperty(value, TypeId);
const MutableHashSetProto = {
  [TypeId]: TypeId,
  [Symbol.iterator]() {
    return Array.from(this.keyMap).map(([_]) => _)[Symbol.iterator]();
  },
  toString() {
    return `MutableHashSet(${format(Array.from(this))})`;
  },
  toJSON() {
    return {
      _id: "MutableHashSet",
      values: toJson(Array.from(this))
    };
  },
  [NodeInspectSymbol]() {
    return this.toJSON();
  },
  pipe() {
    return pipeArguments(this, arguments);
  }
};
const fromHashMap = keyMap => {
  const set = Object.create(MutableHashSetProto);
  set.keyMap = keyMap;
  return set;
};
/**
 * Creates an empty MutableHashSet.
 *
 * **Example** (Creating an empty set)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.empty<string>()
 *
 * // Add some values
 * MutableHashSet.add(set, "apple")
 * MutableHashSet.add(set, "banana")
 * MutableHashSet.add(set, "apple") // Duplicate, no effect
 *
 * console.log(MutableHashSet.size(set)) // 2
 * console.log(Array.from(set)) // ["apple", "banana"]
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const empty = () => fromHashMap(MutableHashMap.empty());
/**
 * Creates a MutableHashSet from an iterable collection of values.
 * Duplicates are automatically removed.
 *
 * **Example** (Creating a set from an iterable)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const values = ["apple", "banana", "apple", "cherry", "banana"]
 * const set = MutableHashSet.fromIterable(values)
 *
 * console.log(MutableHashSet.size(set)) // 3
 * console.log(Array.from(set)) // ["apple", "banana", "cherry"]
 *
 * // Works with any iterable
 * const fromSet = MutableHashSet.fromIterable(new Set([1, 2, 3]))
 * console.log(MutableHashSet.size(fromSet)) // 3
 *
 * // From string characters
 * const fromString = MutableHashSet.fromIterable("hello")
 * console.log(Array.from(fromString)) // ["h", "e", "l", "o"]
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromIterable = keys => fromHashMap(MutableHashMap.fromIterable(Array.from(keys).map(k => [k, true])));
/**
 * Creates a MutableHashSet from a variable number of values.
 * Duplicates are automatically removed.
 *
 * **Example** (Creating a set from values)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.make("apple", "banana", "apple", "cherry")
 *
 * console.log(MutableHashSet.size(set)) // 3
 * console.log(Array.from(set)) // ["apple", "banana", "cherry"]
 *
 * // With numbers
 * const numbers = MutableHashSet.make(1, 2, 3, 2, 1)
 * console.log(MutableHashSet.size(numbers)) // 3
 * console.log(Array.from(numbers)) // [1, 2, 3]
 *
 * // Mixed types
 * const mixed = MutableHashSet.make("hello", 42, true, "hello")
 * console.log(MutableHashSet.size(mixed)) // 3
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const make = (...keys) => fromIterable(keys);
/**
 * Adds a value to the MutableHashSet, mutating the set in place.
 * If the value already exists, the set remains unchanged.
 *
 * **Example** (Adding values)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.empty<string>()
 *
 * // Add new values
 * MutableHashSet.add(set, "apple")
 * MutableHashSet.add(set, "banana")
 *
 * console.log(MutableHashSet.size(set)) // 2
 * console.log(MutableHashSet.has(set, "apple")) // true
 *
 * // Add duplicate (no effect)
 * MutableHashSet.add(set, "apple")
 * console.log(MutableHashSet.size(set)) // 2
 *
 * // Pipe-able version
 * const addFruit = MutableHashSet.add("cherry")
 * addFruit(set)
 * console.log(MutableHashSet.size(set)) // 3
 * ```
 *
 * @category mutations
 * @since 2.0.0
 */
export const add = /*#__PURE__*/Dual.dual(2, (self, key) => (MutableHashMap.set(self.keyMap, key, true), self));
/**
 * Checks if the MutableHashSet contains the specified value.
 *
 * **Example** (Checking for a value)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.make("apple", "banana", "cherry")
 *
 * console.log(MutableHashSet.has(set, "apple")) // true
 * console.log(MutableHashSet.has(set, "grape")) // false
 *
 * // Pipe-able version
 * const hasApple = MutableHashSet.has("apple")
 * console.log(hasApple(set)) // true
 *
 * // Check after adding
 * MutableHashSet.add(set, "grape")
 * console.log(MutableHashSet.has(set, "grape")) // true
 * ```
 *
 * @category elements
 * @since 2.0.0
 */
export const has = /*#__PURE__*/Dual.dual(2, (self, key) => MutableHashMap.has(self.keyMap, key));
/**
 * Removes the specified value from the MutableHashSet, mutating the set in place.
 * If the value doesn't exist, the set remains unchanged.
 *
 * **Example** (Removing a value)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.make("apple", "banana", "cherry")
 *
 * console.log(MutableHashSet.size(set)) // 3
 *
 * // Remove existing value
 * MutableHashSet.remove(set, "banana")
 * console.log(MutableHashSet.size(set)) // 2
 * console.log(MutableHashSet.has(set, "banana")) // false
 *
 * // Remove non-existent value (no effect)
 * MutableHashSet.remove(set, "grape")
 * console.log(MutableHashSet.size(set)) // 2
 *
 * // Pipe-able version
 * const removeFruit = MutableHashSet.remove("apple")
 * removeFruit(set)
 * console.log(MutableHashSet.size(set)) // 1
 * ```
 *
 * @category mutations
 * @since 2.0.0
 */
export const remove = /*#__PURE__*/Dual.dual(2, (self, key) => (MutableHashMap.remove(self.keyMap, key), self));
/**
 * Returns the number of unique values in the MutableHashSet.
 *
 * **Example** (Checking set size)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.empty<string>()
 * console.log(MutableHashSet.size(set)) // 0
 *
 * MutableHashSet.add(set, "apple")
 * MutableHashSet.add(set, "banana")
 * MutableHashSet.add(set, "apple") // Duplicate
 * console.log(MutableHashSet.size(set)) // 2
 *
 * MutableHashSet.remove(set, "apple")
 * console.log(MutableHashSet.size(set)) // 1
 *
 * MutableHashSet.clear(set)
 * console.log(MutableHashSet.size(set)) // 0
 * ```
 *
 * @category elements
 * @since 2.0.0
 */
export const size = self => MutableHashMap.size(self.keyMap);
/**
 * Removes all values from the MutableHashSet, mutating the set in place.
 * The set becomes empty after this operation.
 *
 * **Example** (Clearing all values)
 *
 * ```ts
 * import { MutableHashSet } from "effect"
 *
 * const set = MutableHashSet.make("apple", "banana", "cherry")
 *
 * console.log(MutableHashSet.size(set)) // 3
 *
 * // Clear all values
 * MutableHashSet.clear(set)
 *
 * console.log(MutableHashSet.size(set)) // 0
 * console.log(MutableHashSet.has(set, "apple")) // false
 * console.log(Array.from(set)) // []
 *
 * // Can still add new values after clearing
 * MutableHashSet.add(set, "new")
 * console.log(MutableHashSet.size(set)) // 1
 * ```
 *
 * @category mutations
 * @since 2.0.0
 */
export const clear = self => (MutableHashMap.clear(self.keyMap), self);
//# sourceMappingURL=MutableHashSet.js.map