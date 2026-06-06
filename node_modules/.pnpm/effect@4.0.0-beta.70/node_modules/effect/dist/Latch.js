import * as internal from "./internal/effect.js";
/**
 * Creates a `Latch` synchronously, outside of `Effect`.
 *
 * **When to use**
 *
 * Use this only when synchronous allocation is required; otherwise prefer
 * `make`.
 *
 * **Details**
 *
 * The latch starts closed by default; pass `true` to create it open.
 *
 * **Example** (Creating a latch unsafely)
 *
 * ```ts
 * import { Effect, Latch } from "effect"
 *
 * const latch = Latch.makeUnsafe(false)
 *
 * const waiter = Effect.gen(function*() {
 *   yield* Effect.log("Waiting for latch to open...")
 *   yield* latch.await
 *   yield* Effect.log("Latch opened! Continuing...")
 * })
 *
 * const opener = Effect.gen(function*() {
 *   yield* Effect.sleep("2 seconds")
 *   yield* Effect.log("Opening latch...")
 *   yield* latch.open
 * })
 *
 * const program = Effect.all([waiter, opener])
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export const makeUnsafe = internal.makeLatchUnsafe;
/**
 * Creates a `Latch` inside `Effect`.
 *
 * **Details**
 *
 * The latch starts closed by default; pass `true` to create it open.
 *
 * **Example** (Creating a latch)
 *
 * ```ts
 * import { Effect, Latch } from "effect"
 *
 * const program = Effect.gen(function*() {
 *   const latch = yield* Latch.make(false)
 *
 *   const waiter = Effect.gen(function*() {
 *     yield* Effect.log("Waiting for latch to open...")
 *     yield* latch.await
 *     yield* Effect.log("Latch opened! Continuing...")
 *   })
 *
 *   const opener = Effect.gen(function*() {
 *     yield* Effect.sleep("2 seconds")
 *     yield* Effect.log("Opening latch...")
 *     yield* latch.open
 *   })
 *
 *   yield* Effect.all([waiter, opener])
 * })
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = internal.makeLatch;
/**
 * Opens the latch and releases fibers waiting on it.
 *
 * **Details**
 *
 * The returned effect succeeds with `true` when this call changed the latch
 * from closed to open, or `false` if it was already open.
 *
 * @category combinators
 * @since 4.0.0
 */
export const open = self => self.open;
/**
 * Synchronously opens the latch and releases fibers waiting on it.
 *
 * **Details**
 *
 * Returns `true` when this call changed the latch from closed to open, or
 * `false` if it was already open. This unsafe variant performs the state
 * change immediately instead of returning an `Effect`.
 *
 * @category unsafe
 * @since 4.0.0
 */
export const openUnsafe = self => self.openUnsafe();
/**
 * Releases the fibers currently waiting on a closed latch without opening it.
 *
 * **Details**
 *
 * The returned effect succeeds with `true` when release was requested while
 * the latch was closed, or `false` if the latch was already open. Future
 * waiters still suspend until the latch is opened or released again.
 *
 * @category combinators
 * @since 4.0.0
 */
export const release = self => self.release;
const _await = self => self.await;
export {
/**
 * Waits for the latch to be opened.
 *
 * @category getters
 * @since 4.0.0
 */
_await as await };
/**
 * Closes the latch so future `await` and `whenOpen` calls suspend.
 *
 * **Details**
 *
 * The returned effect succeeds with `true` when this call changed the latch
 * from open to closed, or `false` if it was already closed.
 *
 * @category combinators
 * @since 4.0.0
 */
export const close = self => self.close;
/**
 * Synchronously closes the latch so future `await` and `whenOpen` calls
 * suspend.
 *
 * **Details**
 *
 * Returns `true` when this call changed the latch from open to closed, or
 * `false` if it was already closed. This unsafe variant performs the state
 * change immediately instead of returning an `Effect`.
 *
 * @category unsafe
 * @since 4.0.0
 */
export const closeUnsafe = self => self.closeUnsafe();
/**
 * Waits on the latch, then runs the provided effect.
 *
 * **Details**
 *
 * If the latch is open, the effect runs immediately. If it is closed, the
 * returned effect suspends until the latch is opened or the current waiters are
 * released. The provided effect's success, failure, and requirements are
 * preserved.
 *
 * @category combinators
 * @since 4.0.0
 */
export const whenOpen = (...args) => {
  if (args.length === 1) {
    const [self] = args;
    return effect => self.whenOpen(effect);
  }
  const [self, effect] = args;
  return self.whenOpen(effect);
};
//# sourceMappingURL=Latch.js.map