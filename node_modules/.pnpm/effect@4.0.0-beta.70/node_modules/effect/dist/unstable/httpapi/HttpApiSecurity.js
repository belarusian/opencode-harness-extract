/**
 * The `HttpApiSecurity` module defines the security scheme values used by
 * declarative HTTP APIs.
 *
 * Use these constructors when an API group or endpoint needs authentication
 * middleware for bearer tokens, API keys, or HTTP Basic credentials. The values
 * are intentionally small declarations: `HttpApiMiddleware.Service` attaches
 * them to middleware, `HttpApiBuilder` decodes the matching credential shape from
 * each request, and OpenAPI generation emits the corresponding
 * `components.securitySchemes` and operation security requirements.
 *
 * Common uses include modeling `Authorization: Bearer ...` tokens, Basic
 * username/password credentials, and API keys passed through headers, query
 * parameters, or cookies. Bearer tokens and API-key values are exposed to
 * middleware as `Redacted` values; Basic credentials expose the username with a
 * redacted password. Cookie API keys can also be written to responses with
 * `HttpApiBuilder.securitySetCookie`.
 *
 * A security scheme does not authenticate by itself: middleware must reject empty
 * or invalid credentials. Bearer and Basic schemes read the `Authorization`
 * header, while API-key headers use HTTP header name normalization and API-key
 * query or cookie names are matched exactly. OpenAPI annotations such as
 * descriptions and bearer formats affect generated documentation only; they do
 * not change runtime decoding.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.js";
import { dual } from "../../Function.js";
import { pipeArguments } from "../../Pipeable.js";
const TypeId = "~effect/httpapi/HttpApiSecurity";
const Proto = {
  [TypeId]: TypeId,
  pipe() {
    return pipeArguments(this, arguments);
  }
};
/**
 * Creates a Bearer token security scheme.
 *
 * **When to use**
 *
 * Use `HttpApiBuilder.middlewareSecurity` to implement API middleware for this
 * security scheme.
 *
 * @category constructors
 * @since 4.0.0
 */
export const bearer = /*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(Proto), {
  _tag: "Bearer",
  annotations: /*#__PURE__*/Context.empty()
});
/**
 * Creates an API key security scheme.
 *
 * **When to use**
 *
 * Use `HttpApiBuilder.middlewareSecurity` to implement API middleware for this
 * security scheme.
 *
 * **Details**
 *
 * Use `HttpApiBuilder.securitySetCookie` to set the correct cookie in a
 * handler. By default, `in` is `"header"`.
 *
 * @category constructors
 * @since 4.0.0
 */
export const apiKey = options => Object.assign(Object.create(Proto), {
  _tag: "ApiKey",
  key: options.key,
  in: options.in ?? "header",
  annotations: Context.empty()
});
/**
 * Creates an HTTP Basic authentication security scheme.
 *
 * **When to use**
 *
 * Use `HttpApiBuilder.middlewareSecurity` to implement API middleware for this
 * security scheme.
 *
 * @category constructors
 * @since 4.0.0
 */
export const basic = /*#__PURE__*/Object.assign(/*#__PURE__*/Object.create(Proto), {
  _tag: "Basic",
  annotations: /*#__PURE__*/Context.empty()
});
/**
 * Merges OpenAPI annotations into a security scheme.
 *
 * @category annotations
 * @since 4.0.0
 */
export const annotateMerge = /*#__PURE__*/dual(2, (self, annotations) => Object.assign(Object.create(Proto), {
  ...self,
  annotations: Context.merge(self.annotations, annotations)
}));
/**
 * Adds an OpenAPI annotation value to a security scheme.
 *
 * @category annotations
 * @since 4.0.0
 */
export const annotate = /*#__PURE__*/dual(3, (self, service, value) => Object.assign(Object.create(Proto), {
  ...self,
  annotations: Context.add(self.annotations, service, value)
}));
//# sourceMappingURL=HttpApiSecurity.js.map