import * as Result from "./Result.ts";
/**
 * Type identifier stored on `EncodingError` values and used by
 * `isEncodingError`.
 *
 * @category symbols
 * @since 4.0.0
 */
export declare const EncodingErrorTypeId: "~effect/encoding/EncodingError";
/**
 * Literal type of the `EncodingErrorTypeId` marker.
 *
 * @category symbols
 * @since 4.0.0
 */
export type EncodingErrorTypeId = typeof EncodingErrorTypeId;
declare const EncodingError_base: new <A extends Record<string, any> = {}>(args: import("./Types.ts").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("./Cause.ts").YieldableError & {
    readonly _tag: "EncodingError";
} & Readonly<A>;
/**
 * Error returned when an encoding or decoding operation cannot process its
 * input.
 *
 * **Details**
 *
 * The error records whether the failure happened during encoding or decoding,
 * which encoding module reported it, the original input, and a human-readable
 * message.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare class EncodingError extends EncodingError_base<{
    kind: "Decode" | "Encode";
    module: string;
    input: unknown;
    message: string;
}> {
    /**
     * Marks this value as an encoding or decoding error for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [EncodingErrorTypeId]: EncodingErrorTypeId;
}
/**
 * Checks whether a value is an `EncodingError`.
 *
 * **Details**
 *
 * Returns `true` when the value carries the `EncodingErrorTypeId` marker and
 * narrows the value to `EncodingError`.
 *
 * @category guards
 * @since 4.0.0
 */
export declare const isEncodingError: (u: unknown) => u is EncodingError;
/**
 * Encodes the given value into a base64 (RFC4648) `string`.
 *
 * **Example** (Encoding Base64 strings and bytes)
 *
 * ```ts
 * import { Encoding } from "effect"
 *
 * // Encode a string
 * console.log(Encoding.encodeBase64("hello")) // "aGVsbG8="
 *
 * // Encode binary data
 * const bytes = new Uint8Array([72, 101, 108, 108, 111])
 * console.log(Encoding.encodeBase64(bytes)) // "SGVsbG8="
 * ```
 *
 * @category encoding
 * @since 2.0.0
 */
export declare const encodeBase64: (input: Uint8Array | string) => string;
/**
 * Decodes a base64 (RFC4648) string into bytes.
 *
 * **Details**
 *
 * Returns `Result.succeed` with a `Uint8Array` when decoding succeeds, or
 * `Result.fail` with an `EncodingError` when the input is not valid base64.
 *
 * **Example** (Decoding Base64 bytes)
 *
 * ```ts
 * import { Encoding, Result } from "effect"
 *
 * const result = Encoding.decodeBase64("SGVsbG8=")
 * if (Result.isSuccess(result)) {
 *   console.log(Array.from(result.success)) // [72, 101, 108, 108, 111]
 * }
 * ```
 *
 * @category decoding
 * @since 2.0.0
 */
export declare const decodeBase64: (str: string) => Result.Result<Uint8Array, EncodingError>;
/**
 * Decodes a base64 (RFC4648) string into a UTF-8 string.
 *
 * **Details**
 *
 * Returns `Result.succeed` with the decoded text when decoding succeeds, or
 * `Result.fail` with an `EncodingError` when the input is not valid base64.
 *
 * **Example** (Decoding Base64 strings)
 *
 * ```ts
 * import { Encoding, Result } from "effect"
 *
 * const result = Encoding.decodeBase64String("aGVsbG8=")
 * if (Result.isSuccess(result)) {
 *   console.log(result.success) // "hello"
 * }
 * ```
 *
 * @category decoding
 * @since 2.0.0
 */
export declare const decodeBase64String: (str: string) => Result.Result<string, EncodingError>;
/**
 * Encodes the given value into a base64 (URL) `string`.
 *
 * **Example** (Encoding URL-safe Base64)
 *
 * ```ts
 * import { Encoding } from "effect"
 *
 * // URL-safe base64 encoding (uses - and _ instead of + and /)
 * console.log(Encoding.encodeBase64Url("hello?")) // "aGVsbG8_"
 *
 * const bytes = new Uint8Array([72, 101, 108, 108, 111, 63])
 * console.log(Encoding.encodeBase64Url(bytes)) // "SGVsbG8_"
 * ```
 *
 * @category encoding
 * @since 2.0.0
 */
export declare const encodeBase64Url: (input: Uint8Array | string) => string;
/**
 * Decodes a URL-safe base64 string into bytes.
 *
 * **Details**
 *
 * Returns `Result.succeed` with a `Uint8Array` when decoding succeeds, or
 * `Result.fail` with an `EncodingError` when the input is not valid URL-safe
 * base64. Both padded and unpadded URL-safe base64 forms are accepted when
 * otherwise valid.
 *
 * **Example** (Decoding URL-safe Base64 bytes)
 *
 * ```ts
 * import { Encoding, Result } from "effect"
 *
 * const result = Encoding.decodeBase64Url("SGVsbG8_")
 * if (Result.isSuccess(result)) {
 *   console.log(Array.from(result.success)) // [72, 101, 108, 108, 111, 63]
 * }
 * ```
 *
 * @category decoding
 * @since 2.0.0
 */
export declare const decodeBase64Url: (str: string) => Result.Result<Uint8Array, EncodingError>;
/**
 * Decodes a URL-safe base64 string into a UTF-8 string.
 *
 * **Details**
 *
 * Returns `Result.succeed` with the decoded text when decoding succeeds, or
 * `Result.fail` with an `EncodingError` when the input is not valid URL-safe
 * base64.
 *
 * **Example** (Decoding URL-safe Base64 strings)
 *
 * ```ts
 * import { Encoding, Result } from "effect"
 *
 * const result = Encoding.decodeBase64UrlString("aGVsbG8_")
 * if (Result.isSuccess(result)) {
 *   console.log(result.success) // "hello?"
 * }
 * ```
 *
 * @category decoding
 * @since 2.0.0
 */
export declare const decodeBase64UrlString: (str: string) => Result.Result<string, EncodingError>;
/**
 * Encodes the given value into a hex `string`.
 *
 * **Example** (Encoding hex strings and bytes)
 *
 * ```ts
 * import { Encoding } from "effect"
 *
 * // Encode a string to hex
 * console.log(Encoding.encodeHex("hello")) // "68656c6c6f"
 *
 * // Encode binary data to hex
 * const bytes = new Uint8Array([72, 101, 108, 108, 111])
 * console.log(Encoding.encodeHex(bytes)) // "48656c6c6f"
 * ```
 *
 * @category encoding
 * @since 2.0.0
 */
export declare const encodeHex: (input: Uint8Array | string) => string;
/**
 * Decodes a hexadecimal string into bytes.
 *
 * **Details**
 *
 * Returns `Result.succeed` with a `Uint8Array` when decoding succeeds, or
 * `Result.fail` with an `EncodingError` when the input has an odd length or
 * contains invalid hex characters.
 *
 * **Example** (Decoding hex bytes)
 *
 * ```ts
 * import { Encoding, Result } from "effect"
 *
 * const result = Encoding.decodeHex("48656c6c6f")
 * if (Result.isSuccess(result)) {
 *   console.log(Array.from(result.success)) // [72, 101, 108, 108, 111]
 * }
 * ```
 *
 * @category decoding
 * @since 2.0.0
 */
export declare const decodeHex: (str: string) => Result.Result<Uint8Array, EncodingError>;
/**
 * Decodes a hexadecimal string into a UTF-8 string.
 *
 * **Details**
 *
 * Returns `Result.succeed` with the decoded text when decoding succeeds, or
 * `Result.fail` with an `EncodingError` when the input is not valid hex.
 *
 * **Example** (Decoding hex strings)
 *
 * ```ts
 * import { Encoding, Result } from "effect"
 *
 * const result = Encoding.decodeHexString("68656c6c6f")
 * if (Result.isSuccess(result)) {
 *   console.log(result.success) // "hello"
 * }
 * ```
 *
 * @category decoding
 * @since 2.0.0
 */
export declare const decodeHexString: (str: string) => Result.Result<string, EncodingError>;
export {};
//# sourceMappingURL=Encoding.d.ts.map