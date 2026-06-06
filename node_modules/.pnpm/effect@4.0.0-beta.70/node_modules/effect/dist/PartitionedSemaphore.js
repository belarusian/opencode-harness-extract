/**
 * The `PartitionedSemaphore` module provides a semaphore for limiting
 * concurrency across a shared permit pool while keeping waiters grouped by
 * partition key. A `PartitionedSemaphore<K>` is useful when many independent
 * groups of work compete for the same bounded resource and each group should
 * make progress without one busy group monopolizing released permits.
 *
 * **Mental model**
 *
 * - The semaphore has a fixed shared capacity measured in permits
 * - Work acquires permits with a partition key of type `K`
 * - Waiting acquisitions are tracked per partition
 * - Released permits are assigned to waiting partitions in round-robin order
 * - `withPermit` and `withPermits` acquire permits around an effect and
 *   release them when the effect exits, fails, or is interrupted
 *
 * **Common tasks**
 *
 * - Create a semaphore: {@link make}, {@link makeUnsafe}
 * - Inspect capacity and availability: {@link capacity}, {@link available}
 * - Acquire and release manually: {@link take}, {@link release}
 * - Limit a single operation per partition: {@link withPermit}
 * - Limit weighted work per partition: {@link withPermits}
 * - Run only when permits are immediately available:
 *   {@link withPermitsIfAvailable}
 *
 * **Gotchas**
 *
 * - `withPermitsIfAvailable` does not use a partition key; it only succeeds
 *   when the shared pool has enough permits immediately
 * - Acquiring more permits than the semaphore capacity never completes
 * - Requests for zero or negative permits complete without acquiring anything
 * - Non-finite capacities create an unbounded semaphore whose acquire and
 *   release operations complete immediately
 *
 * @since 4.0.0
 */
import * as Effect from "./Effect.js";
import { dual } from "./Function.js";
import * as MutableHashMap from "./MutableHashMap.js";
import * as Option from "./Option.js";
/**
 * Runtime type identifier used to mark values that implement
 * `PartitionedSemaphore`.
 *
 * **Details**
 *
 * This constant is stored on partitioned semaphore instances and can be used by
 * library code that needs to recognize the data type at runtime.
 *
 * @category models
 * @since 4.0.0
 */
export const PartitionedTypeId = "~effect/PartitionedSemaphore";
/**
 * Constructs a `PartitionedSemaphore` synchronously, outside of `Effect`.
 *
 * **When to use**
 *
 * Prefer `make` when the semaphore should be created inside an `Effect`
 * workflow.
 *
 * **Details**
 *
 * Negative permit counts are clamped to `0`. Non-finite permit counts create
 * an unbounded semaphore whose acquire and release operations complete
 * immediately.
 *
 * @category constructors
 * @since 3.19.4
 */
export const makeUnsafe = options => {
  const maxPermits = Math.max(0, options.permits);
  if (!Number.isFinite(maxPermits)) {
    return {
      [PartitionedTypeId]: PartitionedTypeId,
      capacity: maxPermits,
      available: Effect.succeed(maxPermits),
      take: () => Effect.void,
      release: () => Effect.succeed(maxPermits),
      withPermits: () => effect => effect,
      withPermit: () => effect => effect,
      withPermitsIfAvailable: () => effect => Effect.asSome(effect)
    };
  }
  let totalPermits = maxPermits;
  let waitingPermits = 0;
  const partitions = MutableHashMap.empty();
  let iterator = partitions[Symbol.iterator]();
  const releaseUnsafe = permits => {
    while (permits > 0) {
      if (waitingPermits === 0) {
        totalPermits = Math.min(maxPermits, totalPermits + permits);
        return totalPermits;
      }
      let state = iterator.next();
      if (state.done) {
        iterator = partitions[Symbol.iterator]();
        state = iterator.next();
        if (state.done) {
          return totalPermits;
        }
      }
      const waiter = state.value[1].values().next().value;
      if (waiter === undefined) {
        continue;
      }
      waiter.permits -= 1;
      waitingPermits -= 1;
      if (waiter.permits === 0) {
        waiter.resume();
      }
      permits -= 1;
    }
    return totalPermits;
  };
  const take = (key, permits) => {
    if (permits <= 0) {
      return Effect.void;
    }
    return Effect.callback(resume => {
      if (maxPermits < permits) {
        resume(Effect.never);
        return;
      }
      if (totalPermits >= permits) {
        totalPermits -= permits;
        resume(Effect.void);
        return;
      }
      const needed = permits - totalPermits;
      const taken = permits - needed;
      if (totalPermits > 0) {
        totalPermits = 0;
      }
      waitingPermits += needed;
      const waiters = Option.getOrElse(MutableHashMap.get(partitions, key), () => {
        const set = new Set();
        MutableHashMap.set(partitions, key, set);
        return set;
      });
      const entry = {
        permits: needed,
        resume: () => {
          cleanup();
          resume(Effect.void);
        }
      };
      const cleanup = () => {
        waiters.delete(entry);
        if (waiters.size === 0) {
          MutableHashMap.remove(partitions, key);
        }
      };
      waiters.add(entry);
      return Effect.sync(() => {
        cleanup();
        waitingPermits -= entry.permits;
        if (taken > 0) {
          releaseUnsafe(taken);
        }
      });
    });
  };
  const withPermits = (key, permits) => effect => {
    if (permits <= 0) {
      return effect;
    }
    const takePermits = take(key, permits);
    return Effect.uninterruptibleMask(restore => Effect.flatMap(restore(takePermits), () => Effect.ensuring(restore(effect), Effect.sync(() => {
      releaseUnsafe(permits);
    }))));
  };
  const tryTake = permits => {
    if (permits <= 0) {
      return true;
    }
    if (maxPermits < permits || totalPermits < permits) {
      return false;
    }
    totalPermits -= permits;
    return true;
  };
  return {
    [PartitionedTypeId]: PartitionedTypeId,
    capacity: maxPermits,
    available: Effect.sync(() => totalPermits),
    take,
    release: permits => Effect.sync(() => releaseUnsafe(permits)),
    withPermits,
    withPermit: key => withPermits(key, 1),
    withPermitsIfAvailable: permits => effect => {
      if (permits <= 0) {
        return Effect.asSome(effect);
      }
      return Effect.suspend(() => {
        if (!tryTake(permits)) {
          return Effect.succeed(Option.none());
        }
        return Effect.ensuring(Effect.asSome(effect), Effect.sync(() => {
          releaseUnsafe(permits);
        }));
      });
    }
  };
};
/**
 * Creates a `PartitionedSemaphore` inside an `Effect`.
 *
 * **Details**
 *
 * The `permits` option sets the shared permit capacity. The resulting
 * semaphore tracks waiters by partition key and distributes released permits
 * across waiting partitions in round-robin order.
 *
 * @category constructors
 * @since 3.19.4
 */
export const make = options => Effect.sync(() => makeUnsafe(options));
/**
 * Gets the current number of available permits.
 *
 * @category combinators
 * @since 4.0.0
 */
export const available = self => self.available;
/**
 * Gets the total capacity.
 *
 * @category getters
 * @since 4.0.0
 */
export const capacity = self => self.capacity;
/**
 * Returns an effect that acquires the requested number of permits for the
 * given partition key.
 *
 * **Details**
 *
 * If enough permits are available, the effect completes immediately. Otherwise
 * it waits until released permits are assigned to this partition. Requests for
 * more permits than the semaphore capacity never complete. Requests for zero
 * or a negative number of permits complete without acquiring anything.
 *
 * @category combinators
 * @since 4.0.0
 */
export const take = /*#__PURE__*/dual(3, (self, key, permits) => self.take(key, permits));
/**
 * Returns an effect that releases permits back to the shared pool and returns
 * the current available permit count.
 *
 * **Details**
 *
 * Released permits are first assigned to waiting partitions in round-robin
 * order. Only permits not needed by waiters increase the available count,
 * which is capped at the semaphore capacity.
 *
 * @category combinators
 * @since 4.0.0
 */
export const release = /*#__PURE__*/dual(2, (self, permits) => self.release(permits));
/**
 * Runs an effect after acquiring permits for a partition, then releases those
 * permits when the effect exits.
 *
 * **Details**
 *
 * Permit acquisition may wait according to `take` semantics. Once acquired,
 * the permits are released even if the wrapped effect fails or is interrupted.
 * Requests for zero or a negative number of permits run the effect without
 * acquiring anything.
 *
 * @category combinators
 * @since 4.0.0
 */
export const withPermits = (...args) => {
  if (args.length === 3) {
    const [self, key, permits] = args;
    return effect => self.withPermits(key, permits)(effect);
  }
  const [self, key, permits, effect] = args;
  return self.withPermits(key, permits)(effect);
};
/**
 * Runs an effect after acquiring one permit for a partition, then releases the
 * permit when the effect exits.
 *
 * **Details**
 *
 * This is the single-permit variant of `withPermits`. The permit is released
 * even if the wrapped effect fails or is interrupted.
 *
 * @category combinators
 * @since 4.0.0
 */
export const withPermit = (...args) => {
  if (args.length === 2) {
    const [self, key] = args;
    return effect => self.withPermit(key)(effect);
  }
  const [self, key, effect] = args;
  return self.withPermit(key)(effect);
};
/**
 * Runs an effect only when the requested permits can be acquired immediately,
 * returning the result in `Some`.
 *
 * **Details**
 *
 * If the permits are not available, the effect is not run and the result is
 * `None`. When permits are acquired, they are released after the wrapped
 * effect completes, fails, or is interrupted. Requests for zero or a negative
 * number of permits run the effect and return `Some`.
 *
 * @category combinators
 * @since 4.0.0
 */
export const withPermitsIfAvailable = (...args) => {
  if (args.length === 2) {
    const [self, permits] = args;
    return effect => self.withPermitsIfAvailable(permits)(effect);
  }
  const [self, permits, effect] = args;
  return self.withPermitsIfAvailable(permits)(effect);
};
//# sourceMappingURL=PartitionedSemaphore.js.map