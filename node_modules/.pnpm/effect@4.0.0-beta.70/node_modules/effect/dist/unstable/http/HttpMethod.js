/**
 * Defines the supported HTTP method literals shared by the unstable HTTP client,
 * server, and routing APIs.
 *
 * Use this module when constructing method-specific requests, matching incoming
 * requests, validating unknown method values, or deriving method helper names.
 * Methods are represented as uppercase string literals, so values such as `"get"`
 * are not accepted as `HttpMethod` values.
 *
 * The body classification is intentionally conservative and file-specific:
 * `GET`, `HEAD`, `OPTIONS`, and `TRACE` are modeled as bodyless methods, while
 * `POST`, `PUT`, `DELETE`, and `PATCH` are modeled as methods that can carry a
 * request body. This means `DELETE` is allowed to carry a body even though some
 * servers and intermediaries may ignore it, and `GET` request bodies are not
 * represented by these helpers even though the wire protocol does not strictly
 * forbid them.
 *
 * @since 4.0.0
 */
/**
 * Returns `true` when a method can carry a request body and narrows it to `HttpMethod.WithBody`.
 *
 * @category predicates
 * @since 4.0.0
 */
export const hasBody = method => method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && method !== "TRACE";
/**
 * Set containing every supported `HttpMethod` literal.
 *
 * @category models
 * @since 4.0.0
 */
export const all = /*#__PURE__*/new Set(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS", "TRACE"]);
/**
 * Tuples mapping each supported HTTP method to its short request-constructor name.
 *
 * @category models
 * @since 4.0.0
 */
export const allShort = [["GET", "get"], ["POST", "post"], ["PUT", "put"], ["DELETE", "del"], ["PATCH", "patch"], ["HEAD", "head"], ["OPTIONS", "options"], ["TRACE", "trace"]];
/**
 * Tests if a value is a `HttpMethod`.
 *
 * **Example** (Checking HTTP method values)
 *
 * ```ts
 * import { HttpMethod } from "effect/unstable/http"
 *
 * console.log(HttpMethod.isHttpMethod("GET"))
 * // true
 * console.log(HttpMethod.isHttpMethod("get"))
 * // false
 * console.log(HttpMethod.isHttpMethod(1))
 * // false
 * ```
 *
 * @category refinements
 * @since 4.0.0
 */
export const isHttpMethod = u => all.has(u);
//# sourceMappingURL=HttpMethod.js.map