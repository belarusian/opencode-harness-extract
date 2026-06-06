/**
 * Helpers for passing a schema-encoded bootstrap message to worker-backed RPC
 * protocols.
 *
 * Worker RPC protocols can send one initial message when each worker starts,
 * before ordinary RPC requests begin flowing. Use this module to build and
 * provide that message from the client side, and to decode it inside the
 * worker-side server. Common payloads include per-worker configuration,
 * credentials or session metadata, feature flags, preloaded data, or
 * transferable resources such as `ArrayBuffer` and `MessagePort` values.
 *
 * The initial message uses the supplied schema's JSON codec and is posted as a
 * worker message, so it is separate from the normal `RpcSerialization` used for
 * RPC request and response traffic. Values still need to be valid for the
 * worker transport's structured clone boundary. Transferable annotations can
 * collect objects for the `postMessage` transfer list, but transferring moves
 * ownership to the worker and may detach buffers from the sender.
 *
 * @since 4.0.0
 */
import type { NoSuchElementError } from "../../Cause.ts";
import * as Context from "../../Context.ts";
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import * as Schema from "../../Schema.ts";
import type { Protocol } from "./RpcServer.ts";
declare const InitialMessage_base: Context.ServiceClass<InitialMessage, "effect/rpc/RpcWorker/InitialMessage", Effect.Effect<readonly [data: unknown, transfers: readonly Transferable[]], never, never>>;
/**
 * Context service that supplies the initial RPC worker message as encoded data
 * paired with any transferables that should be posted with it.
 *
 * @category initial message
 * @since 4.0.0
 */
export declare class InitialMessage extends InitialMessage_base {
}
/**
 * Types related to the encoded initial message exchanged with an RPC worker.
 *
 * @since 4.0.0
 */
export declare namespace InitialMessage {
    /**
     * Tagged wire representation of an RPC worker initial message after schema
     * encoding.
     *
     * @category initial message
     * @since 4.0.0
     */
    interface Encoded {
        readonly _tag: "InitialMessage";
        readonly value: unknown;
    }
}
/**
 * Runs an effect, encodes its result with the schema's JSON codec, and returns
 * the encoded value together with collected transferables.
 *
 * @category initial message
 * @since 4.0.0
 */
export declare const makeInitialMessage: <S extends Schema.Top, E, R2>(schema: S, effect: Effect.Effect<S["Type"], E, R2>) => Effect.Effect<readonly [data: unknown, transferables: ReadonlyArray<globalThis.Transferable>], E | Schema.SchemaError, S["EncodingServices"] | R2>;
/**
 * Provides the `InitialMessage` service from a schema and build effect,
 * capturing the layer context and dying if schema encoding fails.
 *
 * @category initial message
 * @since 4.0.0
 */
export declare const layerInitialMessage: <S extends Schema.Top, R2>(schema: S, build: Effect.Effect<S["Type"], never, R2>) => Layer.Layer<InitialMessage, never, S["EncodingServices"] | R2>;
/**
 * Reads the protocol initial message and decodes it with the supplied schema,
 * failing if no initial message is available or decoding fails.
 *
 * @category initial message
 * @since 4.0.0
 */
export declare const initialMessage: <S extends Schema.Top>(schema: S) => Effect.Effect<S["Type"], NoSuchElementError | Schema.SchemaError, Protocol | S["DecodingServices"]>;
export {};
//# sourceMappingURL=RpcWorker.d.ts.map