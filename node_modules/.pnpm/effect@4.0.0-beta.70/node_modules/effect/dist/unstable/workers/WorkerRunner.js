/**
 * Server-side worker runner primitives shared by the browser, Node, and Bun
 * platform packages.
 *
 * A `WorkerRunnerPlatform` is installed in code that is already running inside
 * a worker-like runtime. Starting it yields a `WorkerRunner`, which listens for
 * parent or client requests, identifies each connection with a numeric port id,
 * and sends responses back through the same transport. The main Effect use case
 * is `RpcServer.layerProtocolWorkerRunner`, but platform adapters can also use
 * these types to expose lower-level request handlers for dedicated workers,
 * shared workers, worker threads, or child-process channels.
 *
 * The wire protocol is intentionally small: inbound messages are
 * `PlatformMessage` values where `[0, payload]` is a request and `[1]` closes a
 * port. Higher-level protocols are responsible for encoding request and
 * response payloads before they cross the worker boundary. Values must still be
 * accepted by the selected runtime's message mechanism, so structured-clone
 * support, transfer lists, `messageerror` events, and single-port runtimes such
 * as Node or Bun should be considered when choosing payload schemas and
 * resource lifetimes. Handler effects run on the runtime captured by `run`, so
 * services required by the handler must be provided to the running effect.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.js";
/**
 * Context service that starts a platform-specific `WorkerRunner`.
 *
 * @category models
 * @since 4.0.0
 */
export class WorkerRunnerPlatform extends /*#__PURE__*/Context.Service()("effect/workers/WorkerRunner/WorkerRunnerPlatform") {}
//# sourceMappingURL=WorkerRunner.js.map