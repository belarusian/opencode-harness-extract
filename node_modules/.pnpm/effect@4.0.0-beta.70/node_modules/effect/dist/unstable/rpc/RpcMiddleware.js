/**
 * The `RpcMiddleware` module defines middleware services that can wrap RPC
 * handler execution on the server and request execution in generated clients.
 *
 * Use middleware to attach cross-cutting behavior to individual RPCs or whole
 * `RpcGroup`s, such as authentication, authorization, request logging, tracing,
 * metrics, rate limiting, header propagation, or adding request-scoped services
 * to the handler context. A middleware service records the services it requires
 * and provides, the schema for errors it can fail with, and whether clients must
 * install a matching middleware via `layerClient`.
 *
 * Server middleware receives the target `rpc`, decoded `payload`, request
 * `headers`, `requestId`, and `Rpc.ServerClient`, then wraps the handler effect.
 * Its `provides` type removes services from the downstream handler requirement,
 * while `requires` adds the services needed by the middleware implementation.
 * Middleware errors must be declared with a `Schema` so they can be encoded as
 * RPC failures, and any schema encoding or decoding services remain part of the
 * generated RPC environments.
 *
 * Client middleware is installed with `layerClient`, captures the surrounding
 * layer context, and can inspect, rewrite, retry, or short-circuit outgoing
 * requests before calling `next`. Set `requiredForClient` when an RPC's typed
 * client must require that `ForClient` layer; otherwise a client implementation
 * is used only when one is present. `clientError` contributes only to the
 * client-side call error channel, while the middleware `error` schema is shared
 * with server failures.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Layer from "../../Layer.js";
import * as Schema from "../../Schema.js";
import { Scope } from "../../Scope.js";
/**
 * The runtime type id used to attach and inspect RPC middleware metadata.
 *
 * @category type IDs
 * @since 4.0.0
 */
export const TypeId = "~effect/rpc/RpcMiddleware";
/**
 * Creates a typed RPC middleware service class, with optional service
 * requirements, provided services, error schema, and client-side requirement
 * metadata.
 *
 * @category tags
 * @since 4.0.0
 */
export const Service = () => (id, options) => {
  const Err = globalThis.Error;
  const limit = Err.stackTraceLimit;
  Err.stackTraceLimit = 2;
  const creationError = new Err();
  Err.stackTraceLimit = limit;
  function ServiceClass() {}
  const ServiceClass_ = ServiceClass;
  Object.setPrototypeOf(ServiceClass, Object.getPrototypeOf(Context.Service(id)));
  ServiceClass.key = id;
  Object.defineProperty(ServiceClass, "stack", {
    get() {
      return creationError.stack;
    }
  });
  ServiceClass_[TypeId] = TypeId;
  ServiceClass_.error = options?.error ?? Schema.Never;
  ServiceClass_.requiredForClient = options?.requiredForClient ?? false;
  return ServiceClass;
};
/**
 * Provides the client-side implementation for an RPC middleware service,
 * capturing the layer's environment and merging it into each middleware
 * invocation.
 *
 * @category client
 * @since 4.0.0
 */
export const layerClient = (tag, service) => Layer.effectContext(Effect.gen(function* () {
  const services = (yield* Effect.context()).pipe(Context.omit(Scope));
  const middleware = Effect.isEffect(service) ? yield* service : service;
  return Context.makeUnsafe(new Map([[`${tag.key}/Client`, options => Effect.updateContext(middleware(options), requestContext => Context.merge(services, requestContext))]]));
}));
//# sourceMappingURL=RpcMiddleware.js.map