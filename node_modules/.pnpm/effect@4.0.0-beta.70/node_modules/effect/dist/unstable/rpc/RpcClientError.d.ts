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
import * as Schema from "../../Schema.ts";
import { HttpClientErrorSchema } from "../http/HttpClientError.ts";
declare const TypeId = "~effect/rpc/RpcClientError";
declare const RpcClientDefect_base: Schema.Class<RpcClientDefect, Schema.Struct<{
    readonly _tag: Schema.tag<"RpcClientDefect">;
    readonly message: Schema.String;
    readonly cause: Schema.Defect;
}>, import("../../Cause.ts").YieldableError>;
/**
 * Represents a client-side RPC defect, such as a protocol violation or
 * decoding failure, with a message and original cause.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class RpcClientDefect extends RpcClientDefect_base {
}
declare const RpcClientError_base: Schema.Class<RpcClientError, Schema.Struct<{
    readonly _tag: Schema.tag<"RpcClientError">;
    readonly reason: Schema.Union<readonly [Schema.Union<[typeof import("../workers/WorkerError.ts").WorkerSpawnError, typeof import("../workers/WorkerError.ts").WorkerSendError, typeof import("../workers/WorkerError.ts").WorkerReceiveError, typeof import("../workers/WorkerError.ts").WorkerUnknownError]>, Schema.Union<readonly [typeof import("../socket/Socket.ts").SocketReadError, typeof import("../socket/Socket.ts").SocketWriteError, typeof import("../socket/Socket.ts").SocketOpenError, typeof import("../socket/Socket.ts").SocketCloseError]>, typeof HttpClientErrorSchema, typeof RpcClientDefect]>;
}>, import("../../Cause.ts").YieldableError>;
/**
 * The public RPC client error type, wrapping worker, socket, HTTP client, and
 * client protocol defect failures.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class RpcClientError extends RpcClientError_base {
    /**
     * Marks this value as an RPC client error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/rpc/RpcClientError";
    get message(): string;
}
export {};
//# sourceMappingURL=RpcClientError.d.ts.map