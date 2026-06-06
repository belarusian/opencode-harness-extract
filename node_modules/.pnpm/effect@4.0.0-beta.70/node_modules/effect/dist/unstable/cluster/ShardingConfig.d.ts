/**
 * The `ShardingConfig` module defines the configuration used by a cluster
 * runner to participate in Effect Cluster sharding. It describes how a runner is
 * addressed by other runners, which shard groups it can host, how many shards
 * are assigned per group, and the timing settings used for locks, assignment
 * refreshes, health checks, entity lifecycle, and message polling.
 *
 * Use this module when wiring a sharded application locally with
 * {@link layer}, loading deployment settings from environment variables with
 * {@link layerFromEnv}, or overriding selected defaults for tests and
 * single-node development. In production, keep cluster-wide values such as
 * `shardsPerGroup` and shard groups consistent across runners, choose stable
 * externally reachable runner addresses, and tune lock expiration and refresh
 * intervals to match the storage backend and shutdown behavior of the
 * deployment platform.
 *
 * @since 4.0.0
 */
import * as Config from "../../Config.ts";
import * as Context from "../../Context.ts";
import * as Duration from "../../Duration.ts";
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import * as Option from "../../Option.ts";
import { RunnerAddress } from "./RunnerAddress.ts";
declare const ShardingConfig_base: Context.ServiceClass<ShardingConfig, "effect/cluster/ShardingConfig", {
    /**
     * The address for the current runner that other runners can use to
     * communicate with it.
     *
     * If `None`, the runner is not part of the cluster and will be in a client-only
     * mode.
     */
    readonly runnerAddress: Option.Option<RunnerAddress>;
    /**
     * The listen address for the current runner.
     *
     * Defaults to the `runnerAddress`.
     */
    readonly runnerListenAddress: Option.Option<RunnerAddress>;
    /**
     * A number that determines how many shards this runner will be assigned
     * relative to other runners.
     *
     * Defaults to `1`.
     *
     * A value of `2` means that this runner should be assigned twice as many
     * shards as a runner with a weight of `1`.
     */
    readonly runnerShardWeight: number;
    /**
     * The shard groups available across all runners.
     *
     * Defaults to `["default"]`.
     */
    readonly availableShardGroups: ReadonlyArray<string>;
    /**
     * The shard groups that are assigned to this runner.
     *
     * Defaults to `["default"]`.
     */
    readonly assignedShardGroups: ReadonlyArray<string>;
    /**
     * The number of shards to allocate per shard group.
     *
     * **Note**: this value should be consistent across all runners.
     */
    readonly shardsPerGroup: number;
    /**
     * Shard lock refresh interval.
     */
    readonly shardLockRefreshInterval: Duration.Input;
    /**
     * Shard lock expiration duration.
     */
    readonly shardLockExpiration: Duration.Input;
    /**
     * Disable the use of advisory locks for shard locking.
     */
    readonly shardLockDisableAdvisory: boolean;
    /**
     * Start shutting down as soon as an Entity has started shutting down.
     *
     * Defaults to `true`.
     */
    readonly preemptiveShutdown: boolean;
    /**
     * The default capacity of the mailbox for entities.
     */
    readonly entityMailboxCapacity: number | "unbounded";
    /**
     * The maximum duration of inactivity (i.e. without receiving a message)
     * after which an entity will be interrupted.
     */
    readonly entityMaxIdleTime: Duration.Input;
    /**
     * If an entity does not register itself within this time after a message is
     * sent to it, the message will be marked as failed.
     *
     * Defaults to 1 minute.
     */
    readonly entityRegistrationTimeout: Duration.Input;
    /**
     * The maximum duration of time to wait for an entity to terminate.
     *
     * By default this is set to 15 seconds to stay within kubernetes defaults.
     */
    readonly entityTerminationTimeout: Duration.Input;
    /**
     * The interval at which to poll for unprocessed messages from storage.
     */
    readonly entityMessagePollInterval: Duration.Input;
    /**
     * The interval at which to poll for client replies from storage.
     */
    readonly entityReplyPollInterval: Duration.Input;
    /**
     * The interval at which to poll for new runners and refresh shard
     * assignments.
     */
    readonly refreshAssignmentsInterval: Duration.Input;
    /**
     * The interval to retry a send if EntityNotAssignedToRunner is returned.
     */
    readonly sendRetryInterval: Duration.Input;
    /**
     * The interval at which to check for unhealthy runners and report them
     */
    readonly runnerHealthCheckInterval: Duration.Input;
    /**
     * Simulate serialization and deserialization to remote runners for local
     * entities.
     */
    readonly simulateRemoteSerialization: boolean;
}>;
/**
 * Represents the configuration for the `Sharding` service on a given runner.
 *
 * @category models
 * @since 4.0.0
 */
export declare class ShardingConfig extends ShardingConfig_base {
}
/**
 * Default values for `ShardingConfig`, including the default local runner address,
 * shard group, shard count, mailbox settings, polling intervals, and remote
 * serialization simulation.
 *
 * @category defaults
 * @since 4.0.0
 */
export declare const defaults: ShardingConfig["Service"];
/**
 * Creates a `ShardingConfig` layer by merging the provided partial options over
 * `defaults`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: (options?: Partial<ShardingConfig["Service"]>) => Layer.Layer<ShardingConfig>;
/**
 * Layer that provides the default `ShardingConfig` values.
 *
 * @category defaults
 * @since 4.0.0
 */
export declare const layerDefaults: Layer.Layer<ShardingConfig>;
/**
 * Config descriptor for loading `ShardingConfig` values, applying the same
 * defaults used by the in-memory `defaults` object.
 *
 * @category Config
 * @since 4.0.0
 */
export declare const config: Config.Config<ShardingConfig["Service"]>;
/**
 * Effect that loads `ShardingConfig` from environment variables using the
 * constant-case config provider.
 *
 * @category Config
 * @since 4.0.0
 */
export declare const configFromEnv: Effect.Effect<{
    /**
     * The address for the current runner that other runners can use to
     * communicate with it.
     *
     * If `None`, the runner is not part of the cluster and will be in a client-only
     * mode.
     */
    readonly runnerAddress: Option.Option<RunnerAddress>;
    /**
     * The listen address for the current runner.
     *
     * Defaults to the `runnerAddress`.
     */
    readonly runnerListenAddress: Option.Option<RunnerAddress>;
    /**
     * A number that determines how many shards this runner will be assigned
     * relative to other runners.
     *
     * Defaults to `1`.
     *
     * A value of `2` means that this runner should be assigned twice as many
     * shards as a runner with a weight of `1`.
     */
    readonly runnerShardWeight: number;
    /**
     * The shard groups available across all runners.
     *
     * Defaults to `["default"]`.
     */
    readonly availableShardGroups: ReadonlyArray<string>;
    /**
     * The shard groups that are assigned to this runner.
     *
     * Defaults to `["default"]`.
     */
    readonly assignedShardGroups: ReadonlyArray<string>;
    /**
     * The number of shards to allocate per shard group.
     *
     * **Note**: this value should be consistent across all runners.
     */
    readonly shardsPerGroup: number;
    /**
     * Shard lock refresh interval.
     */
    readonly shardLockRefreshInterval: Duration.Input;
    /**
     * Shard lock expiration duration.
     */
    readonly shardLockExpiration: Duration.Input;
    /**
     * Disable the use of advisory locks for shard locking.
     */
    readonly shardLockDisableAdvisory: boolean;
    /**
     * Start shutting down as soon as an Entity has started shutting down.
     *
     * Defaults to `true`.
     */
    readonly preemptiveShutdown: boolean;
    /**
     * The default capacity of the mailbox for entities.
     */
    readonly entityMailboxCapacity: number | "unbounded";
    /**
     * The maximum duration of inactivity (i.e. without receiving a message)
     * after which an entity will be interrupted.
     */
    readonly entityMaxIdleTime: Duration.Input;
    /**
     * If an entity does not register itself within this time after a message is
     * sent to it, the message will be marked as failed.
     *
     * Defaults to 1 minute.
     */
    readonly entityRegistrationTimeout: Duration.Input;
    /**
     * The maximum duration of time to wait for an entity to terminate.
     *
     * By default this is set to 15 seconds to stay within kubernetes defaults.
     */
    readonly entityTerminationTimeout: Duration.Input;
    /**
     * The interval at which to poll for unprocessed messages from storage.
     */
    readonly entityMessagePollInterval: Duration.Input;
    /**
     * The interval at which to poll for client replies from storage.
     */
    readonly entityReplyPollInterval: Duration.Input;
    /**
     * The interval at which to poll for new runners and refresh shard
     * assignments.
     */
    readonly refreshAssignmentsInterval: Duration.Input;
    /**
     * The interval to retry a send if EntityNotAssignedToRunner is returned.
     */
    readonly sendRetryInterval: Duration.Input;
    /**
     * The interval at which to check for unhealthy runners and report them
     */
    readonly runnerHealthCheckInterval: Duration.Input;
    /**
     * Simulate serialization and deserialization to remote runners for local
     * entities.
     */
    readonly simulateRemoteSerialization: boolean;
}, Config.ConfigError, never>;
/**
 * Layer that loads `ShardingConfig` from environment variables and, when options
 * are provided, overlays those options on top of the loaded values.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerFromEnv: (options?: Partial<ShardingConfig["Service"]> | undefined) => Layer.Layer<ShardingConfig, Config.ConfigError>;
/**
 * Normalizes the provided `ShardingConfig` to calculate the `available` and
 * `assigned` shard groups.
 *
 * @category Shard groups
 * @since 4.0.0
 */
export declare const shardGroupConfig: (config: ShardingConfig["Service"]) => {
    readonly available: ReadonlySet<string>;
    readonly assigned: ReadonlySet<string>;
};
export {};
//# sourceMappingURL=ShardingConfig.d.ts.map