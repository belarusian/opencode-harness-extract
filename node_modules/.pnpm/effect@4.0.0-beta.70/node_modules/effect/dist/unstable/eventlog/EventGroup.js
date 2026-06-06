/**
 * Defines typed groups of event-log event definitions.
 *
 * Event groups describe the events that belong to one event-log domain, such as
 * commands for an aggregate, application workflow, or synced local store. Start
 * from `empty`, add event tags with their payload, success, and error schemas,
 * then use the group with `EventLog.group` to provide the handlers that execute
 * and commit those events.
 *
 * Each event tag becomes the key in the group's events record, so tags should be
 * unique within a group. The `primaryKey` function is part of the event
 * definition and should derive the stable partition key from the decoded
 * payload. Omitted schemas default to `Schema.Void` for payload and success, and
 * `Schema.Never` for errors; use `addError` when every event in the group shares
 * an additional error schema.
 *
 * @since 4.0.0
 */
import { pipeArguments } from "../../Pipeable.js";
import * as Predicate from "../../Predicate.js";
import * as Record from "../../Record.js";
import * as Event from "./Event.js";
/**
 * Runtime type identifier used to mark event log event groups.
 *
 * @category type IDs
 * @since 4.0.0
 */
export const TypeId = "~effect/eventlog/EventGroup";
/**
 * Returns `true` when a value is an event log event group.
 *
 * @category guards
 * @since 4.0.0
 */
export const isEventGroup = u => Predicate.hasProperty(u, TypeId);
const makeProto = options => {
  const EventGroupClass = _ => {};
  const group = Object.assign(EventGroupClass, {
    [TypeId]: TypeId,
    events: options.events,
    add(addOptions) {
      return makeProto({
        events: {
          ...this.events,
          [addOptions.tag]: Event.make(addOptions)
        }
      });
    },
    addError(error) {
      const events = Record.map(this.events, event => Event.addError(event, error));
      return makeProto({
        events
      });
    },
    pipe() {
      return pipeArguments(this, arguments);
    }
  });
  return group;
};
/**
 * Empty event group used as the starting point for defining a group.
 *
 * **When to use**
 *
 * Call `.add(...)` to add event definitions and build a typed `EventGroup`.
 *
 * @category constructors
 * @since 4.0.0
 */
export const empty = /*#__PURE__*/makeProto({
  events: /*#__PURE__*/Record.empty()
});
//# sourceMappingURL=EventGroup.js.map