import * as Context from "../../Context.ts";
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import type * as Scope from "../../Scope.ts";
import * as Tracer from "../../Tracer.ts";
import * as Socket from "../socket/Socket.ts";
import * as DevToolsSchema from "./DevToolsSchema.ts";
declare const DevToolsClient_base: Context.ServiceClass<DevToolsClient, "effect/devtools/DevToolsClient", {
    readonly sendUnsafe: (_: DevToolsSchema.Span | DevToolsSchema.SpanEvent) => void;
}>;
/**
 * Service for sending span and span-event telemetry to the Effect devtools
 * connection.
 *
 * @category tags
 * @since 4.0.0
 */
export declare class DevToolsClient extends DevToolsClient_base {
}
/**
 * Creates a devtools client over the current `Socket`, speaking the devtools
 * NDJSON protocol, sending periodic pings, and responding to metrics snapshot
 * requests.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: Effect.Effect<DevToolsClient["Service"], never, Scope.Scope | Socket.Socket>;
/**
 * Layer that provides `DevToolsClient` using the current `Socket`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<DevToolsClient, never, Socket.Socket>;
/**
 * Creates a tracer that delegates to the current tracer while sending span
 * starts, span events, and span ends to `DevToolsClient`.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeTracer: Effect.Effect<Tracer.Tracer, never, DevToolsClient>;
/**
 * Layer that creates a `DevToolsClient` from the current `Socket` and installs
 * the devtools tracer.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerTracer: Layer.Layer<never, never, Socket.Socket>;
export {};
//# sourceMappingURL=DevToolsClient.d.ts.map