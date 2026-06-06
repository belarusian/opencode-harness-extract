/**
 * Utilities for HTTP trace-context propagation.
 *
 * This module converts Effect `Tracer.Span` values to outbound tracing headers
 * and decodes inbound propagation headers into `Tracer.ExternalSpan` parents.
 * It is used by traced HTTP clients to continue the current span across an
 * outbound request, and by server middleware to parent request spans from
 * upstream services. The helpers are also useful for adapters or middleware
 * that need to bridge Effect tracing with W3C Trace Context or B3-compatible
 * systems.
 *
 * Outbound propagation writes both W3C `traceparent` and compact B3 `b3`
 * headers. Inbound decoding prefers W3C `traceparent`, then compact B3, then
 * multi-header B3 (`x-b3-*`). Header names in `Headers.Headers` are expected to
 * be lowercase; use the safe header constructors when accepting raw platform
 * headers. Invalid or unsupported header shapes simply decode to `Option.none`,
 * so callers should treat missing trace context as "start a new trace" rather
 * than as an error.
 *
 * @since 4.0.0
 */
import * as Option from "../../Option.ts";
import * as Tracer from "../../Tracer.ts";
import * as Headers from "./Headers.ts";
/**
 * Function type for decoding tracing headers into an external span.
 *
 * **Details**
 *
 * Returns `Option.none` when the headers do not contain a supported or valid trace
 * context.
 *
 * @category models
 * @since 4.0.0
 */
export interface FromHeaders {
    (headers: Headers.Headers): Option.Option<Tracer.ExternalSpan>;
}
/**
 * Encodes a span into HTTP trace propagation headers.
 *
 * **Details**
 *
 * The generated headers include both compact B3 (`b3`) and W3C `traceparent`
 * formats.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare const toHeaders: (span: Tracer.Span) => Headers.Headers;
/**
 * Decodes an external span from HTTP trace propagation headers.
 *
 * **Details**
 *
 * W3C `traceparent` is tried first, followed by compact B3 (`b3`) and then
 * multi-header B3 (`x-b3-*`).
 *
 * @category decoding
 * @since 4.0.0
 */
export declare const fromHeaders: (headers: Headers.Headers) => Option.Option<Tracer.ExternalSpan>;
/**
 * Decodes an external span from the compact B3 `b3` header.
 *
 * **Details**
 *
 * Returns `Option.none` when the header is missing or does not contain trace and
 * span identifiers.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare const b3: FromHeaders;
/**
 * Decodes an external span from multi-header B3 propagation headers.
 *
 * **Details**
 *
 * The decoder reads `x-b3-traceid`, `x-b3-spanid`, and optional `x-b3-sampled`
 * headers.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare const xb3: FromHeaders;
/**
 * Decodes an external span from the W3C `traceparent` header.
 *
 * **Details**
 *
 * Only version `00` headers with valid trace and span identifiers are accepted.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare const w3c: FromHeaders;
//# sourceMappingURL=HttpTraceContext.d.ts.map