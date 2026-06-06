/**
 * The `HttpApiMiddleware` module defines middleware services that can wrap
 * `HttpApi` endpoint execution on the server and request execution in generated
 * clients.
 *
 * Use this module for cross-cutting HTTP API behavior such as authentication and
 * authorization, request logging or tracing, rate limiting, adding request-scoped
 * services to the endpoint context, normalizing schema errors, or installing
 * client-side request middleware for APIs that require the same concern on both
 * sides. Middleware services carry type-level metadata describing the services
 * they require and provide, the error schemas they may fail with, whether they
 * implement security schemes, and whether generated clients must provide a
 * matching client middleware.
 *
 * Security middleware is declared with non-empty `security` schemes and receives
 * decoded credentials from `HttpApiSecurity`; ordinary middleware receives only
 * endpoint and group metadata. Error declarations must be `Schema` values (or an
 * array of them) because middleware failures are added to the endpoint error
 * surface and must be encodable by the HTTP API builder. If a middleware turns
 * `HttpApiSchemaError` failures into API errors, use
 * `layerSchemaErrorTransform` and make sure the transformed error is covered by
 * the middleware's declared schema. Client middleware installed with
 * `layerClient` is made available through the `ForClient` marker and captures
 * its surrounding context, so client requirements should be declared explicitly
 * when `requiredForClient` is enabled.
 *
 * @since 4.0.0
 */
/** @effect-diagnostics floatingEffect:skip-file */
/** @effect-diagnostics classSelfMismatch:off */
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Layer from "../../Layer.js";
import { hasProperty } from "../../Predicate.js";
import { Scope } from "../../Scope.js";
import { HttpApiSchemaError } from "./HttpApiError.js";
const TypeId = "~effect/httpapi/HttpApiMiddleware";
const SecurityTypeId = "~effect/httpapi/HttpApiMiddleware/Security";
/**
 * Returns `true` when an HTTP API middleware service is security middleware.
 *
 * @category guards
 * @since 4.0.0
 */
export const isSecurity = u => hasProperty(u, SecurityTypeId);
/**
 * Creates a `Context.Service` class for an HTTP API middleware implementation.
 *
 * **When to use**
 *
 * Use the optional configuration to declare required services, provided services,
 * typed error schemas, security schemes, client errors, and whether generated
 * clients must provide a matching client middleware.
 *
 * @category schemas
 * @since 4.0.0
 */
export const Service = () => (id, options) => {
  const Err = globalThis.Error;
  const limit = Err.stackTraceLimit;
  Err.stackTraceLimit = 2;
  const creationError = new Err();
  Err.stackTraceLimit = limit;
  class Service extends Context.Service()(id) {}
  const self = Service;
  Object.defineProperty(Service, "stack", {
    get() {
      return creationError.stack;
    }
  });
  self[TypeId] = TypeId;
  self.error = getError(options?.error);
  self.requiredForClient = options?.requiredForClient ?? false;
  if (options?.security !== undefined) {
    if (Object.keys(options.security).length === 0) {
      throw new Error("HttpApiMiddleware.Service: security object must not be empty");
    }
    self[SecurityTypeId] = SecurityTypeId;
    self.security = options.security;
  }
  return self;
};
function getError(error) {
  if (error === undefined) return new Set();
  return new Set(Array.isArray(error) ? error : [error]);
}
/**
 * Creates a middleware layer that transforms `HttpApiSchemaError` failures.
 *
 * **Details**
 *
 * The middleware catches schema errors produced while running an endpoint and uses
 * the supplied `transform` function to convert them into the middleware's declared
 * error schema.
 *
 * **Example** (Mapping schema errors to custom errors)
 *
 * ```ts
 * import { Effect, Schema } from "effect"
 * import { HttpApiMiddleware } from "effect/unstable/httpapi"
 *
 * export class CustomError extends Schema.TaggedErrorClass<CustomError>()("CustomError", {}) {}
 *
 * export class ErrorHandler extends HttpApiMiddleware.Service<ErrorHandler>()("api/ErrorHandler", {
 *   error: CustomError
 * }) {}
 *
 * export const ErrorHandlerLayer = HttpApiMiddleware.layerSchemaErrorTransform(
 *   ErrorHandler,
 *   (schemaError) =>
 *     Effect.log("Got SchemaError", schemaError).pipe(
 *       Effect.andThen(Effect.fail(new CustomError()))
 *     )
 * )
 * ```
 *
 * @category SchemaError transform
 * @since 4.0.0
 */
export const layerSchemaErrorTransform = (service, transform) => Layer.succeed(service, (httpEffect, options) => Effect.catch(httpEffect, e => HttpApiSchemaError.is(e) ? transform(e, options) : Effect.fail(e)));
/**
 * Provides a client-side middleware implementation for a middleware that is required by generated clients.
 *
 * **Details**
 *
 * The layer captures the surrounding services and makes the middleware available
 * through the `ForClient` service marker used by HTTP API clients.
 *
 * @category client
 * @since 4.0.0
 */
export const layerClient = (tag, service) => Layer.effectContext(Effect.gen(function* () {
  const services = (yield* Effect.context()).pipe(Context.omit(Scope));
  const middleware = Effect.isEffect(service) ? yield* service : service;
  return Context.makeUnsafe(new Map([[`${tag.key}/Client`, options => Effect.updateContext(middleware(options), requestContext => Context.merge(services, requestContext))]]));
}));
//# sourceMappingURL=HttpApiMiddleware.js.map