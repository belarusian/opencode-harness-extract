/**
 * The `SingleRunner` module provides a ready-to-use layer for running the
 * cluster sharding services in a single process. It wires together sharding,
 * message storage, runner registration, runner health, and sharding
 * configuration so durable entities and workflows can run without a fleet of
 * external runners.
 *
 * **Common tasks**
 *
 * - Start a local or embedded cluster runner backed by SQL message storage
 * - Run durable entities and workflows in development, tests, or small
 *   single-node deployments
 * - Choose SQL runner storage for persistence or in-memory runner storage for
 *   short-lived scenarios
 * - Override sharding configuration while still using the standard
 *   environment-based defaults
 *
 * **Gotchas**
 *
 * - The layer still requires a `SqlClient` because message storage is SQL-backed
 * - Runner health and runner coordination are no-op implementations, so this is
 *   for single-node use rather than multi-runner cluster coordination
 *
 * @since 4.0.0
 */
import * as Layer from "effect/Layer";
import * as RunnerHealth from "./RunnerHealth.js";
import * as Runners from "./Runners.js";
import * as RunnerStorage from "./RunnerStorage.js";
import * as Sharding from "./Sharding.js";
import * as ShardingConfig from "./ShardingConfig.js";
import * as SqlMessageStorage from "./SqlMessageStorage.js";
import * as SqlRunnerStorage from "./SqlRunnerStorage.js";
/**
 * A sql backed single-node cluster, that can be used for running durable
 * entities and workflows.
 *
 * @category layers
 * @since 4.0.0
 */
export const layer = options => Sharding.layer.pipe(Layer.provideMerge(Runners.layerNoop), Layer.provideMerge(SqlMessageStorage.layer), Layer.provide([options?.runnerStorage === "memory" ? RunnerStorage.layerMemory : Layer.orDie(SqlRunnerStorage.layer), RunnerHealth.layerNoop]), Layer.provide(ShardingConfig.layerFromEnv(options?.shardingConfig)));
//# sourceMappingURL=SingleRunner.js.map