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
import * as Context from "../../Context.ts";
import type * as Layer from "../../Layer.ts";
import * as HttpClient from "./HttpClient.ts";
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
export declare const Fetch: Context.Reference<typeof globalThis.fetch>;
declare const RequestInit_base: Context.ServiceClass<RequestInit, "effect/http/FetchHttpClient/RequestInit", globalThis.RequestInit>;
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
export declare class RequestInit extends RequestInit_base {
}
/**
 * Layer that provides an `HttpClient` implementation backed by the configured `Fetch` function.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<HttpClient.HttpClient>;
export {};
//# sourceMappingURL=FetchHttpClient.d.ts.map