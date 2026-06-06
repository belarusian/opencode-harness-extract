import * as Layer from "../../Layer.ts";
import type * as RpcSerialization from "../rpc/RpcSerialization.ts";
import { SocketServer } from "../socket/SocketServer.ts";
import type { MessageStorage } from "./MessageStorage.ts";
import type { RunnerHealth } from "./RunnerHealth.ts";
import type * as Runners from "./Runners.ts";
import type * as RunnerStorage from "./RunnerStorage.ts";
import type * as Sharding from "./Sharding.ts";
import type { ShardingConfig } from "./ShardingConfig.ts";
/**
 * Layer that runs a cluster runner over the socket RPC protocol, providing
 * `Sharding` and `Runners` clients and logging the socket listen address.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<Sharding.Sharding | Runners.Runners, never, Runners.RpcClientProtocol | ShardingConfig | RpcSerialization.RpcSerialization | SocketServer | MessageStorage | RunnerStorage.RunnerStorage | RunnerHealth>;
/**
 * Client-only socket runner layer that provides `Sharding` and `Runners` clients
 * without starting a runner server or receiving shard assignments.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerClientOnly: Layer.Layer<Sharding.Sharding | Runners.Runners, never, Runners.RpcClientProtocol | ShardingConfig | MessageStorage | RunnerStorage.RunnerStorage>;
//# sourceMappingURL=SocketRunner.d.ts.map