/**
 * The `HttpApi` module defines the top-level contract for an Effect HTTP API.
 * An `HttpApi` names an API and collects one or more `HttpApiGroup`s, whose
 * endpoints describe the request inputs, response schemas, middleware, and
 * annotations that later drive server builders, clients, and OpenAPI
 * generation.
 *
 * Use this module when you want to compose a domain API from endpoint groups,
 * combine APIs from multiple modules, apply a shared path prefix or middleware,
 * attach annotations, or reflect over the final route shape. Implementations are
 * provided separately with `HttpApiBuilder.group`, and the completed API is
 * registered with `HttpApiBuilder.layer`.
 *
 * A few composition details are worth keeping in mind: group identifiers are
 * used as keys, so adding another group with the same identifier replaces the
 * previous one; `prefix` and `middleware` are applied to the groups and
 * endpoints already present when they are called; and `addHttpApi` merges the
 * added API's annotations into its groups. During reflection, success and error
 * schemas are grouped by the HTTP status recorded on their `HttpApiSchema`
 * annotations, endpoints without an explicit success schema default to
 * `NoContent`, and middleware error schemas are included with endpoint errors.
 * Extra schemas supplied through `AdditionalSchemas` must have an `identifier`
 * annotation so they can be emitted as OpenAPI components.
 *
 * @since 4.0.0
 */
import type { NonEmptyReadonlyArray } from "../../Array.ts";
import * as Context from "../../Context.ts";
import { type Pipeable } from "../../Pipeable.ts";
import * as Predicate from "../../Predicate.ts";
import * as Record from "../../Record.ts";
import type * as Schema from "../../Schema.ts";
import type { PathInput } from "../http/HttpRouter.ts";
import * as HttpApiEndpoint from "./HttpApiEndpoint.ts";
import type * as HttpApiGroup from "./HttpApiGroup.ts";
import type * as HttpApiMiddleware from "./HttpApiMiddleware.ts";
declare const TypeId = "~effect/httpapi/HttpApi";
/**
 * Returns `true` when a value is an `HttpApi`.
 *
 * @category guards
 * @since 4.0.0
 */
export declare const isHttpApi: (u: unknown) => u is Any;
/**
 * An `HttpApi` is a collection of HTTP API groups and endpoints that represents a
 * portion of your domain.
 *
 * **When to use**
 *
 * Endpoint implementations can be provided with `HttpApiBuilder.group`, and the
 * completed API can be registered with `HttpApiBuilder.layer`.
 *
 * @category models
 * @since 4.0.0
 */
export interface HttpApi<out Id extends string, out Groups extends HttpApiGroup.Any = never> extends Pipeable {
    new (_: never): {};
    readonly [TypeId]: typeof TypeId;
    readonly identifier: Id;
    readonly groups: Record.ReadonlyRecord<string, Groups>;
    readonly annotations: Context.Context<never>;
    /**
     * Add a `HttpApiGroup` to the `HttpApi`.
     */
    add<A extends NonEmptyReadonlyArray<HttpApiGroup.Any>>(...groups: A): HttpApi<Id, Groups | A[number]>;
    /**
     * Add another `HttpApi` to the `HttpApi`.
     */
    addHttpApi<Id2 extends string, Groups2 extends HttpApiGroup.Any>(api: HttpApi<Id2, Groups2>): HttpApi<Id, Groups | Groups2>;
    /**
     * Prefix all endpoints in the `HttpApi`.
     */
    prefix<const Prefix extends PathInput>(prefix: Prefix): HttpApi<Id, HttpApiGroup.AddPrefix<Groups, Prefix>>;
    /**
     * Adds a middleware to every endpoint currently in the `HttpApi`.
     *
     * **Gotchas**
     *
     * Endpoints added after this method is called do not receive the middleware.
     */
    middleware<I extends HttpApiMiddleware.AnyId, S>(middleware: Context.Key<I, S>): HttpApi<Id, HttpApiGroup.AddMiddleware<Groups, I>>;
    /**
     * Annotate the `HttpApi`.
     */
    annotate<I, S>(tag: Context.Key<I, S>, value: S): HttpApi<Id, Groups>;
    /**
     * Annotate the `HttpApi` with a Context.
     */
    annotateMerge<I>(context: Context.Context<I>): HttpApi<Id, Groups>;
}
/**
 * An `HttpApi` value with its identifier and group types erased.
 *
 * @category models
 * @since 4.0.0
 */
export interface Any {
    readonly [TypeId]: typeof TypeId;
}
/**
 * An `HttpApi` with broad identifier and group types while retaining the concrete
 * runtime properties used by implementation helpers.
 *
 * @category models
 * @since 4.0.0
 */
export type AnyWithProps = HttpApi<string, HttpApiGroup.AnyWithProps>;
/**
 * Creates an empty `HttpApi` with the supplied identifier.
 *
 * **When to use**
 *
 * Add groups with `add` or `addHttpApi`, provide endpoint implementations with
 * `HttpApiBuilder.group`, and register the API with `HttpApiBuilder.layer`.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: <const Id extends string>(identifier: Id) => HttpApi<Id, never>;
/**
 * Walks the groups and endpoints in an `HttpApi`.
 *
 * **Details**
 *
 * The callbacks receive each group or endpoint with merged annotations, endpoint
 * middleware, and response schemas grouped by HTTP status.
 *
 * @category Reflection
 * @since 4.0.0
 */
export declare const reflect: <Id extends string, Groups extends HttpApiGroup.Any>(self: HttpApi<Id, Groups>, options: {
    readonly predicate?: Predicate.Predicate<{
        readonly endpoint: HttpApiEndpoint.AnyWithProps;
        readonly group: HttpApiGroup.AnyWithProps;
    }> | undefined;
    readonly onGroup: (options: {
        readonly group: HttpApiGroup.AnyWithProps;
        readonly mergedAnnotations: Context.Context<never>;
    }) => void;
    readonly onEndpoint: (options: {
        readonly group: HttpApiGroup.AnyWithProps;
        readonly endpoint: HttpApiEndpoint.AnyWithProps;
        readonly mergedAnnotations: Context.Context<never>;
        readonly middleware: ReadonlySet<HttpApiMiddleware.AnyService>;
        readonly successes: ReadonlyMap<number, readonly [Schema.Top, ...Array<Schema.Top>]>;
        readonly errors: ReadonlyMap<number, readonly [Schema.Top, ...Array<Schema.Top>]>;
    }) => void;
}) => void;
declare const AdditionalSchemas_base: Context.ServiceClass<AdditionalSchemas, "effect/httpapi/HttpApi/AdditionalSchemas", readonly Schema.Top[]>;
/**
 * Adds additional schemas to components/schemas.
 * The provided schemas must have a `identifier` annotation.
 *
 * @category tags
 * @since 4.0.0
 */
export declare class AdditionalSchemas extends AdditionalSchemas_base {
}
export {};
//# sourceMappingURL=HttpApi.d.ts.map