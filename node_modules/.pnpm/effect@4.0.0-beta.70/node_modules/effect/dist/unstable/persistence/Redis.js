/**
 * Low-level Redis integration for the persistence modules.
 *
 * This module defines the `Redis` service used by Redis-backed persistence,
 * persisted queues, and rate limiter stores. It adapts an external Redis
 * connection to Effect through `send` for raw commands and `eval` for typed
 * Lua scripts that are loaded with `SCRIPT LOAD` and executed with `EVALSHA`.
 *
 * The service does not create or manage Redis connections; callers provide a
 * command sender from their Redis client or pool. Higher-level stores layer on
 * key prefixes and store ids, so choose stable prefixes to avoid collisions
 * and remember that schema or primary-key changes can make previously persisted
 * JSON values fail to decode. Finite TTLs in the persistence stores are applied
 * with millisecond Redis expirations, while non-finite TTLs are stored without
 * expiration. Script parameters are stringified before execution, and the
 * script descriptor's key count controls how Redis splits `KEYS` from `ARGV`.
 *
 * @since 4.0.0
 */
import * as Cache from "../../Cache.js";
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Equal from "../../Equal.js";
import { constant, identity } from "../../Function.js";
import * as Hash from "../../Hash.js";
import * as Schema from "../../Schema.js";
/**
 * Service for sending Redis commands and evaluating cached Lua scripts.
 *
 * @category services
 * @since 4.0.0
 */
export class Redis extends /*#__PURE__*/Context.Service()("effect/persistence/Redis") {}
/**
 * Creates a `Redis` service from a raw command sender.
 *
 * **Details**
 *
 * Lua scripts are loaded through `SCRIPT LOAD`, cached, and then invoked with
 * `EVALSHA`.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = /*#__PURE__*/Effect.fnUntraced(function* (options) {
  const scriptCache = yield* Cache.make({
    lookup: script => options.send("SCRIPT", "LOAD", script.lua),
    capacity: Number.POSITIVE_INFINITY
  });
  const eval_ = script => (...params) => Effect.flatMap(Cache.get(scriptCache, script), sha => options.send("EVALSHA", sha, script.numberOfKeys(...params).toString(), ...script.params(...params).map(param => String(param))));
  return identity({
    send: options.send,
    eval: eval_
  });
});
const ErrorTypeId = "~effect/persistence/Redis/RedisError";
/**
 * Error raised by Redis command or script execution.
 *
 * @category errors
 * @since 4.0.0
 */
export class RedisError extends /*#__PURE__*/Schema.ErrorClass(ErrorTypeId)({
  _tag: /*#__PURE__*/Schema.tag("RedisError"),
  cause: Schema.Defect
}) {
  /**
   * Marks this value as a Redis persistence error for runtime guards.
   *
   * @since 4.0.0
   */
  [ErrorTypeId] = ErrorTypeId;
}
const ScriptTypeId = "~effect/persistence/Redis/Script";
const ScriptProto = {
  [ScriptTypeId]: {
    params: identity,
    result: identity
  },
  withReturnType() {
    return this;
  },
  [Equal.symbol](that) {
    return this === that;
  },
  [Hash.symbol]() {
    return Hash.random(this);
  }
};
/**
 * Constructs a typed Redis Lua script descriptor.
 *
 * **Details**
 *
 * The result type defaults to `void` and can be refined with
 * `withReturnType`.
 *
 * @category Scripting
 * @since 4.0.0
 */
export const script = (f, options) => Object.assign(Object.create(ScriptProto), {
  ...options,
  params: f,
  numberOfKeys: typeof options.numberOfKeys === "number" ? constant(options.numberOfKeys) : options.numberOfKeys
});
//# sourceMappingURL=Redis.js.map