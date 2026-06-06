/**
 * Utilities for representing, validating, parsing, and serializing HTTP cookies.
 *
 * This module provides an immutable `Cookies` collection keyed by cookie name,
 * constructors for validated `Cookie` values, and helpers for common server and
 * client flows such as reading `Cookie` request headers, emitting `Set-Cookie`
 * response headers, merging cookie sets, and expiring cookies.
 *
 * Cookie parsing is intentionally tolerant of malformed input: unsupported or
 * invalid `Set-Cookie` attributes are ignored, values are percent-decoded on a
 * best-effort basis, and collections keep one cookie per name. Security
 * attributes such as `HttpOnly`, `Secure`, `SameSite`, and `Partitioned` are
 * serialized when present, but browsers enforce their final behavior, so set
 * them explicitly for session, cross-site, and HTTPS-sensitive cookies.
 *
 * @since 4.0.0
 */
import * as Data from "../../Data.ts";
import * as Duration from "../../Duration.ts";
import * as Inspectable from "../../Inspectable.ts";
import * as Option from "../../Option.ts";
import { type Pipeable } from "../../Pipeable.ts";
import * as Record from "../../Record.ts";
import * as Result from "../../Result.ts";
import * as Schema from "../../Schema.ts";
import type * as Types from "../../Types.ts";
declare const TypeId = "~effect/http/Cookies";
/**
 * Returns `true` when a value is a `Cookies` collection.
 *
 * @category refinements
 * @since 4.0.0
 */
export declare const isCookies: (u: unknown) => u is Cookies;
/**
 * Immutable collection of HTTP cookies keyed by cookie name.
 *
 * @category models
 * @since 4.0.0
 */
export interface Cookies extends Pipeable, Inspectable.Inspectable {
    readonly [TypeId]: typeof TypeId;
    readonly cookies: Record.ReadonlyRecord<string, Cookie>;
}
/**
 * Schema interface for validating and encoding `Cookies` collections.
 *
 * @category schemas
 * @since 4.0.0
 */
export interface CookiesSchema extends Schema.declare<Cookies, Record.ReadonlyRecord<string, Cookie>> {
}
/**
 * Schema for `Cookies` collections.
 *
 * **Details**
 *
 * JSON encoding uses `Set-Cookie` header strings, while isomorphic encoding uses
 * a readonly record of cookie values.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const CookiesSchema: CookiesSchema;
declare const CookieTypeId = "~effect/http/Cookies/Cookie";
/**
 * HTTP cookie value with its decoded value, encoded value, and optional cookie
 * attributes such as domain, path, expiration, security, and same-site settings.
 *
 * @category cookie
 * @since 4.0.0
 */
export interface Cookie extends Inspectable.Inspectable {
    readonly [CookieTypeId]: typeof CookieTypeId;
    readonly name: string;
    readonly value: string;
    readonly valueEncoded: string;
    readonly options?: {
        readonly domain?: string | undefined;
        readonly expires?: Date | undefined;
        readonly maxAge?: Duration.Input | undefined;
        readonly path?: string | undefined;
        readonly priority?: "low" | "medium" | "high" | undefined;
        readonly httpOnly?: boolean | undefined;
        readonly secure?: boolean | undefined;
        readonly partitioned?: boolean | undefined;
        readonly sameSite?: "lax" | "strict" | "none" | undefined;
    } | undefined;
}
/**
 * Returns `true` when a value is a `Cookie`.
 *
 * @category guards
 * @since 4.0.0
 */
export declare const isCookie: (u: unknown) => u is Cookie;
/**
 * Schema interface for validating `Cookie` values.
 *
 * @category schemas
 * @since 4.0.0
 */
export interface CookieSchema extends Schema.declare<Cookie> {
}
/**
 * Schema for `Cookie` values.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const CookieSchema: CookieSchema;
declare const CookieErrorTypeId = "~effect/http/Cookies/CookieError";
/**
 * Structured reason describing why cookie construction failed, such as invalid
 * name, value, domain, path, or infinite max-age.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class CookiesErrorReason extends Data.Error<{
    readonly _tag: "InvalidCookieName" | "InvalidCookieValue" | "InvalidCookieDomain" | "InvalidCookiePath" | "CookieInfinityMaxAge";
    readonly cause?: unknown;
}> {
}
declare const CookiesError_base: new <A extends Record<string, any> = {}>(args: Types.VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("../../Cause.ts").YieldableError & {
    readonly _tag: "CookieError";
} & Readonly<A>;
/**
 * Error returned when a cookie name, value, domain, path, or max-age option is invalid.
 *
 * **Details**
 *
 * Inspect `reason` to determine the specific validation failure.
 *
 * @category errors
 * @since 4.0.0
 */
export declare class CookiesError extends CookiesError_base<{
    readonly reason: CookiesErrorReason;
}> {
    /**
     * Creates a cookie error from a reason tag and optional cause.
     *
     * @since 4.0.0
     */
    static fromReason(reason: CookiesError["reason"]["_tag"], cause?: unknown): CookiesError;
    /**
     * Marks this value as a cookie validation error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [CookieErrorTypeId] = "~effect/http/Cookies/CookieError";
    /**
     * Uses the concrete cookie error reason as the public message.
     *
     * @since 4.0.0
     */
    get message(): "InvalidCookieName" | "InvalidCookieValue" | "InvalidCookieDomain" | "InvalidCookiePath" | "CookieInfinityMaxAge";
}
/**
 * Creates a `Cookies` collection from an existing readonly record of cookies keyed by cookie name.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const fromReadonlyRecord: (cookies: Record.ReadonlyRecord<string, Cookie>) => Cookies;
/**
 * Create a Cookies object from an Iterable
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const fromIterable: (cookies: Iterable<Cookie>) => Cookies;
/**
 * Create a Cookies object from a set of Set-Cookie headers
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const fromSetCookie: (headers: Iterable<string> | string) => Cookies;
/**
 * An empty Cookies object
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const empty: Cookies;
/**
 * Returns `true` when the `Cookies` collection contains no cookies.
 *
 * @category refinements
 * @since 4.0.0
 */
export declare const isEmpty: (self: Cookies) => boolean;
/**
 * Creates a cookie, validating the name, encoded value, domain, path, and finite `maxAge`.
 *
 * **Details**
 *
 * Returns a `CookiesError` in the `Result` failure channel when validation fails.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare function makeCookie(name: string, value: string, options?: Cookie["options"] | undefined): Result.Result<Cookie, CookiesError>;
/**
 * Create a new cookie, throwing an error if invalid
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeCookieUnsafe: (name: string, value: string, options?: Cookie["options"] | undefined) => Cookie;
/**
 * Add a cookie to a Cookies object
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const setCookie: {
    /**
     * Add a cookie to a Cookies object
     *
     * @category combinators
     * @since 4.0.0
     */
    (cookie: Cookie): (self: Cookies) => Cookies;
    /**
     * Add a cookie to a Cookies object
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, cookie: Cookie): Cookies;
};
/**
 * Add multiple cookies to a Cookies object
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const setAllCookie: {
    /**
     * Add multiple cookies to a Cookies object
     *
     * @category combinators
     * @since 4.0.0
     */
    (cookies: Iterable<Cookie>): (self: Cookies) => Cookies;
    /**
     * Add multiple cookies to a Cookies object
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, cookies: Iterable<Cookie>): Cookies;
};
/**
 * Combine two Cookies objects, removing duplicates from the first
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const merge: {
    /**
     * Combine two Cookies objects, removing duplicates from the first
     *
     * @category combinators
     * @since 4.0.0
     */
    (that: Cookies): (self: Cookies) => Cookies;
    /**
     * Combine two Cookies objects, removing duplicates from the first
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, that: Cookies): Cookies;
};
/**
 * Remove a cookie by name
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const remove: {
    /**
     * Remove a cookie by name
     *
     * @category combinators
     * @since 4.0.0
     */
    (name: string): (self: Cookies) => Cookies;
    /**
     * Remove a cookie by name
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, name: string): Cookies;
};
/**
 * Get a cookie from a Cookies object
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const get: {
    /**
     * Get a cookie from a Cookies object
     *
     * @category combinators
     * @since 4.0.0
     */
    (name: string): (self: Cookies) => Option.Option<Cookie>;
    /**
     * Get a cookie from a Cookies object
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, name: string): Option.Option<Cookie>;
};
/**
 * Gets the decoded value of a cookie by name.
 *
 * **Details**
 *
 * Returns `Option.none()` when the cookie is not present.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const getValue: {
    /**
     * Gets the decoded value of a cookie by name.
     *
     * **Details**
     *
     * Returns `Option.none()` when the cookie is not present.
     *
     * @category combinators
     * @since 4.0.0
     */
    (name: string): (self: Cookies) => Option.Option<string>;
    /**
     * Gets the decoded value of a cookie by name.
     *
     * **Details**
     *
     * Returns `Option.none()` when the cookie is not present.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, name: string): Option.Option<string>;
};
/**
 * Creates and adds a cookie by name and value.
 *
 * **Details**
 *
 * The cookie fields are validated first; invalid input returns a `CookiesError` in the `Result` failure channel.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const set: {
    /**
     * Creates and adds a cookie by name and value.
     *
     * **Details**
     *
     * The cookie fields are validated first; invalid input returns a `CookiesError` in the `Result` failure channel.
     *
     * @category combinators
     * @since 4.0.0
     */
    (name: string, value: string, options?: Cookie["options"]): (self: Cookies) => Result.Result<Cookies, CookiesError>;
    /**
     * Creates and adds a cookie by name and value.
     *
     * **Details**
     *
     * The cookie fields are validated first; invalid input returns a `CookiesError` in the `Result` failure channel.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, name: string, value: string, options?: Cookie["options"]): Result.Result<Cookies, CookiesError>;
};
/**
 * Creates and adds a cookie by name and value, throwing if the cookie fields are invalid.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const setUnsafe: {
    /**
     * Creates and adds a cookie by name and value, throwing if the cookie fields are invalid.
     *
     * @category combinators
     * @since 4.0.0
     */
    (name: string, value: string, options?: Cookie["options"]): (self: Cookies) => Cookies;
    /**
     * Creates and adds a cookie by name and value, throwing if the cookie fields are invalid.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, name: string, value: string, options?: Cookie["options"]): Cookies;
};
/**
 * Adds an expired cookie with an empty value, `Max-Age=0`, and an epoch `Expires` value.
 *
 * **Details**
 *
 * Returns a `CookiesError` in the `Result` failure channel when the name or options are invalid.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const expireCookie: {
    /**
     * Adds an expired cookie with an empty value, `Max-Age=0`, and an epoch `Expires` value.
     *
     * **Details**
     *
     * Returns a `CookiesError` in the `Result` failure channel when the name or options are invalid.
     *
     * @category combinators
     * @since 4.0.0
     */
    (name: string, options?: Omit<NonNullable<Cookie["options"]>, "expires" | "maxAge">): (self: Cookies) => Result.Result<Cookies, CookiesError>;
    /**
     * Adds an expired cookie with an empty value, `Max-Age=0`, and an epoch `Expires` value.
     *
     * **Details**
     *
     * Returns a `CookiesError` in the `Result` failure channel when the name or options are invalid.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, name: string, options?: Omit<NonNullable<Cookie["options"]>, "expires" | "maxAge">): Result.Result<Cookies, CookiesError>;
};
/**
 * Add an expired cookie to a Cookies object, throwing an error if invalid
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const expireCookieUnsafe: {
    /**
     * Add an expired cookie to a Cookies object, throwing an error if invalid
     *
     * @category combinators
     * @since 4.0.0
     */
    (name: string, options?: Omit<NonNullable<Cookie["options"]>, "expires" | "maxAge">): (self: Cookies) => Cookies;
    /**
     * Add an expired cookie to a Cookies object, throwing an error if invalid
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, name: string, options?: Omit<NonNullable<Cookie["options"]>, "expires" | "maxAge">): Cookies;
};
/**
 * Creates and adds multiple cookies from name/value/options tuples.
 *
 * **Details**
 *
 * If any tuple is invalid, returns the first `CookiesError` and leaves the original collection unchanged.
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const setAll: {
    /**
     * Creates and adds multiple cookies from name/value/options tuples.
     *
     * **Details**
     *
     * If any tuple is invalid, returns the first `CookiesError` and leaves the original collection unchanged.
     *
     * @category combinators
     * @since 4.0.0
     */
    (cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): (self: Cookies) => Result.Result<Cookies, CookiesError>;
    /**
     * Creates and adds multiple cookies from name/value/options tuples.
     *
     * **Details**
     *
     * If any tuple is invalid, returns the first `CookiesError` and leaves the original collection unchanged.
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): Result.Result<Cookies, CookiesError>;
};
/**
 * Add multiple cookies to a Cookies object, throwing an error if invalid
 *
 * @category combinators
 * @since 4.0.0
 */
export declare const setAllUnsafe: {
    /**
     * Add multiple cookies to a Cookies object, throwing an error if invalid
     *
     * @category combinators
     * @since 4.0.0
     */
    (cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): (self: Cookies) => Cookies;
    /**
     * Add multiple cookies to a Cookies object, throwing an error if invalid
     *
     * @category combinators
     * @since 4.0.0
     */
    (self: Cookies, cookies: Iterable<readonly [name: string, value: string, options?: Cookie["options"]]>): Cookies;
};
/**
 * Serialize a cookie into a string
 *
 * **Details**
 *
 * Adapted from https://github.com/fastify/fastify-cookie under MIT License
 *
 * @category encoding
 * @since 4.0.0
 */
export declare function serializeCookie(self: Cookie): string;
/**
 * Serialize a Cookies object into a Cookie header
 *
 * @category encoding
 * @since 4.0.0
 */
export declare const toCookieHeader: (self: Cookies) => string;
/**
 * Converts a `Cookies` collection to a record of decoded cookie values keyed by cookie name.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare const toRecord: (self: Cookies) => Record<string, string>;
/**
 * Schema transformation between `Cookies` and a record of decoded string values keyed by cookie name.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const schemaRecord: Schema.decodeTo<Schema.$Record<Schema.String, Schema.String>, CookiesSchema, never, never>;
/**
 * Serializes a `Cookies` collection into an array of `Set-Cookie` header values.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare const toSetCookieHeaders: (self: Cookies) => Array<string>;
/**
 * Parse a cookie header into a record of key-value pairs
 *
 * **Details**
 *
 * Adapted from https://github.com/fastify/fastify-cookie under MIT License
 *
 * @category decoding
 * @since 4.0.0
 */
export declare function parseHeader(header: string): Record<string, string>;
export {};
//# sourceMappingURL=Cookies.d.ts.map