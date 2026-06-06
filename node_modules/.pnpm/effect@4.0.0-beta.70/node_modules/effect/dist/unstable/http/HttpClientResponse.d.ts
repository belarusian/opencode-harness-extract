/**
 * Utilities for inspecting, decoding, and filtering HTTP client responses.
 *
 * An `HttpClientResponse` pairs the platform `Response` with the request that
 * produced it, exposing status, headers, cookies, and effectful views of the
 * response body. Use this module after an `HttpClient` call to branch on status
 * with `matchStatus` or `filterStatus`, decode JSON or URL-encoded bodies with
 * schemas, stream bytes, or adapt a Web `Response` with `fromWeb`.
 *
 * Response bodies come from the underlying Web response and should be decoded
 * deliberately: `json` parses an empty text body as `null`, body readers fail
 * with `HttpClientError` when decoding fails, and the raw stream fails when no
 * body is present. Headers are represented by the HTTP `Headers` module's
 * single-value, lowercase map, while response cookies are parsed separately from
 * `Set-Cookie` headers. Status values are not considered errors by themselves;
 * use the provided filters or matchers when only specific status codes are
 * acceptable.
 *
 * @since 4.0.0
 */
import * as Effect from "../../Effect.ts";
import { type Pipeable } from "../../Pipeable.ts";
import * as Schema from "../../Schema.ts";
import type { ParseOptions } from "../../SchemaAST.ts";
import * as Stream from "../../Stream.ts";
import type { Unify } from "../../Unify.ts";
import * as Cookies from "./Cookies.ts";
import * as Error from "./HttpClientError.ts";
import type * as HttpClientRequest from "./HttpClientRequest.ts";
import * as HttpIncomingMessage from "./HttpIncomingMessage.ts";
export { 
/**
 * Creates a decoder that reads a response JSON body and decodes it with the supplied schema.
 *
 * @category schemas
 * @since 4.0.0
 */
schemaBodyJson, 
/**
 * Creates a decoder that reads response URL-encoded body parameters and decodes them with the supplied schema.
 *
 * @category schemas
 * @since 4.0.0
 */
schemaBodyUrlParams, 
/**
 * Creates a decoder that validates and decodes response headers with the supplied schema.
 *
 * @category schemas
 * @since 4.0.0
 */
schemaHeaders } from "./HttpIncomingMessage.ts";
/**
 * Type identifier for `HttpClientResponse` values.
 *
 * @category type IDs
 * @since 4.0.0
 */
export declare const TypeId = "~effect/http/HttpClientResponse";
/**
 * Model of an HTTP client response, including the original request, status, cookies, headers, and body accessors.
 *
 * @category models
 * @since 4.0.0
 */
export interface HttpClientResponse extends HttpIncomingMessage.HttpIncomingMessage<Error.HttpClientError>, Pipeable {
    readonly [TypeId]: typeof TypeId;
    readonly request: HttpClientRequest.HttpClientRequest;
    readonly status: number;
    readonly cookies: Cookies.Cookies;
    readonly formData: Effect.Effect<FormData, Error.HttpClientError>;
}
/**
 * Wraps a Web `Response` and its original `HttpClientRequest` as an `HttpClientResponse`.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const fromWeb: (request: HttpClientRequest.HttpClientRequest, source: Response) => HttpClientResponse;
/**
 * Creates a decoder for a response's status, headers, and JSON body using the supplied schema.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const schemaJson: <A, I extends {
    readonly status?: number | undefined;
    readonly headers?: Readonly<Record<string, string | undefined>> | undefined;
    readonly body?: unknown;
}, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined) => (self: HttpClientResponse) => Effect.Effect<A, Schema.SchemaError | Error.HttpClientError, RD>;
/**
 * Creates a decoder for a response's status and headers without reading a response body.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const schemaNoBody: <A, I extends {
    readonly status?: number | undefined;
    readonly headers?: Readonly<Record<string, string>> | undefined;
}, RD, RE>(schema: Schema.Codec<A, I, RD, RE>, options?: ParseOptions | undefined) => (self: HttpClientResponse) => Effect.Effect<A, Schema.SchemaError, RD>;
/**
 * Converts an effect producing an `HttpClientResponse` into a stream of response body bytes.
 *
 * @category accessors
 * @since 4.0.0
 */
export declare const stream: <E, R>(effect: Effect.Effect<HttpClientResponse, E, R>) => Stream.Stream<Uint8Array, Error.HttpClientError | E, R>;
/**
 * Pattern matches on a response status, checking exact status handlers before status-class handlers and `orElse`.
 *
 * @category pattern matching
 * @since 4.0.0
 */
export declare const matchStatus: {
    /**
     * Pattern matches on a response status, checking exact status handlers before status-class handlers and `orElse`.
     *
     * @category pattern matching
     * @since 4.0.0
     */
    <const Cases extends {
        readonly [status: number]: (_: HttpClientResponse) => any;
        readonly "2xx"?: (_: HttpClientResponse) => any;
        readonly "3xx"?: (_: HttpClientResponse) => any;
        readonly "4xx"?: (_: HttpClientResponse) => any;
        readonly "5xx"?: (_: HttpClientResponse) => any;
        readonly orElse: (_: HttpClientResponse) => any;
    }>(cases: Cases): (self: HttpClientResponse) => Cases[keyof Cases] extends (_: any) => infer R ? Unify<R> : never;
    /**
     * Pattern matches on a response status, checking exact status handlers before status-class handlers and `orElse`.
     *
     * @category pattern matching
     * @since 4.0.0
     */
    <const Cases extends {
        readonly [status: number]: (_: HttpClientResponse) => any;
        readonly "2xx"?: (_: HttpClientResponse) => any;
        readonly "3xx"?: (_: HttpClientResponse) => any;
        readonly "4xx"?: (_: HttpClientResponse) => any;
        readonly "5xx"?: (_: HttpClientResponse) => any;
        readonly orElse: (_: HttpClientResponse) => any;
    }>(self: HttpClientResponse, cases: Cases): Cases[keyof Cases] extends (_: any) => infer R ? Unify<R> : never;
};
/**
 * Succeeds with the response when its status satisfies the predicate, otherwise fails with `HttpClientError`.
 *
 * @category filters
 * @since 4.0.0
 */
export declare const filterStatus: {
    /**
     * Succeeds with the response when its status satisfies the predicate, otherwise fails with `HttpClientError`.
     *
     * @category filters
     * @since 4.0.0
     */
    (f: (status: number) => boolean): (self: HttpClientResponse) => Effect.Effect<HttpClientResponse, Error.HttpClientError>;
    /**
     * Succeeds with the response when its status satisfies the predicate, otherwise fails with `HttpClientError`.
     *
     * @category filters
     * @since 4.0.0
     */
    (self: HttpClientResponse, f: (status: number) => boolean): Effect.Effect<HttpClientResponse, Error.HttpClientError>;
};
/**
 * Succeeds with the response only when its status is in the 2xx range, otherwise fails with `HttpClientError`.
 *
 * @category filters
 * @since 4.0.0
 */
export declare const filterStatusOk: (self: HttpClientResponse) => Effect.Effect<HttpClientResponse, Error.HttpClientError>;
//# sourceMappingURL=HttpClientResponse.d.ts.map