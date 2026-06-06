/**
 * Defines typed event-log events for use with `EventLog` and event groups.
 *
 * An event definition names a durable domain event with a tag, derives the
 * aggregate or entity primary key from the payload, and records the schemas used
 * to encode the payload and decode handler success or failure values. These
 * definitions are the shared contract between clients that write events and
 * servers that register handlers, so they are useful for command-style writes,
 * replicated logs, audit trails, and workflows that need replayable domain
 * facts.
 *
 * Payloads are serialized with MessagePack, while success and error values are
 * described separately for the handler result. Keep payload schemas stable once
 * events have been persisted or replicated, prefer explicit versioned event tags
 * or backward-compatible schemas for changes, and make primary keys deterministic
 * so related entries are grouped consistently across stores and remotes.
 *
 * @since 4.0.0
 */
import { pipeArguments } from "../../Pipeable.js";
import * as Predicate from "../../Predicate.js";
import * as Schema from "../../Schema.js";
import * as Msgpack from "../encoding/Msgpack.js";
/**
 * Runtime type identifier used to mark event log event definitions.
 *
 * @category type IDs
 * @since 4.0.0
 */
export const TypeId = "~effect/eventlog/Event";
/**
 * Returns `true` when a value is an event log event definition.
 *
 * @category guards
 * @since 4.0.0
 */
export const isEvent = u => Predicate.hasProperty(u, TypeId);
const Proto = {
  [TypeId]: TypeId,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
export function make(options) {
  const payload = options.payload ?? Schema.Void;
  const success = options.success ?? Schema.Void;
  const error = options.error ?? Schema.Never;
  return Object.assign(Object.create(Proto), {
    tag: options.tag,
    primaryKey: options.primaryKey,
    payload,
    payloadMsgPack: Msgpack.schema(payload),
    success,
    error
  });
}
export function addError(event, error) {
  return make({
    tag: event.tag,
    primaryKey: event.primaryKey,
    payload: event.payload,
    success: event.success,
    error: Schema.Union([event.error, error])
  });
}
//# sourceMappingURL=Event.js.map