/**
 * Utilities for marking the parts of worker messages that should be transferred
 * through `postMessage` instead of copied by the structured clone algorithm.
 *
 * This module is used with worker message schemas to collect
 * `globalThis.Transferable` values while encoding a message, so the worker
 * platform can pass the collected list as the `postMessage` transfer list.
 * Common cases include sending large `Uint8Array` payloads, `ImageData` pixel
 * buffers, or `MessagePort` channels without paying for an extra copy.
 *
 * Transferable annotations do not make an otherwise unsupported value
 * structured-cloneable; the encoded message still has to be valid for
 * `postMessage`. Transferring also moves ownership to the receiver, so buffers
 * are detached from the sender after the send completes. Be careful when a
 * typed array view shares a backing buffer with other data, since collecting
 * that buffer transfers ownership of the whole buffer.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.ts";
import * as Effect from "../../Effect.ts";
import * as Schema from "../../Schema.ts";
import * as Getter from "../../SchemaGetter.ts";
declare const Collector_base: Context.ServiceClass<Collector, "effect/workers/Transferable/Collector", {
    readonly addAll: (_: Iterable<globalThis.Transferable>) => Effect.Effect<void>;
    readonly addAllUnsafe: (_: Iterable<globalThis.Transferable>) => void;
    readonly read: Effect.Effect<Array<globalThis.Transferable>>;
    readonly readUnsafe: () => Array<globalThis.Transferable>;
    readonly clearUnsafe: () => Array<globalThis.Transferable>;
    readonly clear: Effect.Effect<Array<globalThis.Transferable>>;
}>;
/**
 * Service for collecting `Transferable` objects while encoding worker messages
 * so they can be passed to `postMessage` transfer lists.
 *
 * @category models
 * @since 4.0.0
 */
export declare class Collector extends Collector_base {
}
/**
 * Creates a mutable `Collector` service directly, exposing unsafe synchronous
 * methods for reading, adding, and clearing collected transferables.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeCollectorUnsafe: () => Collector["Service"];
/**
 * Effect that creates a fresh `Collector` service for accumulating
 * transferables.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeCollector: Effect.Effect<Collector["Service"]>;
/**
 * Adds transferables to the current `Collector` when one is present in the
 * context, and does nothing otherwise.
 *
 * @category accessors
 * @since 4.0.0
 */
export declare const addAll: (tranferables: Iterable<globalThis.Transferable>) => Effect.Effect<void>;
/**
 * Creates a schema getter that records transferables derived from a value in
 * the current `Collector` while passing the value through unchanged.
 *
 * @category Getter
 * @since 4.0.0
 */
export declare const getterAddAll: <A>(f: (_: A) => Iterable<globalThis.Transferable>) => Getter.Getter<A, A>;
/**
 * Schema wrapper whose encode path can record transferables with a `Collector`
 * while preserving the wrapped schema's decoded type.
 *
 * @category schemas
 * @since 4.0.0
 */
export interface Transferable<S extends Schema.Top> extends Schema.decodeTo<Schema.toType<S["Rebuild"]>, S["Rebuild"]> {
}
/**
 * Wraps a schema so encoding records transferables selected from the encoded
 * value, enabling worker messages to populate a `postMessage` transfer list.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const schema: {
    /**
     * Wraps a schema so encoding records transferables selected from the encoded
     * value, enabling worker messages to populate a `postMessage` transfer list.
     *
     * @category schemas
     * @since 4.0.0
     */
    <S extends Schema.Top>(f: (_: S["Encoded"]) => Iterable<globalThis.Transferable>): (self: S) => Transferable<S>;
    /**
     * Wraps a schema so encoding records transferables selected from the encoded
     * value, enabling worker messages to populate a `postMessage` transfer list.
     *
     * @category schemas
     * @since 4.0.0
     */
    <S extends Schema.Top>(self: S, f: (_: S["Encoded"]) => Iterable<globalThis.Transferable>): Transferable<S>;
};
/**
 * Transferable schema for `ImageData` values that records the underlying pixel
 * data buffer.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const ImageData: Transferable<Schema.declare<ImageData>>;
/**
 * Transferable schema for `MessagePort` values that records the port itself as
 * transferable.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const MessagePort: Transferable<Schema.declare<MessagePort>>;
/**
 * Transferable schema for `Uint8Array` values that records the array's backing
 * buffer.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const Uint8Array: Transferable<Schema.instanceOf<globalThis.Uint8Array<ArrayBuffer>>>;
export {};
//# sourceMappingURL=Transferable.d.ts.map