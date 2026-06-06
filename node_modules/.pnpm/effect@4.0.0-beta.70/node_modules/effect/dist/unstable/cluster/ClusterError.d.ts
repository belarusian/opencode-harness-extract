/**
 * The `ClusterError` module defines the typed error values used by the
 * unstable cluster runtime when routing messages to entities, coordinating
 * runners, and persisting mailbox work.
 *
 * These errors are useful when implementing cluster transports, runner
 * supervision, mailbox storage, and entity request handling. They make common
 * distributed-system failures explicit: a message may reach a runner that no
 * longer owns the entity, a runner may be unavailable or unregistered, a
 * payload may fail to decode, persistence may fail, a mailbox may be at
 * capacity, or an envelope may already be in progress.
 *
 * **Gotchas**
 *
 * - Entity ownership and runner availability can change while messages are in
 *   flight, so routing errors should generally be treated as retryable or
 *   recoverable by higher-level cluster logic.
 * - `MalformedMessage` points to a schema/serialization boundary failure,
 *   while `PersistenceError` preserves failures from durable mailbox storage.
 * - `AlreadyProcessingMessage` protects an entity mailbox from processing the
 *   same envelope concurrently.
 *
 * @since 4.0.0
 */
import * as Cause from "../../Cause.ts";
import * as Effect from "../../Effect.ts";
import * as Schema from "../../Schema.ts";
import { EntityAddress } from "./EntityAddress.ts";
import { RunnerAddress } from "./RunnerAddress.ts";
import { SnowflakeFromString } from "./Snowflake.ts";
declare const TypeId = "~effect/cluster/ClusterError";
declare const EntityNotAssignedToRunner_base: Schema.Class<EntityNotAssignedToRunner, Schema.Struct<{
    readonly _tag: Schema.tag<"EntityNotAssignedToRunner">;
    readonly address: typeof EntityAddress;
}>, Cause.YieldableError>;
/**
 * Represents an error that occurs when a Runner receives a message for an entity
 * that it is not assigned to it.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class EntityNotAssignedToRunner extends EntityNotAssignedToRunner_base {
    /**
     * Marks this value as a cluster error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/ClusterError";
    /**
     * Returns `true` when the value is an `EntityNotAssignedToRunner` error.
     *
     * @since 4.0.0
     */
    static is(u: unknown): u is EntityNotAssignedToRunner;
}
declare const MalformedMessage_base: Schema.Class<MalformedMessage, Schema.Struct<{
    readonly _tag: Schema.tag<"MalformedMessage">;
    readonly cause: Schema.Defect;
}>, Cause.YieldableError>;
/**
 * Represents an error that occurs when a message fails to be properly
 * deserialized by an entity.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class MalformedMessage extends MalformedMessage_base {
    /**
     * Marks this value as a cluster error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/ClusterError";
    /**
     * Returns `true` when the value is a `MalformedMessage` error.
     *
     * @since 4.0.0
     */
    static is(u: unknown): u is MalformedMessage;
    /**
     * Maps failures from the supplied effect into `MalformedMessage` errors.
     *
     * @since 4.0.0
     */
    static refail: <A, E, R>(effect: Effect.Effect<A, E, R>) => Effect.Effect<A, MalformedMessage, R>;
}
declare const PersistenceError_base: Schema.Class<PersistenceError, Schema.Struct<{
    readonly _tag: Schema.tag<"PersistenceError">;
    readonly cause: Schema.Defect;
}>, Cause.YieldableError>;
/**
 * Represents an error that occurs when a message fails to be persisted into
 * cluster's mailbox storage.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class PersistenceError extends PersistenceError_base {
    /**
     * Marks this value as a cluster error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/ClusterError";
    /**
     * Maps failures from the supplied effect into `PersistenceError` values.
     *
     * @since 4.0.0
     */
    static refail<A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, PersistenceError, R>;
}
declare const RunnerNotRegistered_base: Schema.Class<RunnerNotRegistered, Schema.Struct<{
    readonly _tag: Schema.tag<"RunnerNotRegistered">;
    readonly address: typeof RunnerAddress;
}>, Cause.YieldableError>;
/**
 * Represents an error that occurs when a Runner is not registered with the shard
 * manager.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class RunnerNotRegistered extends RunnerNotRegistered_base {
    /**
     * Marks this value as a cluster error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/ClusterError";
}
declare const RunnerUnavailable_base: Schema.Class<RunnerUnavailable, Schema.Struct<{
    readonly _tag: Schema.tag<"RunnerUnavailable">;
    readonly address: typeof RunnerAddress;
}>, Cause.YieldableError>;
/**
 * Represents an error that occurs when a Runner is unresponsive.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class RunnerUnavailable extends RunnerUnavailable_base {
    /**
     * Marks this value as a cluster error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/ClusterError";
    /**
     * Returns `true` when the value is a `RunnerUnavailable` error.
     *
     * @since 4.0.0
     */
    static is(u: unknown): u is RunnerUnavailable;
}
declare const MailboxFull_base: Schema.Class<MailboxFull, Schema.Struct<{
    readonly _tag: Schema.tag<"MailboxFull">;
    readonly address: typeof EntityAddress;
}>, Cause.YieldableError>;
/**
 * Represents an error that occurs when the entities mailbox is full.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class MailboxFull extends MailboxFull_base {
    /**
     * Marks this value as a cluster error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/ClusterError";
    /**
     * Returns `true` when the value is a `MailboxFull` error.
     *
     * @since 4.0.0
     */
    static is(u: unknown): u is MailboxFull;
}
declare const AlreadyProcessingMessage_base: Schema.Class<AlreadyProcessingMessage, Schema.Struct<{
    readonly _tag: Schema.tag<"AlreadyProcessingMessage">;
    readonly envelopeId: SnowflakeFromString;
    readonly address: typeof EntityAddress;
}>, Cause.YieldableError>;
/**
 * Represents an error that occurs when the entity is already processing a
 * request.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class AlreadyProcessingMessage extends AlreadyProcessingMessage_base {
    /**
     * Marks this value as a cluster error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/ClusterError";
    /**
     * Returns `true` when the value is an `AlreadyProcessingMessage` error.
     *
     * @since 4.0.0
     */
    static is(u: unknown): u is AlreadyProcessingMessage;
}
export {};
//# sourceMappingURL=ClusterError.d.ts.map