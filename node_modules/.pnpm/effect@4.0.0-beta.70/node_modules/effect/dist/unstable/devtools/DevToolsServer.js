/**
 * Server-side helpers for exposing the Effect devtools protocol over a socket.
 *
 * This module is used by runtime integrations that want to accept devtools
 * clients, decode newline-delimited JSON protocol messages, and hand each
 * connected client to application-specific handling logic. It is most useful
 * for building a devtools endpoint that can inspect running fibers, spans, and
 * other telemetry described by `DevToolsSchema`.
 *
 * The server automatically responds to protocol `Ping` requests with `Pong`
 * responses. All other requests are delivered through the connected `Client`
 * queue, while responses should be written with `Client.send`. The queue is
 * shut down when the socket processing fiber terminates, so handlers should
 * treat it as connection-scoped state rather than a long-lived global channel.
 *
 * @since 4.0.0
 */
import * as Effect from "../../Effect.js";
import * as Queue from "../../Queue.js";
import * as Schema from "../../Schema.js";
import * as Stream from "../../Stream.js";
import * as Ndjson from "../encoding/Ndjson.js";
import * as Socket from "../socket/Socket.js";
import * as SocketServer from "../socket/SocketServer.js";
import * as DevToolsSchema from "./DevToolsSchema.js";
const RequestSchema = /*#__PURE__*/Schema.toCodecJson(DevToolsSchema.Request);
const ResponseSchema = /*#__PURE__*/Schema.toCodecJson(DevToolsSchema.Response);
/**
 * Runs the devtools socket server.
 *
 * **Details**
 *
 * Each connection is decoded as NDJSON devtools protocol messages, `Ping`
 * requests are answered with `Pong`, and all other requests are delivered
 * through the `Client` passed to the handler.
 *
 * @category constructors
 * @since 4.0.0
 */
export const run = /*#__PURE__*/Effect.fnUntraced(function* (handle) {
  const server = yield* SocketServer.SocketServer;
  return yield* server.run(Effect.fnUntraced(function* (socket) {
    const responses = yield* Queue.unbounded();
    const requests = yield* Queue.unbounded();
    const client = {
      queue: requests,
      send: response => Queue.offer(responses, response).pipe(Effect.asVoid)
    };
    yield* Stream.fromQueue(responses).pipe(Stream.pipeThroughChannel(Ndjson.duplexSchemaString(Socket.toChannelString(socket), {
      inputSchema: ResponseSchema,
      outputSchema: RequestSchema
    })), Stream.runForEach(request => request._tag === "Ping" ? Queue.offer(responses, {
      _tag: "Pong"
    }) : Queue.offer(requests, request)), Effect.ensuring(Queue.shutdown(responses).pipe(Effect.andThen(Queue.shutdown(requests)))), Effect.forkChild);
    return yield* handle(client);
  }));
});
//# sourceMappingURL=DevToolsServer.js.map