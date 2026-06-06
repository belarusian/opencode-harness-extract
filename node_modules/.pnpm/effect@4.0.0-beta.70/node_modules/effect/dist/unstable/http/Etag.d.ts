/**
 * Utilities for representing and generating HTTP entity tags.
 *
 * ETags are validators that identify a particular representation of a
 * resource. Servers commonly attach them to responses so clients and
 * intermediaries can revalidate cached content with conditional requests such
 * as `If-None-Match`, or protect updates with preconditions such as `If-Match`.
 *
 * This module models weak and strong ETags, formats them for the `ETag` header,
 * and provides generator layers that derive tags from file size and
 * modification-time metadata. Metadata-derived tags are convenient for static
 * files, but they are only as precise as the underlying metadata: choose strong
 * tags only when that metadata reliably changes for every byte-level change,
 * and use weak tags when the validator is suitable for cache revalidation but
 * not for operations that require byte-for-byte identity.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.ts";
import * as Effect from "../../Effect.ts";
import type * as FileSystem from "../../FileSystem.ts";
import * as Layer from "../../Layer.ts";
import type * as Body from "./HttpBody.ts";
/**
 * Represents an HTTP entity tag, either weak or strong.
 *
 * @category models
 * @since 4.0.0
 */
export type Etag = Weak | Strong;
/**
 * Weak HTTP entity tag.
 *
 * **Details**
 *
 * The `value` is the raw tag value without the surrounding quotes or `W/` prefix.
 *
 * @category models
 * @since 4.0.0
 */
export interface Weak {
    readonly _tag: "Weak";
    readonly value: string;
}
/**
 * Strong HTTP entity tag.
 *
 * **Details**
 *
 * The `value` is the raw tag value without the surrounding quotes.
 *
 * @category models
 * @since 4.0.0
 */
export interface Strong {
    readonly _tag: "Strong";
    readonly value: string;
}
/**
 * Formats an `Etag` as an HTTP header value, including quotes and the `W/` prefix for weak tags.
 *
 * @category convertions
 * @since 4.0.0
 */
export declare const toString: (self: Etag) => string;
declare const Generator_base: Context.ServiceClass<Generator, "effect/http/Etag/Generator", {
    readonly fromFileInfo: (info: FileSystem.File.Info) => Effect.Effect<Etag>;
    readonly fromFileWeb: (file: Body.HttpBody.FileLike) => Effect.Effect<Etag>;
}>;
/**
 * Service for generating ETags from filesystem file information or Web `File`-like metadata.
 *
 * @category models
 * @since 4.0.0
 */
export declare class Generator extends Generator_base {
}
/**
 * Layer that provides a `Generator` which produces strong ETags from file size and modification time metadata.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<Generator>;
/**
 * Layer that provides a `Generator` which produces weak ETags from file size and modification time metadata.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerWeak: Layer.Layer<Generator>;
export {};
//# sourceMappingURL=Etag.d.ts.map