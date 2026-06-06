/**
 * The `RpcSchema` module contains the RPC-specific schema markers and cause
 * annotations shared by the RPC declaration, client, and server layers. It is
 * used when an RPC response is a `Stream`, and when server-side interruption
 * logic needs to identify a client-initiated abort.
 *
 * Use {@link Stream} to mark an RPC success schema as a streamed response,
 * {@link isStreamSchema} to detect that marker, and the stored success and
 * error schemas to encode or decode stream chunks. Request payload schemas live
 * on the `Rpc` definition itself; this module only describes the streamed
 * response shape. For streaming RPCs, the success schema passed to
 * `RpcSchema.Stream` is the stream element schema, while the error schema is
 * the stream error schema. When the marker is installed by the `Rpc`
 * constructor's `stream` option, the immediate RPC exit succeeds with `void`,
 * the ordinary RPC error schema is set to `Schema.Never`, and the stream error
 * schema is used for stream failures.
 *
 * Streaming schemas are not general-purpose codecs for arbitrary stream values:
 * they are RPC metadata that lets the protocol distinguish one-shot successes
 * from streamed elements and keep stream errors on the chunk stream. Use
 * {@link ClientAbort} when annotating interruptions caused by a remote client
 * closing or cancelling a request.
 *
 * @since 4.0.0
 */
import * as Cause from "../../Cause.js";
import * as Context from "../../Context.js";
import { constUndefined } from "../../Function.js";
import * as Option from "../../Option.js";
import * as Predicate from "../../Predicate.js";
import * as Schema from "../../Schema.js";
import * as Stream_ from "../../Stream.js";
const StreamSchemaTypeId = "~effect/rpc/RpcSchema/StreamSchema";
/**
 * Returns `true` when a schema is an RPC stream schema created by
 * `RpcSchema.Stream`.
 *
 * @category Stream
 * @since 4.0.0
 */
export function isStreamSchema(schema) {
  return Predicate.hasProperty(schema, StreamSchemaTypeId);
}
/** @internal */
export function getStreamSchemas(schema) {
  return isStreamSchema(schema) ? Option.some({
    success: schema.success,
    error: schema.error
  }) : Option.none();
}
const schema = /*#__PURE__*/Schema.declare(Stream_.isStream);
/**
 * Creates an RPC stream schema from a stream element success schema and stream
 * error schema.
 *
 * @category Stream
 * @since 4.0.0
 */
export function Stream(success, error) {
  return Schema.make(schema.ast, {
    [StreamSchemaTypeId]: StreamSchemaTypeId,
    success,
    error
  });
}
/**
 * Cause annotation used to mark interruptions that originate from an RPC client
 * abort.
 *
 * @category Cause annotations
 * @since 4.0.0
 */
export class ClientAbort extends /*#__PURE__*/Context.Service()("effect/rpc/RpcSchema/ClientAbort") {
  static annotation = /*#__PURE__*/this.context(true).pipe(/*#__PURE__*/Context.add(Cause.StackTrace, {
    name: "ClientAbort",
    stack: constUndefined,
    parent: undefined
  }));
}
//# sourceMappingURL=RpcSchema.js.map