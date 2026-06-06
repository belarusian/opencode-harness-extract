import * as Arr from "./Array.js";
import * as Cause from "./Cause.js";
import * as Channel from "./Channel.js";
import * as Clock from "./Clock.js";
import * as Duration from "./Duration.js";
import * as Effect from "./Effect.js";
import * as Exit from "./Exit.js";
import { constant, constFalse, constTrue, constVoid, dual, identity, pipe } from "./Function.js";
import * as internalStream from "./internal/stream.js";
import * as Option from "./Option.js";
import { pipeArguments } from "./Pipeable.js";
import { hasProperty } from "./Predicate.js";
import * as PubSub from "./PubSub.js";
import * as Pull from "./Pull.js";
import * as Queue from "./Queue.js";
import * as Result from "./Result.js";
import * as Scope from "./Scope.js";
const TypeId = "~effect/Sink";
const endVoid = /*#__PURE__*/Effect.succeed([void 0]);
const sinkVariance = {
  _A: identity,
  _In: identity,
  _L: identity,
  _E: identity,
  _R: identity
};
const SinkProto = {
  [TypeId]: sinkVariance,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
/**
 * Checks if a value is a Sink.
 *
 * **Example** (Checking for a sink)
 *
 * ```ts
 * import { Sink } from "effect"
 *
 * const sink = Sink.never
 * const notStream = { data: [1, 2, 3] }
 *
 * console.log(Sink.isSink(sink)) // true
 * console.log(Sink.isSink(notStream)) // false
 * ```
 *
 * @category guards
 * @since 4.0.0
 */
export const isSink = u => hasProperty(u, TypeId);
/**
 * Creates a sink from a `Channel`.
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromChannel = channel => fromTransform((upstream, scope) => Channel.toTransform(channel)(upstream, scope).pipe(Effect.flatMap(Effect.forever({
  disableYield: true
})), Pull.catchDone(Effect.succeed)));
/**
 * Creates a `Sink` from a low-level transform function.
 *
 * **Details**
 *
 * The transform receives the upstream pull of non-empty input arrays and the
 * active scope, and returns an effect that completes with the sink's `End`
 * value.
 *
 * @category constructors
 * @since 4.0.0
 */
export const fromTransform = transform => {
  const self = Object.create(SinkProto);
  self.transform = transform;
  return self;
};
/**
 * Creates a `Channel` from a Sink.
 *
 * **Example** (Converting a sink to a channel)
 *
 * ```ts
 * import { Sink } from "effect"
 *
 * // Create a sink and extract its channel
 * const sink = Sink.succeed(42)
 * const channel = Sink.toChannel(sink)
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const toChannel = self => Channel.fromTransform((upstream, scope) => Effect.succeed(Effect.flatMap(self.transform(upstream, scope), Cause.done)));
/**
 * Creates a pipe-style constructor for sinks over input type `In`.
 *
 * **Details**
 *
 * The returned function exposes the sink input as a `Stream<In>`, applies the
 * provided pipeline, and uses the final effect's success value as the sink
 * result.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = () => (...fns) => fromTransform((upstream, scope) => pipe(internalStream.fromChannel(Channel.fromPull(Effect.succeed(upstream))), ...fns, Effect.flatMap(a => Cause.done([a])), Scope.provide(scope)));
/**
 * Creates a sink that ignores upstream input and completes from an effect that
 * already returns an `End`.
 *
 * **When to use**
 *
 * Use this when the effect needs to provide both the result value and optional
 * leftovers.
 *
 * @category constructors
 * @since 4.0.0
 */
export const fromEffectEnd = effect => fromTransform(() => effect);
/**
 * Creates a sink that ignores upstream input and completes with the success
 * value of the provided effect.
 *
 * **Details**
 *
 * If the effect fails, the sink fails with the same error.
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromEffect = effect => fromEffectEnd(Effect.map(effect, a => [a]));
/**
 * Creates a sink that offers every consumed input element to a queue.
 *
 * **Details**
 *
 * When the upstream stream ends, the sink ends the queue and completes with
 * `void`.
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromQueue = queue => fromTransform(upstream => upstream.pipe(Effect.flatMap(arr => Queue.offerAll(queue, arr)), Effect.forever({
  disableYield: true
}), Pull.catchDone(_ => {
  Queue.endUnsafe(queue);
  return endVoid;
})));
/**
 * Creates a sink that publishes every consumed input element to a `PubSub`.
 *
 * **Details**
 *
 * The sink completes with `void` when the upstream stream ends.
 *
 * @category constructors
 * @since 2.0.0
 */
export const fromPubSub = pubsub => forEachArray(arr => PubSub.publishAll(pubsub, arr));
/**
 * A sink that immediately ends with the specified value.
 *
 * **Example** (Succeeding with a value)
 *
 * ```ts
 * import { Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that always yields the same value
 * const sink = Sink.succeed(42)
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program).then(console.log)
 * // Output: 42
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const succeed = (a, leftovers) => fromEffectEnd(Effect.succeed([a, leftovers]));
/**
 * A sink that immediately ends with the specified lazily evaluated value.
 *
 * @category constructors
 * @since 2.0.0
 */
export const sync = a => fromEffect(Effect.sync(a));
/**
 * A sink that is created from a lazily evaluated sink.
 *
 * @category constructors
 * @since 2.0.0
 */
export const suspend = evaluate => fromTransform((upstream, scope) => evaluate().transform(upstream, scope));
/**
 * A sink that always fails with the specified error.
 *
 * **Example** (Failing with an error)
 *
 * ```ts
 * import { Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that always fails
 * const sink = Sink.fail(new Error("Sink failed"))
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program).catch(console.log)
 * // Output: Error: Sink failed
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const fail = e => fromEffectEnd(Effect.fail(e));
/**
 * A sink that always fails with the specified lazily evaluated error.
 *
 * **Example** (Failing with a lazy error)
 *
 * ```ts
 * import { Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that fails with a lazy error
 * const sink = Sink.failSync(() => new Error("Lazy error"))
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program).catch(console.log)
 * // Output: Error: Lazy error
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const failSync = evaluate => fromEffectEnd(Effect.failSync(evaluate));
/**
 * Creates a sink halting with a specified `Cause`.
 *
 * **Example** (Failing with a cause)
 *
 * ```ts
 * import { Cause, Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that fails with a specific cause
 * const sink = Sink.failCause(Cause.fail(new Error("Custom cause")))
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program).catch(console.log)
 * // Output: Error: Custom cause
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const failCause = cause => fromEffectEnd(Effect.failCause(cause));
/**
 * Creates a sink halting with a specified lazily evaluated `Cause`.
 *
 * **Example** (Failing with a lazy cause)
 *
 * ```ts
 * import { Cause, Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that fails with a lazy cause
 * const sink = Sink.failCauseSync(() => Cause.fail(new Error("Lazy cause")))
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program).catch(console.log)
 * // Output: Error: Lazy cause
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const failCauseSync = evaluate => fromEffectEnd(Effect.failCauseSync(evaluate));
/**
 * Creates a sink halting with a specified defect.
 *
 * **Example** (Dying with a defect)
 *
 * ```ts
 * import { Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that dies with a defect
 * const sink = Sink.die(new Error("Defect error"))
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program).catch(console.log)
 * // Output: Error: Defect error
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const die = defect => fromEffectEnd(Effect.die(defect));
/**
 * A sink that never completes.
 *
 * @category constructors
 * @since 2.0.0
 */
export const never = /*#__PURE__*/fromEffectEnd(Effect.never);
/**
 * Drops leftovers produced by a sink.
 *
 * **Details**
 *
 * The sink result is preserved, but any leftover elements are discarded
 * instead of being returned to downstream sink composition. This does not
 * continue pulling additional elements from the upstream stream.
 *
 * @category utils
 * @since 2.0.0
 */
export const ignoreLeftover = self => mapEnd(self, ([a]) => [a]);
/**
 * Drains elements from the stream by ignoring all inputs.
 *
 * @category constructors
 * @since 2.0.0
 */
export const drain = /*#__PURE__*/fromTransform(upstream => Pull.catchDone(Effect.forever(upstream, {
  disableYield: true
}), () => endVoid));
/**
 * A sink that folds its inputs with the provided function, termination
 * predicate and initial state.
 *
 * @category folding
 * @since 2.0.0
 */
export const fold = (s, contFn, f) => fromTransform(upstream => {
  let state = s();
  return Effect.gen(function* () {
    while (true) {
      const arr = yield* upstream;
      for (let i = 0; i < arr.length; i++) {
        state = yield* f(state, arr[i]);
        if (contFn(state)) continue;
        return [state, i + 1 < arr.length ? arr.slice(i + 1) : undefined];
      }
    }
  }).pipe(Pull.catchDone(() => Effect.succeed([state])));
});
/**
 * Folds non-empty input arrays into state with an effectful function.
 *
 * **Details**
 *
 * The initial state is evaluated lazily. After each pulled array is folded,
 * the sink continues while `contFn` returns `true`; otherwise it completes
 * with the current state.
 *
 * @category folding
 * @since 4.0.0
 */
export const foldArray = (s, contFn, f) => fromTransform(upstream => {
  let state = s();
  return Effect.gen(function* () {
    while (true) {
      const arr = yield* upstream;
      state = yield* f(state, arr);
      if (contFn(state)) continue;
      return [state];
    }
  }).pipe(Pull.catchDone(() => Effect.succeed([state])));
});
/**
 * Folds input elements into state until the specified maximum number of
 * elements has been consumed or the upstream stream ends.
 *
 * **Details**
 *
 * If the sink stops in the middle of a pulled array, the remaining elements
 * from that array are returned as leftovers.
 *
 * @category folding
 * @since 2.0.0
 */
export const foldUntil = (s, max, f) => fold(() => [s(), 0], tuple => tuple[1] < max, ([output, count], input) => Effect.map(f(output, input), s => [s, count + 1])).pipe(map(tuple => tuple[0]));
/**
 * A sink that returns whether all elements satisfy the specified predicate.
 *
 * @category constructors
 * @since 2.0.0
 */
export const every = predicate => fold(constTrue, identity, (_, a) => Effect.succeed(predicate(a)));
/**
 * A sink that returns whether an element satisfies the specified predicate.
 *
 * @category constructors
 * @since 2.0.0
 */
export const some = predicate => fold(constFalse, b => !b, (_, a) => Effect.succeed(predicate(a)));
/**
 * Transforms this sink's result.
 *
 * @category mapping
 * @since 2.0.0
 */
export const map = /*#__PURE__*/dual(2, (self, f) => mapEnd(self, ([a, l]) => [f(a), l]));
/**
 * Set the sink's result to a constant value.
 *
 * @category mapping
 * @since 2.0.0
 */
export const as = /*#__PURE__*/dual(2, (self, a2) => map(self, () => a2));
/**
 * Transforms this sink's input elements.
 *
 * @category mapping
 * @since 2.0.0
 */
export const mapInput = /*#__PURE__*/dual(2, (self, f) => mapInputArray(self, Arr.map(f)));
/**
 * Effectfully transforms this sink's input elements.
 *
 * @category mapping
 * @since 2.0.0
 */
export const mapInputEffect = /*#__PURE__*/dual(2, (self, f) => mapInputArrayEffect(self, Effect.forEach(f)));
/**
 * Transforms each non-empty array of upstream input before it is fed to this
 * sink.
 *
 * @category mapping
 * @since 4.0.0
 */
export const mapInputArray = /*#__PURE__*/dual(2, (self, f) => fromTransform((upstream, scope) => self.transform(Effect.map(upstream, f), scope)));
/**
 * Effectfully transforms each non-empty array of upstream input before it is
 * fed to this sink.
 *
 * @category mapping
 * @since 4.0.0
 */
export const mapInputArrayEffect = /*#__PURE__*/dual(2, (self, f) => fromTransform((upstream, scope) => self.transform(Effect.flatMap(upstream, f), scope)));
/**
 * Transforms the full `End` produced by this sink.
 *
 * **Details**
 *
 * This can change both the result value and the optional leftovers.
 *
 * @category mapping
 * @since 4.0.0
 */
export const mapEnd = /*#__PURE__*/dual(2, (self, f) => fromTransform((upstream, scope) => Effect.map(self.transform(upstream, scope), f)));
const transformEffect = (self, f) => fromTransform((upstream, scope) => f(self.transform(upstream, scope)));
/**
 * Effectfully transforms the full `End` produced by this sink.
 *
 * **Details**
 *
 * This can change both the result value and the optional leftovers, and the
 * transformation can fail or require services.
 *
 * @category mapping
 * @since 4.0.0
 */
export const mapEffectEnd = /*#__PURE__*/dual(2, (self, f) => transformEffect(self, Effect.flatMap(f)));
/**
 * Effectfully transforms this sink's result.
 *
 * @category mapping
 * @since 2.0.0
 */
export const mapEffect = /*#__PURE__*/dual(2, (self, f) => mapEffectEnd(self, ([a, l]) => Effect.map(f(a), a2 => [a2, l])));
/**
 * Transforms the errors emitted by this sink using `f`.
 *
 * @category mapping
 * @since 2.0.0
 */
export const mapError = /*#__PURE__*/dual(2, (self, f) => transformEffect(self, Effect.mapError(f)));
/**
 * Transforms the leftovers emitted by this sink using `f`.
 *
 * @category mapping
 * @since 2.0.0
 */
export const mapLeftover = /*#__PURE__*/dual(2, (self, f) => mapEnd(self, ([a, l]) => [a, l && Arr.map(l, f)]));
/**
 * Collects up to `n` input elements into an array.
 *
 * **Details**
 *
 * If `n` is less than or equal to zero, the sink completes with an empty array.
 * If more elements are pulled than needed, the remaining elements from the same
 * array are returned as leftovers.
 *
 * @category collecting
 * @since 2.0.0
 */
export const take = n => fromTransform(upstream => {
  const taken = [];
  if (n <= 0) {
    return Effect.succeed([taken]);
  }
  let leftover = undefined;
  return upstream.pipe(Effect.flatMap(arr => {
    if (taken.length + arr.length <= n) {
      taken.push(...arr);
      if (taken.length === n) {
        return Cause.done();
      }
      return Effect.void;
    }
    for (let i = 0; i < arr.length; i++) {
      taken.push(arr[i]);
      if (taken.length === n) {
        if (i + 1 < arr.length) {
          leftover = arr.slice(i + 1);
        }
        return Cause.done();
      }
    }
    return Effect.void;
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([taken, leftover])));
});
/**
 * Runs this sink until it yields a result, then uses that result to create
 * another sink from the provided function which will continue to run until it
 * yields a result.
 *
 * **Details**
 *
 * This function essentially runs sinks in sequence.
 *
 * @category sequencing
 * @since 2.0.0
 */
export const flatMap = /*#__PURE__*/dual(2, (self, f) => fromTransform((upstream, scope) => {
  let upstreamDone = false;
  const pull = Effect.catchCause(upstream, cause => {
    upstreamDone = true;
    return Effect.failCause(cause);
  });
  return Effect.flatMap(self.transform(pull, scope), ([a, leftover]) => f(a).transform(Effect.suspend(() => {
    if (leftover) {
      const arr = leftover;
      leftover = undefined;
      return Effect.succeed(arr);
    } else if (upstreamDone) {
      return Cause.done();
    }
    return upstream;
  }), scope));
}));
/**
 * A sink that reduces its inputs using the provided function `f` starting from
 * the provided `initial` state while the specified `predicate` returns `true`.
 *
 * @category reducing
 * @since 4.0.0
 */
export const reduceWhile = (initial, predicate, f) => fromTransform(upstream => {
  let state = initial();
  let leftover = undefined;
  if (!predicate(state)) {
    return Effect.succeed([state]);
  }
  return upstream.pipe(Effect.flatMap(arr => {
    for (let i = 0; i < arr.length; i++) {
      state = f(state, arr[i]);
      if (!predicate(state)) {
        if (i + 1 < arr.length) {
          leftover = arr.slice(i + 1);
        }
        return Cause.done();
      }
    }
    return Effect.void;
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([state, leftover])));
});
/**
 * A sink that reduces its inputs using the provided effectful function `f`
 * starting from the provided `initial` state while the specified `predicate`
 * returns `true`.
 *
 * @category reducing
 * @since 4.0.0
 */
export const reduceWhileEffect = (initial, predicate, f) => fromTransform(upstream => {
  let state = initial();
  let leftover = undefined;
  if (!predicate(state)) {
    return Effect.succeed([state]);
  }
  return upstream.pipe(Effect.flatMap(arr => {
    let i = 0;
    return Effect.whileLoop({
      while: () => i < arr.length,
      body: constant(Effect.flatMap(Effect.suspend(() => f(state, arr[i++])), s => {
        state = s;
        if (!predicate(state)) {
          if (i < arr.length) {
            leftover = arr.slice(i);
          }
          return Cause.done();
        }
        return Effect.void;
      })),
      step: constVoid
    });
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([state, leftover])));
});
/**
 * A sink that reduces its inputs using the provided function `f` starting from
 * the provided `initial` state while the specified `predicate` returns `true`.
 *
 * @category reducing
 * @since 4.0.0
 */
export const reduceWhileArray = (initial, contFn, f) => fromTransform(upstream => {
  let state = initial();
  if (!contFn(state)) {
    return Effect.succeed([state]);
  }
  return upstream.pipe(Effect.flatMap(arr => {
    for (let i = 0; i < arr.length; i++) {
      state = f(state, arr);
      if (!contFn(state)) {
        return Cause.done();
      }
    }
    return Effect.void;
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([state])));
});
/**
 * A sink that reduces its inputs using the provided effectful function `f`
 * starting from the provided `initial` state while the specified `predicate`
 * returns `true`.
 *
 * @category reducing
 * @since 4.0.0
 */
export const reduceWhileArrayEffect = (initial, predicate, f) => fromTransform(upstream => {
  let state = initial();
  if (!predicate(state)) {
    return Effect.succeed([state]);
  }
  return upstream.pipe(Effect.flatMap(arr => f(state, arr)), Effect.flatMap(s => {
    state = s;
    if (!predicate(state)) {
      return Cause.done();
    }
    return Effect.void;
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([state])));
});
/**
 * A sink that reduces its inputs using the provided function `f` starting from
 * the provided `initial` state.
 *
 * @category reducing
 * @since 4.0.0
 */
export const reduce = (initial, f) => reduceArray(initial, (s, arr) => {
  for (let i = 0; i < arr.length; i++) {
    s = f(s, arr[i]);
  }
  return s;
});
/**
 * A sink that reduces its inputs using the provided function `f` starting from
 * the specified `initial` state.
 *
 * @category reducing
 * @since 4.0.0
 */
export const reduceArray = (initial, f) => fromTransform(upstream => {
  let state = initial();
  return upstream.pipe(Effect.flatMap(arr => {
    state = f(state, arr);
    return Effect.void;
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([state])));
});
/**
 * A sink that reduces its inputs using the provided effectful function `f`
 * starting from the specified `initial` state.
 *
 * @category reducing
 * @since 4.0.0
 */
export const reduceEffect = (initial, f) => reduceWhileEffect(initial, constTrue, f);
const head_ = /*#__PURE__*/reduceWhile(Option.none, Option.isNone, (_, in_) => Option.some(in_));
/**
 * Creates a sink containing the first value.
 *
 * @category constructors
 * @since 2.0.0
 */
export const head = () => head_;
const last_ = /*#__PURE__*/reduceArray(Option.none, (_, arr) => Arr.last(arr));
/**
 * Creates a sink containing the last value.
 *
 * @category constructors
 * @since 2.0.0
 */
export const last = () => last_;
/**
 * Creates a sink containing the first matching value.
 *
 * @category constructors
 * @since 4.0.0
 */
export const find = predicate => reduceWhile(Option.none, Option.isNone, (acc, in_) => predicate(in_) ? Option.some(in_) : acc);
/**
 * Creates a sink containing the first matching value.
 *
 * @category constructors
 * @since 2.0.0
 */
export const findEffect = predicate => reduceWhileEffect(Option.none, Option.isNone, (acc, in_) => Effect.map(predicate(in_), b => b ? Option.some(in_) : acc));
/**
 * Creates a sink which sums up its inputs.
 *
 * @category constructors
 * @since 2.0.0
 */
export const sum = /*#__PURE__*/reduceArray(() => 0, (s, arr) => {
  for (let i = 0; i < arr.length; i++) {
    s += arr[i];
  }
  return s;
});
/**
 * A sink that counts the number of elements fed to it.
 *
 * @category constructors
 * @since 2.0.0
 */
export const count = /*#__PURE__*/reduceArray(() => 0, (s, arr) => s + arr.length);
/**
 * Accumulates incoming elements into an array.
 *
 * @category constructors
 * @since 4.0.0
 */
export const collect = () => reduceArray(Arr.empty, (s, arr) => {
  s.push(...arr);
  return s;
});
/**
 * Collects the longest input prefix whose elements satisfy the predicate or
 * refinement.
 *
 * **Details**
 *
 * The first failing input is consumed and excluded from the result. Any later
 * elements from the same pulled array are returned as leftovers.
 *
 * @category constructors
 * @since 4.0.0
 */
export const takeWhile = predicate => fromTransform(upstream => {
  const out = Arr.empty();
  return upstream.pipe(Effect.flatMap(arr => {
    for (let i = 0; i < arr.length; i++) {
      if (!predicate(arr[i])) {
        const leftover = i + 1 < arr.length ? arr.slice(i + 1) : undefined;
        return Cause.done([out, leftover]);
      }
      out.push(arr[i]);
    }
    return Effect.void;
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(end => Effect.succeed(end ?? [out])));
});
/**
 * Applies a `Filter` to input elements while it succeeds, collecting each
 * successful output.
 *
 * **Details**
 *
 * The first input for which the filter fails is consumed and excluded from the
 * result. Any later elements from the same pulled array are returned as
 * leftovers.
 *
 * @category constructors
 * @since 4.0.0
 */
export const takeWhileFilter = filter => fromTransform(upstream => {
  const out = Arr.empty();
  return upstream.pipe(Effect.flatMap(arr => {
    for (let i = 0; i < arr.length; i++) {
      const result = filter(arr[i]);
      if (Result.isFailure(result)) {
        const leftover = i + 1 < arr.length ? arr.slice(i + 1) : undefined;
        return Cause.done([out, leftover]);
      }
      out.push(result.success);
    }
    return Effect.void;
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(end => Effect.succeed(end ?? [out])));
});
/**
 * Effectfully collects input elements while the predicate succeeds.
 *
 * **Details**
 *
 * The first input for which the predicate returns `false` is consumed and
 * excluded from the result. Any later elements from the same pulled array are
 * returned as leftovers.
 *
 * @category constructors
 * @since 4.0.0
 */
export const takeWhileEffect = predicate => fromTransform(upstream => {
  const out = Arr.empty();
  let leftover = undefined;
  return upstream.pipe(Effect.flatMap(arr => {
    let i = 0;
    return Effect.whileLoop({
      while: () => i < arr.length,
      body: constant(Effect.flatMap(Effect.suspend(() => {
        const input = arr[i++];
        return Effect.map(predicate(input), passes => [input, passes]);
      }), ([input, passes]) => {
        if (!passes) {
          if (i < arr.length) {
            leftover = arr.slice(i);
          }
          return Cause.done();
        }
        out.push(input);
        return Effect.void;
      })),
      step: constVoid
    });
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([out, leftover])));
});
/**
 * Effectfully applies a `FilterEffect` to input elements while it succeeds,
 * collecting each successful output.
 *
 * **Details**
 *
 * The first input for which the filter fails is consumed and excluded from the
 * result. Any later elements from the same pulled array are returned as
 * leftovers.
 *
 * @category constructors
 * @since 4.0.0
 */
export const takeWhileFilterEffect = filter => fromTransform(upstream => {
  const out = Arr.empty();
  let leftover = undefined;
  return upstream.pipe(Effect.flatMap(arr => {
    let i = 0;
    return Effect.whileLoop({
      while: () => i < arr.length,
      body: constant(Effect.flatMap(Effect.suspend(() => filter(arr[i++])), result => {
        if (Result.isFailure(result)) {
          if (i < arr.length) {
            leftover = arr.slice(i);
          }
          return Cause.done();
        }
        out.push(result.success);
        return Effect.void;
      })),
      step: constVoid
    });
  }), Effect.forever({
    disableYield: true
  }), Pull.catchDone(() => Effect.succeed([out, leftover])));
});
/**
 * Collects input elements until the predicate returns `true`, including the
 * matching element in the result.
 *
 * @category constructors
 * @since 4.0.0
 */
export const takeUntil = predicate => suspend(() => {
  let done = false;
  return takeWhile(i => {
    if (done) return false;
    done = predicate(i);
    return true;
  });
});
/**
 * Effectfully collects input elements until the predicate returns `true`,
 * including the matching element in the result.
 *
 * **Details**
 *
 * If the predicate effect fails, the sink fails with the same error.
 *
 * @category constructors
 * @since 4.0.0
 */
export const takeUntilEffect = predicate => suspend(() => {
  let done = false;
  return takeWhileEffect(input => {
    if (done) {
      return Effect.succeed(false);
    }
    return Effect.map(predicate(input), b => {
      done = b;
      return true;
    });
  });
});
/**
 * A sink that executes the provided effectful function for every item fed
 * to it.
 *
 * **Example** (Running effects for each item)
 *
 * ```ts
 * import { Console, Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that logs each item
 * const sink = Sink.forEach((item: number) => Console.log(`Processing: ${item}`))
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program)
 * // Output:
 * // Processing: 1
 * // Processing: 2
 * // Processing: 3
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const forEach = f => forEachArray(Effect.forEach(_ => f(_), {
  discard: true
}));
/**
 * A sink that executes the provided effectful function for every Chunk fed
 * to it.
 *
 * **Example** (Running effects for each chunk)
 *
 * ```ts
 * import { Console, Effect, Sink, Stream } from "effect"
 *
 * // Create a sink that processes chunks
 * const sink = Sink.forEachArray((chunk: ReadonlyArray<number>) =>
 *   Console.log(
 *     `Processing chunk of ${chunk.length} items: [${chunk.join(", ")}]`
 *   )
 * )
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3, 4, 5)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program)
 * // Output: Processing chunk of 5 items: [1, 2, 3, 4, 5]
 * ```
 *
 * @category constructors
 * @since 4.0.0
 */
export const forEachArray = f => fromTransform(upstream => upstream.pipe(Effect.flatMap(f), Effect.forever({
  disableYield: true
}), Pull.catchDone(() => endVoid)));
/**
 * Runs an effectful function for each input element while it returns `true`.
 *
 * **Details**
 *
 * The sink stops consuming input when the function returns `false` or when the
 * upstream stream ends, and completes with `void`.
 *
 * @category constructors
 * @since 2.0.0
 */
export const forEachWhile = f => forEachWhileArray(Effect.fnUntraced(function* (input) {
  for (let i = 0; i < input.length; i++) {
    const cont = yield* f(input[i]);
    if (!cont) return false;
  }
  return true;
}));
/**
 * Runs an effectful function for each non-empty input array while it returns
 * `true`.
 *
 * **Details**
 *
 * The sink stops consuming input when the function returns `false` or when the
 * upstream stream ends, and completes with `void`.
 *
 * @category constructors
 * @since 4.0.0
 */
export const forEachWhileArray = f => fromTransform(upstream => upstream.pipe(Effect.flatMap(f), Effect.flatMap(cont => cont ? Effect.void : Cause.done()), Effect.forever({
  disableYield: true
}), Pull.catchDone(() => endVoid)));
/**
 * Creates a sink produced from a scoped effect.
 *
 * **Example** (Unwrapping a sink effect)
 *
 * ```ts
 * import { Console, Effect, Sink, Stream } from "effect"
 *
 * // Create a sink from an effect that produces a sink
 * const sinkEffect = Effect.succeed(
 *   Sink.forEach((item: number) => Console.log(`Item: ${item}`))
 * )
 * const sink = Sink.unwrap(sinkEffect)
 *
 * // Use it with a stream
 * const stream = Stream.make(1, 2, 3)
 * const program = Stream.run(stream, sink)
 *
 * Effect.runPromise(program)
 * // Output:
 * // Item: 1
 * // Item: 2
 * // Item: 3
 * ```
 *
 * @category constructors
 * @since 2.0.0
 */
export const unwrap = effect => fromChannel(Channel.unwrap(Effect.map(effect, toChannel)));
/**
 * Summarize a sink by running an effect when the sink starts and again when
 * it completes.
 *
 * @category utils
 * @since 2.0.0
 */
export const summarized = /*#__PURE__*/dual(3, (self, summary, f) => fromTransform(Effect.fnUntraced(function* (upstream, scope) {
  const start = yield* summary;
  const [done, leftover] = yield* self.transform(upstream, scope);
  const end = yield* summary;
  return [[done, f(start, end)], leftover];
})));
/**
 * Returns the sink that executes this one and times its execution.
 *
 * @category utils
 * @since 2.0.0
 */
export const withDuration = self => summarized(self, Clock.currentTimeNanos, (start, end) => Duration.nanos(end - start));
/**
 * A sink that drains all input and returns the elapsed duration.
 *
 * @category constructors
 * @since 2.0.0
 */
export const timed = /*#__PURE__*/map(/*#__PURE__*/withDuration(drain), ([, duration]) => duration);
/**
 * Provides a `Context` to this sink.
 *
 * **Details**
 *
 * Services contained in the provided context are removed from the sink's
 * service requirements.
 *
 * @category services
 * @since 2.0.0
 */
export const provideContext = /*#__PURE__*/dual(2, (self, context) => fromTransform((upstream, scope) => self.transform(upstream, scope).pipe(Effect.provideContext(context))));
/**
 * Provides a single service implementation to this sink.
 *
 * **Details**
 *
 * The service identified by `key` is removed from the sink's service
 * requirements.
 *
 * @category services
 * @since 4.0.0
 */
export const provideService = /*#__PURE__*/dual(3, (self, key, value) => fromTransform((upstream, scope) => self.transform(upstream, scope).pipe(Effect.provideService(key, value))));
/**
 * Runs a fallback sink if this sink fails with a typed error.
 *
 * **Details**
 *
 * The fallback is built from the error and continues consuming from the same
 * upstream stream. If the upstream stream had already ended, the fallback sees
 * the upstream end instead.
 *
 * @category error handling
 * @since 2.0.0
 */
export const orElse = /*#__PURE__*/dual(2, (self, f) => fromTransform((upstream, scope) => {
  let upstreamDone = false;
  const pull = Effect.catchCause(upstream, cause => {
    upstreamDone = true;
    return Effect.failCause(cause);
  });
  return Effect.catch(self.transform(pull, scope), error => f(error).transform(Effect.suspend(() => {
    if (upstreamDone) {
      return Cause.done();
    }
    return upstream;
  }), scope));
}));
/**
 * Handles failures from this sink by inspecting the full `Cause`.
 *
 * **Details**
 *
 * When this sink fails, the handler effect is run and its success value
 * becomes the sink result. If the handler fails, the returned sink fails with
 * that error.
 *
 * @category error handling
 * @since 4.0.0
 */
export const catchCause = /*#__PURE__*/dual(2, (self, f) => transformEffect(self, Effect.catchCause(cause => Effect.map(f(cause), a2 => [a2]))));
const catch_ = /*#__PURE__*/dual(2, (self, f) => transformEffect(self, Effect.catch(error => Effect.map(f(error), a2 => [a2]))));
export {
/**
 * Handles typed errors from this sink with an effectful fallback value.
 *
 * @category error handling
 * @since 4.0.0
 */
catch_ as catch };
/**
 * Runs an effect after this sink completes, fails, or is interrupted.
 *
 * **Details**
 *
 * The effect receives the sink's `Exit` for the result value. The original
 * sink result and leftovers are preserved unless the finalizer itself fails.
 *
 * @category Finalization
 * @since 4.0.0
 */
export const onExit = /*#__PURE__*/dual(2, (self, f) => transformEffect(self, Effect.onExit(exit => f(Exit.map(exit, ([a]) => a)))));
/**
 * Runs a finalizer effect after this sink completes, fails, or is interrupted.
 *
 * **Details**
 *
 * The original sink result and leftovers are preserved unless the finalizer
 * itself fails.
 *
 * @category Finalization
 * @since 2.0.0
 */
export const ensuring = /*#__PURE__*/dual(2, (self, effect) => onExit(self, () => effect));
//# sourceMappingURL=Sink.js.map