/**
 * Shared error types for the RPC client protocol layer.
 *
 * This module defines the client-side failures added to schema-aware RPC
 * clients. `RpcClientError` wraps transport failures from the built-in HTTP,
 * socket, and worker protocols, while `RpcClientDefect` records protocol
 * problems such as empty HTTP responses, malformed response batches, failed
 * transport decoding, or unexpected connection failures.
 *
 * These errors are separate from a remote handler's typed error. Remote
 * failures that match an RPC's error schema are decoded from the RPC exit and
 * remain part of the procedure's domain error channel. Server defects and
 * schema mismatches are not normal remote errors: they surface as defects or
 * protocol failures, so handlers commonly inspect `RpcClientError.reason` to
 * decide whether a failure is retryable transport trouble or an incompatible
 * client/server schema or serialization boundary.
 *
 * @since 4.0.0
 */
import * as Schema from "../../Schema.js";
import { HttpClientErrorSchema } from "../http/HttpClientError.js";
import { SocketErrorReason } from "../socket/Socket.js";
import { WorkerErrorReason } from "../workers/WorkerError.js";
const TypeId = "~effect/rpc/RpcClientError";
/**
 * Represents a client-side RPC defect, such as a protocol violation or
 * decoding failure, with a message and original cause.
 *
 * @category errors
 * @since 4.0.0
 */
export class RpcClientDefect extends /*#__PURE__*/Schema.ErrorClass("effect/rpc/RpcClientError/RpcClientDefect")({
  _tag: /*#__PURE__*/Schema.tag("RpcClientDefect"),
  message: Schema.String,
  cause: Schema.Defect
}) {}
/**
 * The public RPC client error type, wrapping worker, socket, HTTP client, and
 * client protocol defect failures.
 *
 * @category errors
 * @since 4.0.0
 */
export class RpcClientError extends /*#__PURE__*/Schema.ErrorClass(TypeId)({
  _tag: /*#__PURE__*/Schema.tag("RpcClientError"),
  reason: /*#__PURE__*/Schema.Union([WorkerErrorReason, SocketErrorReason, HttpClientErrorSchema, RpcClientDefect])
}) {
  /**
   * Marks this value as an RPC client error for runtime guards.
   *
   * @since 4.0.0
   */
  [TypeId] = TypeId;
  get message() {
    return `${this.reason._tag}: ${this.reason.message}`;
  }
}
//# sourceMappingURL=RpcClientError.js.map