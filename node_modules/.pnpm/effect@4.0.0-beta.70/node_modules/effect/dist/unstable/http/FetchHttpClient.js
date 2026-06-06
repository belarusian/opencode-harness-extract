/**
 * Provides an `HttpClient` implementation backed by the Web Fetch API.
 *
 * Use this module when an application should run HTTP requests through the
 * platform's `fetch` implementation, such as browser code, edge runtimes, or
 * Node.js environments that provide `globalThis.fetch`. The `Fetch` reference
 * allows tests and custom runtimes to supply a different fetch function, while
 * `RequestInit` can provide defaults such as credentials, redirect behavior,
 * cache mode, or other platform-specific fetch options.
 *
 * The client translates Effect HTTP requests into fetch calls and wraps Web
 * `Response` values as `HttpClientResponse`s. Fetch implementations control
 * details such as CORS, cookies, redirect handling, and abort semantics, so
 * behavior can vary by platform. Stream request bodies are sent as Web streams
 * with `duplex: "half"` for runtimes that require it, and `content-length` is
 * omitted so fetch can manage body framing itself.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Stream from "../../Stream.js";
import * as Headers from "./Headers.js";
import * as HttpClient from "./HttpClient.js";
import * as HttpClientError from "./HttpClientError.js";
import * as HttpClientResponse from "./HttpClientResponse.js";
/**
 * Context reference for the `fetch` implementation used by the fetch-based HTTP client.
 *
 * **Details**
 *
 * Defaults to `globalThis.fetch`.
 *
 * @category tags
 * @since 4.0.0
 */
export const Fetch = /*#__PURE__*/Context.Reference("effect/http/FetchHttpClient/Fetch", {
  defaultValue: () => globalThis.fetch
});
/**
 * Service containing default `RequestInit` options for the fetch-based HTTP client.
 *
 * **Details**
 *
 * Request-specific method, headers, body, and abort signal are supplied by the client when a request is executed.
 *
 * @category tags
 * @since 4.0.0
 */
export class RequestInit extends /*#__PURE__*/Context.Service()("effect/http/FetchHttpClient/RequestInit") {}
const fetch = /*#__PURE__*/HttpClient.make((request, url, signal, fiber) => {
  const fetch = fiber.getRef(Fetch);
  const options = fiber.context.mapUnsafe.get(RequestInit.key) ?? {};
  let headers = options.headers ? Headers.merge(Headers.fromInput(options.headers), request.headers) : request.headers;
  if (headers["content-length"]) {
    headers = Headers.remove(headers, "content-length");
  }
  const send = body => Effect.map(Effect.tryPromise({
    try: () => fetch(url, {
      ...options,
      method: request.method,
      headers,
      body,
      duplex: request.body._tag === "Stream" ? "half" : undefined,
      signal
    }),
    catch: cause => new HttpClientError.HttpClientError({
      reason: new HttpClientError.TransportError({
        request,
        cause
      })
    })
  }), response => HttpClientResponse.fromWeb(request, response));
  switch (request.body._tag) {
    case "Raw":
    case "Uint8Array":
      return send(request.body.body);
    case "FormData":
      return send(request.body.formData);
    case "Stream":
      return Effect.flatMap(Stream.toReadableStreamEffect(request.body.stream), send);
  }
  return send(undefined);
});
/**
 * Layer that provides an `HttpClient` implementation backed by the configured `Fetch` function.
 *
 * @category layers
 * @since 4.0.0
 */
export const layer = /*#__PURE__*/HttpClient.layerMergedContext(/*#__PURE__*/Effect.succeed(fetch));
//# sourceMappingURL=FetchHttpClient.js.map