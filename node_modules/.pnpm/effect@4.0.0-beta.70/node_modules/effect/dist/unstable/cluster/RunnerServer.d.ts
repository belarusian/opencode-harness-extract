import * as Layer from "../../Layer.ts";
import * as RpcServer from "../rpc/RpcServer.ts";
import * as MessageStorage from "./MessageStorage.ts";
import * as RunnerHealth from "./RunnerHealth.ts";
import * as Runners from "./Runners.ts";
import type * as RunnerStorage from "./RunnerStorage.ts";
import * as Sharding from "./Sharding.ts";
import { ShardingConfig } from "./ShardingConfig.ts";
/**
 * Layer of RPC handlers for the runner protocol, forwarding ping, notify, effect,
 * stream, and envelope requests to `Sharding` and `MessageStorage`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerHandlers: Layer.Layer<import("../rpc/Rpc.ts").Handler<"Ping"> | import("../rpc/Rpc.ts").Handler<"Notify"> | import("../rpc/Rpc.ts").Handler<"Effect"> | import("../rpc/Rpc.ts").Handler<"Stream"> | import("../rpc/Rpc.ts").Handler<"Envelope">, never, MessageStorage.MessageStorage | Sharding.Sharding>;
/**
 * Creates the runner RPC server layer, which receives messages from other
 * runners, forwards them to the `Sharding` layer, and responds to `Ping`
 * requests.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<never, never, RpcServer.Protocol | Sharding.Sharding | MessageStorage.MessageStorage>;
/**
 * A `RunnerServer` layer that includes the `Runners` & `Sharding` clients.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerWithClients: Layer.Layer<Sharding.Sharding | Runners.Runners, never, RpcServer.Protocol | ShardingConfig | Runners.RpcClientProtocol | MessageStorage.MessageStorage | RunnerStorage.RunnerStorage | RunnerHealth.RunnerHealth>;
/**
 * Creates a client-only `Runners` layer.
 *
 * **When to use**
 *
 * Use this layer to embed a cluster client inside another Effect application
 * without registering with the ShardManager or receiving shard assignments.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerClientOnly: Layer.Layer<Sharding.Sharding | Runners.Runners, never, ShardingConfig | Runners.RpcClientProtocol | MessageStorage.MessageStorage | RunnerStorage.RunnerStorage>;
//# sourceMappingURL=RunnerServer.d.ts.map