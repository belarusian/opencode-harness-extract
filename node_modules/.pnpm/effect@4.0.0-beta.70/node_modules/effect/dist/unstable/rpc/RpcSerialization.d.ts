/**
 * Serialization support for the unstable RPC protocol.
 *
 * This module provides the `RpcSerialization` service used by RPC clients and
 * servers to encode and decode transport-level `RpcMessage` envelopes. Use the
 * built-in JSON, newline-delimited JSON, JSON-RPC 2.0, and MessagePack
 * implementations when wiring HTTP, sockets, workers, or custom transports, or
 * provide a custom service when a transport needs a different content type,
 * frame format, or binary codec.
 *
 * Serialization runs after RPC schemas have encoded payloads, successes,
 * failures, and stream chunks into transport-safe values, and before schemas
 * decode those values on the other side. Choose a format that can represent the
 * schema-encoded data: JSON is easy to inspect but needs schema encodings for
 * arbitrary binary values, while MessagePack is more compact and carries binary
 * data more naturally.
 *
 * Transport framing is significant. `json` and `jsonRpc` expect a complete
 * payload for each decode call and are intended for transports such as HTTP
 * that already delimit message bodies. `ndjson`, `ndJsonRpc`, and `msgPack`
 * maintain parser state for chunked streams, so they can decode multiple
 * messages or incomplete fragments from sockets and other streaming transports.
 * Match the serialization layer to the transport boundary, otherwise messages
 * may be buffered, split, or parsed at the wrong frame.
 *
 * @since 4.0.0
 */
import * as Msgpackr from "msgpackr";
import * as Context from "../../Context.ts";
import * as Layer from "../../Layer.ts";
declare const RpcSerialization_base: Context.ServiceClass<RpcSerialization, "effect/rpc/RpcSerialization", {
    makeUnsafe(): Parser;
    readonly contentType: string;
    readonly includesFraming: boolean;
}>;
/**
 * Service describing how RPC protocol messages are encoded and decoded,
 * including the content type and whether the serialization format provides
 * message framing.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare class RpcSerialization extends RpcSerialization_base {
}
/**
 * A stateful parser for an RPC serialization format, able to decode input
 * chunks into protocol messages and encode messages for transport.
 *
 * @category serialization
 * @since 4.0.0
 */
export interface Parser {
    readonly decode: (data: Uint8Array | string) => ReadonlyArray<unknown>;
    readonly encode: (response: unknown) => Uint8Array | string | undefined;
}
/**
 * JSON RPC serialization for whole message payloads. It does not include
 * message framing, so it is intended for transports that frame responses
 * themselves.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const json: RpcSerialization["Service"];
/**
 * Newline-delimited JSON RPC serialization that frames each protocol message
 * with a trailing newline.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const ndjson: RpcSerialization["Service"];
/**
 * Creates a JSON-RPC 2.0 serialization for RPC protocol messages without
 * additional message framing.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const jsonRpc: (options?: {
    readonly contentType?: string | undefined;
}) => RpcSerialization["Service"];
/**
 * Creates a newline-delimited JSON-RPC 2.0 serialization for RPC protocol
 * messages.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const ndJsonRpc: (options?: {
    readonly contentType?: string | undefined;
}) => RpcSerialization["Service"];
/**
 * Create a MessagePack serialization with custom msgpackr options.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const makeMsgPack: (options?: Msgpackr.Options | undefined) => RpcSerialization["Service"];
/**
 * Default MessagePack RPC serialization using record support and built-in
 * message framing.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const msgPack: RpcSerialization["Service"];
/**
 * A rpc serialization layer that uses JSON for serialization.
 *
 * **When to use**
 *
 * Use this if your protocol supports framing for messages, otherwise use
 * {@link layerNdjson}.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const layerJson: Layer.Layer<RpcSerialization>;
/**
 * A rpc serialization layer that uses NDJSON for serialization.
 *
 * **When to use**
 *
 * Use this if your protocol does not support framing for messages, otherwise
 * use {@link layerJson}.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const layerNdjson: Layer.Layer<RpcSerialization>;
/**
 * A rpc serialization layer that uses JSON-RPC for serialization.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const layerJsonRpc: (options?: {
    readonly contentType?: string | undefined;
}) => Layer.Layer<RpcSerialization>;
/**
 * A rpc serialization layer that uses JSON-RPC for serialization seperated by
 * new lines.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const layerNdJsonRpc: (options?: {
    readonly contentType?: string | undefined;
}) => Layer.Layer<RpcSerialization>;
/**
 * A rpc serialization layer that uses MessagePack for serialization.
 *
 * **Details**
 *
 * MessagePack has a more compact binary format compared to JSON and NDJSON. It
 * also has better support for binary data.
 *
 * @category serialization
 * @since 4.0.0
 */
export declare const layerMsgPack: Layer.Layer<RpcSerialization>;
export {};
//# sourceMappingURL=RpcSerialization.d.ts.map