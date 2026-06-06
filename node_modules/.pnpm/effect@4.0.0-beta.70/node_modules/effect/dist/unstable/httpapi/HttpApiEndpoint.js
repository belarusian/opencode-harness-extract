/**
 * The `HttpApiEndpoint` module defines the per-route contracts used inside an
 * `HttpApiGroup`.
 *
 * An endpoint couples a stable name with an HTTP method and `HttpRouter` path,
 * plus schemas for path parameters, query parameters, headers, request payloads,
 * success responses, and declared errors. Server builders, generated clients,
 * and OpenAPI generation all read this metadata to decode requests, encode
 * responses, type handler inputs, and derive client call signatures.
 *
 * Use this module to declare individual operations such as `get`, `post`, `put`,
 * `patch`, `delete`, `head`, and `options`; attach endpoint-specific middleware
 * or annotations; and model alternatives for payloads, successes, and errors
 * with arrays of schemas.
 *
 * A few declaration details are worth keeping in mind. Paths use
 * `HttpRouter.PathInput`, so route parameters come from the router and are
 * decoded with the optional `params` schema. When codecs are enabled, params,
 * query, and headers are transformed through string-tree codecs; body methods
 * use JSON payload codecs by default, while no-body methods encode payloads as
 * query-style values. `HttpApiSchema` annotations can change payload or response
 * encodings and status codes, multipart payloads cannot be combined under the
 * same content type, and endpoint errors are merged with middleware errors for
 * server encoding and client decoding.
 *
 * @since 4.0.0
 */
import * as Arr from "../../Array.js";
import * as Context from "../../Context.js";
import { identity } from "../../Function.js";
import { pipeArguments } from "../../Pipeable.js";
import * as Predicate from "../../Predicate.js";
import * as Schema from "../../Schema.js";
import * as HttpRouter from "../http/HttpRouter.js";
import * as HttpApiSchema from "./HttpApiSchema.js";
const TypeId = "~effect/httpapi/HttpApiEndpoint";
/**
 * Returns `true` when a value is an `HttpApiEndpoint`, narrowing the value to the
 * endpoint interface.
 *
 * @category guards
 * @since 4.0.0
 */
export const isHttpApiEndpoint = u => Predicate.hasProperty(u, TypeId);
/** @internal */
export function getPayloadSchemas(endpoint) {
  const result = [];
  for (const {
    schemas
  } of endpoint.payload.values()) {
    result.push(...schemas);
  }
  return result;
}
/** @internal */
export function getSuccessSchemas(endpoint) {
  const schemas = Array.from(endpoint.success);
  return Arr.isArrayNonEmpty(schemas) ? schemas : [HttpApiSchema.NoContent];
}
/** @internal */
export function getErrorSchemas(endpoint) {
  const schemas = new Set(endpoint.error);
  for (const middleware of endpoint.middlewares) {
    const key = middleware;
    for (const schema of key.error) {
      schemas.add(schema);
    }
  }
  return Array.from(schemas);
}
const Proto = {
  [TypeId]: TypeId,
  pipe() {
    return pipeArguments(this, arguments);
  },
  prefix(prefix) {
    return makeProto({
      ...this,
      path: HttpRouter.prefixPath(this.path, prefix)
    });
  },
  middleware(middleware) {
    return makeProto({
      ...this,
      middlewares: new Set([...this.middlewares, middleware])
    });
  },
  annotate(key, value) {
    return makeProto({
      ...this,
      annotations: Context.add(this.annotations, key, value)
    });
  },
  annotateMerge(annotations) {
    return makeProto({
      ...this,
      annotations: Context.merge(this.annotations, annotations)
    });
  }
};
function makeProto(options) {
  return Object.assign(Object.create(Proto), options);
}
/**
 * Creates endpoint constructors for a specific HTTP method. The resulting
 * constructor builds an `HttpApiEndpoint` from a name, path, and optional request
 * and response schemas, applying automatic JSON or string-tree codecs unless
 * `disableCodecs` is enabled.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = method => (name, path, options) => {
  const disableCodecs = options?.disableCodecs ?? false;
  const transformStringTree = disableCodecs ? identity : Schema.toCodecStringTree;
  return makeProto({
    name,
    path,
    method,
    params: ensureStruct(options?.params, transformStringTree),
    query: ensureStruct(options?.query, transformStringTree),
    headers: ensureStruct(options?.headers, transformStringTree),
    payload: getPayload(options?.payload, method, disableCodecs),
    success: getResponse(options?.success, disableCodecs),
    error: getResponse(options?.error, disableCodecs),
    annotations: Context.empty(),
    middlewares: new Set()
  });
};
function ensureStruct(params, transform) {
  if (params === undefined) return undefined;
  if (Schema.isSchema(params)) return transform(params);
  return transform(Schema.Struct(params));
}
function getPayload(payload, method, disableCodecs) {
  const result = new Map();
  if (payload === undefined) return result;
  const schemas = Array.isArray(payload) ? payload : Schema.isSchema(payload) ? [payload] : [Schema.Struct(payload).pipe(HttpApiSchema.asFormUrlEncoded())];
  const transform = disableCodecs ? identity : transformPayload;
  for (const schema of schemas) {
    const encoding = HttpApiSchema.getPayloadEncoding(schema.ast, method);
    const existing = result.get(encoding.contentType);
    if (existing) {
      if (existing.encoding._tag !== encoding._tag) {
        throw new Error(`Multiple payload encodings for content-type: ${encoding.contentType}`);
      }
      if (existing.encoding._tag === "Multipart") {
        throw new Error(`Multiple multipart payloads for content-type: ${encoding.contentType}`);
      }
      existing.schemas.push(transform(schema, method));
    } else {
      result.set(encoding.contentType, {
        encoding,
        schemas: [transform(schema, method)]
      });
    }
  }
  return result;
}
function getResponse(success, disableCodecs) {
  if (success === undefined) return new Set();
  const arr = Arr.ensure(success);
  return new Set(disableCodecs ? arr : arr.map(transformResponse));
}
function transformResponse(schema) {
  const encoding = HttpApiSchema.getResponseEncoding(schema.ast);
  switch (encoding._tag) {
    case "Json":
      return Schema.toCodecJson(schema);
    case "FormUrlEncoded":
      return Schema.toCodecStringTree(schema);
    case "Text":
    case "Uint8Array":
      return schema;
  }
}
function transformPayload(schema, method) {
  const encoding = HttpApiSchema.getPayloadEncoding(schema.ast, method);
  switch (encoding._tag) {
    case "Json":
      return Schema.toCodecJson(schema);
    case "FormUrlEncoded":
      return Schema.toCodecStringTree(schema);
    case "Text":
    case "Uint8Array":
    case "Multipart":
      return schema;
  }
}
/**
 * Creates a `GET` endpoint declaration.
 *
 * @category constructors
 * @since 4.0.0
 */
export const get = /*#__PURE__*/make("GET");
/**
 * Creates a `POST` endpoint declaration.
 *
 * @category constructors
 * @since 4.0.0
 */
export const post = /*#__PURE__*/make("POST");
/**
 * Creates a `PUT` endpoint declaration.
 *
 * @category constructors
 * @since 4.0.0
 */
export const put = /*#__PURE__*/make("PUT");
/**
 * Creates a `PATCH` endpoint declaration.
 *
 * @category constructors
 * @since 4.0.0
 */
export const patch = /*#__PURE__*/make("PATCH");
const del = /*#__PURE__*/make("DELETE");
export {
/**
 * Creates a `DELETE` endpoint declaration.
 *
 * @category constructors
 * @since 4.0.0
 */
del as delete };
/**
 * Creates a `HEAD` endpoint declaration.
 *
 * @category constructors
 * @since 4.0.0
 */
export const head = /*#__PURE__*/make("HEAD");
/**
 * Creates an `OPTIONS` endpoint declaration.
 *
 * @category constructors
 * @since 4.0.0
 */
export const options = /*#__PURE__*/make("OPTIONS");
//# sourceMappingURL=HttpApiEndpoint.js.map