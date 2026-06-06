/**
 * The `HttpRunner` module wires cluster runner RPCs to HTTP transports. It
 * provides client protocol layers for contacting runners over HTTP or
 * WebSocket, server-side HTTP effects for exposing runner RPC handlers, and
 * complete layers that install those routes into an `HttpRouter`.
 *
 * **Common tasks**
 *
 * - Serve runner RPC routes with {@link layerHttp} or {@link layerWebsocket}
 * - Configure client-only runner communication with {@link layerHttpClientOnly}
 *   or {@link layerWebsocketClientOnly}
 * - Use custom route paths with {@link layerHttpOptions},
 *   {@link layerWebsocketOptions}, {@link layerClientProtocolHttp}, or
 *   {@link layerClientProtocolWebsocket}
 *
 * **Transport gotchas**
 *
 * - Client protocol paths are appended to each runner address when building the
 *   target URL
 * - `https: true` switches HTTP clients from `http` to `https`, and WebSocket
 *   clients from `ws` to `wss`
 * - The default complete layers serve and connect at `/`; use the `Options`
 *   variants when your runner routes live under a different path
 *
 * @since 4.0.0
 */
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import type { Scope } from "../../Scope.ts";
import * as HttpClient from "../http/HttpClient.ts";
import * as HttpRouter from "../http/HttpRouter.ts";
import type * as HttpServer from "../http/HttpServer.ts";
import type { HttpServerRequest } from "../http/HttpServerRequest.ts";
import type { HttpServerResponse } from "../http/HttpServerResponse.ts";
import * as RpcSerialization from "../rpc/RpcSerialization.ts";
import * as Socket from "../socket/Socket.ts";
import type { MessageStorage } from "./MessageStorage.ts";
import type { RunnerHealth } from "./RunnerHealth.ts";
import * as Runners from "./Runners.ts";
import { RpcClientProtocol } from "./Runners.ts";
import type { RunnerStorage } from "./RunnerStorage.ts";
import * as Sharding from "./Sharding.ts";
import type * as ShardingConfig from "./ShardingConfig.ts";
/**
 * Provides a runner RPC client protocol that connects to runner addresses over
 * HTTP.
 *
 * **Details**
 *
 * The configured path is appended to each runner address, and `https` switches
 * the generated URL from `http` to `https`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerClientProtocolHttp: (options: {
    readonly path: string;
    readonly https?: boolean | undefined;
}) => Layer.Layer<RpcClientProtocol, never, RpcSerialization.RpcSerialization | HttpClient.HttpClient>;
/**
 * Default HTTP runner client protocol layer using path `/`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerClientProtocolHttpDefault: Layer.Layer<Runners.RpcClientProtocol, never, RpcSerialization.RpcSerialization | HttpClient.HttpClient>;
/**
 * Provides a runner RPC client protocol that connects to runner addresses over
 * WebSocket.
 *
 * **Details**
 *
 * The configured path is appended to each runner address, and `https` switches
 * the generated URL from `ws` to `wss`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerClientProtocolWebsocket: (options: {
    readonly path: string;
    readonly https?: boolean | undefined;
}) => Layer.Layer<RpcClientProtocol, never, RpcSerialization.RpcSerialization | Socket.WebSocketConstructor>;
/**
 * Default WebSocket runner client protocol layer using path `/`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerClientProtocolWebsocketDefault: Layer.Layer<Runners.RpcClientProtocol, never, RpcSerialization.RpcSerialization | Socket.WebSocketConstructor>;
/**
 * Builds an HTTP effect that serves runner RPCs over the HTTP protocol.
 *
 * **Details**
 *
 * The returned effect is produced from `RunnerServer.layerHandlers` and the
 * cluster runner RPC group.
 *
 * @category Http App
 * @since 4.0.0
 */
export declare const toHttpEffect: Effect.Effect<Effect.Effect<HttpServerResponse, never, Scope | HttpServerRequest>, never, Scope | RpcSerialization.RpcSerialization | Sharding.Sharding | MessageStorage>;
/**
 * Builds an HTTP effect that serves runner RPCs over WebSocket.
 *
 * **Details**
 *
 * The returned effect is produced from `RunnerServer.layerHandlers` and the
 * cluster runner RPC group.
 *
 * @category Http App
 * @since 4.0.0
 */
export declare const toHttpEffectWebsocket: Effect.Effect<Effect.Effect<HttpServerResponse, never, Scope | HttpServerRequest>, never, Scope | RpcSerialization.RpcSerialization | Sharding.Sharding | MessageStorage>;
/**
 * Layer that provides `Sharding` and `Runners` using the configured runner RPC
 * client protocol and storage services.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerClient: Layer.Layer<Sharding.Sharding | Runners.Runners, never, ShardingConfig.ShardingConfig | Runners.RpcClientProtocol | MessageStorage | RunnerStorage | RunnerHealth>;
/**
 * A HTTP layer for the `Runners` services, that adds a route to the provided
 * `HttpRouter`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerHttpOptions: (options: {
    readonly path: HttpRouter.PathInput;
}) => Layer.Layer<Sharding.Sharding | Runners.Runners, never, RunnerStorage | RunnerHealth | RpcSerialization.RpcSerialization | MessageStorage | ShardingConfig.ShardingConfig | Runners.RpcClientProtocol | HttpRouter.HttpRouter>;
/**
 * WebSocket layer for the `Runners` services that adds a route to the provided
 * `HttpRouter`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerWebsocketOptions: (options: {
    readonly path: HttpRouter.PathInput;
}) => Layer.Layer<Sharding.Sharding | Runners.Runners, never, ShardingConfig.ShardingConfig | Runners.RpcClientProtocol | MessageStorage | RunnerStorage | RunnerHealth | RpcSerialization.RpcSerialization | HttpRouter.HttpRouter>;
/**
 * Complete HTTP runner layer.
 *
 * **Details**
 *
 * It serves runner routes at `/` and configures runner clients to communicate
 * over HTTP.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerHttp: Layer.Layer<Sharding.Sharding | Runners.Runners, never, RpcSerialization.RpcSerialization | ShardingConfig.ShardingConfig | HttpClient.HttpClient | HttpServer.HttpServer | MessageStorage | RunnerStorage | RunnerHealth>;
/**
 * Client-only HTTP runner layer.
 *
 * **Details**
 *
 * It configures runner clients to communicate over HTTP without serving runner
 * HTTP routes.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerHttpClientOnly: Layer.Layer<Sharding.Sharding | Runners.Runners, never, RpcSerialization.RpcSerialization | ShardingConfig.ShardingConfig | HttpClient.HttpClient | MessageStorage | RunnerStorage>;
/**
 * Complete WebSocket runner layer.
 *
 * **Details**
 *
 * It serves runner routes at `/` and configures runner clients to communicate
 * over WebSocket.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerWebsocket: Layer.Layer<Sharding.Sharding | Runners.Runners, never, RpcSerialization.RpcSerialization | ShardingConfig.ShardingConfig | Socket.WebSocketConstructor | HttpServer.HttpServer | MessageStorage | RunnerStorage | RunnerHealth>;
/**
 * Client-only WebSocket runner layer.
 *
 * **Details**
 *
 * It configures runner clients to communicate over WebSocket without serving
 * runner WebSocket routes.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerWebsocketClientOnly: Layer.Layer<Sharding.Sharding | Runners.Runners, never, ShardingConfig.ShardingConfig | MessageStorage | RunnerStorage | RpcSerialization.RpcSerialization | Socket.WebSocketConstructor>;
//# sourceMappingURL=HttpRunner.d.ts.map