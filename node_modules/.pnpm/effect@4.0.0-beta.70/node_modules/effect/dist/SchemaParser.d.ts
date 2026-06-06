import * as Effect from "./Effect.ts";
import * as Exit from "./Exit.ts";
import * as Option from "./Option.ts";
import * as Result from "./Result.ts";
import type * as Schema from "./Schema.ts";
import * as AST from "./SchemaAST.ts";
import * as Issue from "./SchemaIssue.ts";
/**
 * Creates an effectful maker for the schema's decoded type side.
 *
 * **Details**
 *
 * The returned function accepts constructor input, applies constructor defaults,
 * runs type-side validation unless checks are disabled, and fails with a
 * `SchemaIssue.Issue` when construction fails.
 *
 * @category Constructing
 * @since 4.0.0
 */
export declare function makeEffect<S extends Schema.Top>(schema: S): (input: S["~type.make.in"], options?: Schema.MakeOptions) => Effect.Effect<S["Type"], Issue.Issue>;
/**
 * Creates a synchronous maker that returns `Option.some` with the constructed
 * value on success, or `Option.none` when construction fails.
 *
 * **When to use**
 *
 * Use this when you only need to know whether constructor input is valid and do
 * not need error details.
 *
 * @category Constructing
 * @since 4.0.0
 */
export declare function makeOption<S extends Schema.Top>(schema: S): (input: S["~type.make.in"], options?: Schema.MakeOptions) => Option.Option<S["Type"]>;
/**
 * Creates a synchronous maker for the schema's decoded type side.
 *
 * **Details**
 *
 * The returned function constructs a value from constructor input and throws an
 * `Error` with the `SchemaIssue.Issue` in its `cause` when construction fails.
 *
 * @category Constructing
 * @since 4.0.0
 */
export declare function make<S extends Schema.Top>(schema: S): (input: S["~type.make.in"], options?: Schema.MakeOptions) => S["Type"];
/**
 * Creates a type guard that checks whether an input satisfies the schema's decoded
 * type side.
 *
 * **Details**
 *
 * The guard returns `true` on successful validation and `false` on failure, without
 * exposing issue details.
 *
 * @category Asserting
 * @since 3.10.0
 */
export declare function is<T>(schema: Schema.Schema<T>): <I>(input: I) => input is I & T;
/**
 * Asserts that an input satisfies the schema's decoded type side.
 *
 * **Details**
 *
 * The assertion returns normally when validation succeeds and throws when the
 * input does not satisfy the schema.
 *
 * @category Asserting
 * @since 4.0.0
 */
export declare function asserts<S extends Schema.Top, I>(schema: S, input: I): asserts input is I & S["Type"];
/**
 * Creates an effectful decoder for `unknown` input.
 *
 * **Details**
 *
 * The returned function succeeds with the schema's decoded `Type` or fails with a
 * `SchemaIssue.Issue`. Decoding service requirements are preserved in the returned
 * `Effect`. Parse options may be provided when creating the decoder and overridden
 * when applying it.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare function decodeUnknownEffect<S extends Schema.Top>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Effect.Effect<S["Type"], Issue.Issue, S["DecodingServices"]>;
/**
 * Creates an effectful decoder for input already typed as the schema's `Encoded`
 * type.
 *
 * **Details**
 *
 * The returned function succeeds with the decoded `Type` or fails with a
 * `SchemaIssue.Issue`, preserving any decoding service requirements in the
 * returned `Effect`.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare const decodeEffect: <S extends Schema.Top>(schema: S, options?: AST.ParseOptions) => (input: S["Encoded"], options?: AST.ParseOptions) => Effect.Effect<S["Type"], Issue.Issue, S["DecodingServices"]>;
/**
 * Creates a Promise-based decoder for `unknown` input.
 *
 * **Details**
 *
 * The returned function resolves with the decoded `Type` on success and rejects
 * with a `SchemaIssue.Issue` on decoding failure.
 *
 * @category decoding
 * @since 3.10.0
 */
export declare function decodeUnknownPromise<S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Promise<S["Type"]>;
/**
 * Creates a Promise-based decoder for input already typed as the schema's
 * `Encoded` type.
 *
 * **Details**
 *
 * The returned function resolves with the decoded `Type` on success and rejects
 * with a `SchemaIssue.Issue` on decoding failure.
 *
 * @category decoding
 * @since 3.10.0
 */
export declare function decodePromise<S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: S["Encoded"], options?: AST.ParseOptions) => Promise<S["Type"]>;
/**
 * Creates a synchronous decoder for `unknown` input that returns an `Exit`.
 *
 * **Details**
 *
 * The returned function produces `Exit.Success` with the decoded `Type` or
 * `Exit.Failure` with a `SchemaIssue.Issue`.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare function decodeUnknownExit<S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Exit.Exit<S["Type"], Issue.Issue>;
/**
 * Creates a synchronous decoder for input already typed as the schema's `Encoded`
 * type, returning an `Exit`.
 *
 * **Details**
 *
 * The returned function produces `Exit.Success` with the decoded `Type` or
 * `Exit.Failure` with a `SchemaIssue.Issue`.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare const decodeExit: <S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Encoded"], options?: AST.ParseOptions) => Exit.Exit<S["Type"], Issue.Issue>;
/**
 * Creates a decoder for `unknown` input that returns an `Option`.
 *
 * **Details**
 *
 * The returned function produces `Option.some` with the decoded `Type` on success
 * or `Option.none` on failure, discarding issue details.
 *
 * @category decoding
 * @since 3.10.0
 */
export declare function decodeUnknownOption<S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Option.Option<S["Type"]>;
/**
 * Creates a decoder for input already typed as the schema's `Encoded` type,
 * returning an `Option`.
 *
 * **Details**
 *
 * The returned function produces `Option.some` with the decoded `Type` on success
 * or `Option.none` on failure, discarding issue details.
 *
 * @category decoding
 * @since 3.10.0
 */
export declare const decodeOption: <S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Encoded"], options?: AST.ParseOptions) => Option.Option<S["Type"]>;
/**
 * Creates a decoder for `unknown` input that returns a `Result`.
 *
 * **Details**
 *
 * The returned function produces `Result.succeed` with the decoded `Type` on
 * success or `Result.fail` with a `SchemaIssue.Issue` on decoding failure.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare function decodeUnknownResult<S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Result.Result<S["Type"], Issue.Issue>;
/**
 * Creates a decoder for input already typed as the schema's `Encoded` type,
 * returning a `Result`.
 *
 * **Details**
 *
 * The returned function produces `Result.succeed` with the decoded `Type` on
 * success or `Result.fail` with a `SchemaIssue.Issue` on decoding failure.
 *
 * @category decoding
 * @since 4.0.0
 */
export declare const decodeResult: <S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Encoded"], options?: AST.ParseOptions) => Result.Result<S["Type"], Issue.Issue>;
/**
 * Creates a synchronous decoder for `unknown` input.
 *
 * **Details**
 *
 * The returned function returns the decoded `Type` on success and throws an
 * `Error` with the `SchemaIssue.Issue` in its `cause` on decoding failure.
 *
 * @category decoding
 * @since 3.10.0
 */
export declare function decodeUnknownSync<S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => S["Type"];
/**
 * Creates a synchronous decoder for input already typed as the schema's `Encoded`
 * type.
 *
 * **Details**
 *
 * The returned function returns the decoded `Type` on success and throws an
 * `Error` with the `SchemaIssue.Issue` in its `cause` on decoding failure.
 *
 * @category decoding
 * @since 3.10.0
 */
export declare const decodeSync: <S extends Schema.Decoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Encoded"], options?: AST.ParseOptions) => S["Type"];
/**
 * Creates an effectful encoder for `unknown` input.
 *
 * **Details**
 *
 * The returned function succeeds with the schema's `Encoded` value or fails with a
 * `SchemaIssue.Issue`. Encoding service requirements are preserved in the returned
 * `Effect`. Parse options may be provided when creating the encoder and overridden
 * when applying it.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare function encodeUnknownEffect<S extends Schema.Top>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Effect.Effect<S["Encoded"], Issue.Issue, S["EncodingServices"]>;
/**
 * Creates an effectful encoder for input already typed as the schema's decoded
 * `Type`.
 *
 * **Details**
 *
 * The returned function succeeds with the schema's `Encoded` value or fails with a
 * `SchemaIssue.Issue`, preserving any encoding service requirements in the
 * returned `Effect`.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare const encodeEffect: <S extends Schema.Top>(schema: S, options?: AST.ParseOptions) => (input: S["Type"], options?: AST.ParseOptions) => Effect.Effect<S["Encoded"], Issue.Issue, S["EncodingServices"]>;
/**
 * Creates a Promise-based encoder for `unknown` input.
 *
 * **Details**
 *
 * The returned function resolves with the schema's `Encoded` value on success and
 * rejects with a `SchemaIssue.Issue` on encoding failure.
 *
 * @category encoding
 * @since 3.10.0
 */
export declare const encodeUnknownPromise: <S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: unknown, options?: AST.ParseOptions) => Promise<S["Encoded"]>;
/**
 * Creates a Promise-based encoder for input already typed as the schema's decoded
 * `Type`.
 *
 * **Details**
 *
 * The returned function resolves with the schema's `Encoded` value on success and
 * rejects with a `SchemaIssue.Issue` on encoding failure.
 *
 * @category encoding
 * @since 3.10.0
 */
export declare const encodePromise: <S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Type"], options?: AST.ParseOptions) => Promise<S["Encoded"]>;
/**
 * Creates a synchronous encoder for `unknown` input that returns an `Exit`.
 *
 * **Details**
 *
 * The returned function produces `Exit.Success` with the schema's `Encoded` value
 * or `Exit.Failure` with a `SchemaIssue.Issue`.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare function encodeUnknownExit<S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Exit.Exit<S["Encoded"], Issue.Issue>;
/**
 * Creates a synchronous encoder for input already typed as the schema's decoded
 * `Type`, returning an `Exit`.
 *
 * **Details**
 *
 * The returned function produces `Exit.Success` with the schema's `Encoded` value
 * or `Exit.Failure` with a `SchemaIssue.Issue`.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare const encodeExit: <S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Type"], options?: AST.ParseOptions) => Exit.Exit<S["Encoded"], Issue.Issue>;
/**
 * Creates an encoder for `unknown` input that returns an `Option`.
 *
 * **Details**
 *
 * The returned function produces `Option.some` with the schema's `Encoded` value
 * on success or `Option.none` on failure, discarding issue details.
 *
 * @category encoding
 * @since 3.10.0
 */
export declare function encodeUnknownOption<S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Option.Option<S["Encoded"]>;
/**
 * Creates an encoder for input already typed as the schema's decoded `Type`,
 * returning an `Option`.
 *
 * **Details**
 *
 * The returned function produces `Option.some` with the schema's `Encoded` value
 * on success or `Option.none` on failure, discarding issue details.
 *
 * @category encoding
 * @since 3.10.0
 */
export declare const encodeOption: <S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Type"], options?: AST.ParseOptions) => Option.Option<S["Encoded"]>;
/**
 * Creates an encoder for `unknown` input that returns a `Result`.
 *
 * **Details**
 *
 * The returned function produces `Result.succeed` with the schema's `Encoded`
 * value on success or `Result.fail` with a `SchemaIssue.Issue` on encoding
 * failure.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare function encodeUnknownResult<S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => Result.Result<S["Encoded"], Issue.Issue>;
/**
 * Creates an encoder for input already typed as the schema's decoded `Type`,
 * returning a `Result`.
 *
 * **Details**
 *
 * The returned function produces `Result.succeed` with the schema's `Encoded`
 * value on success or `Result.fail` with a `SchemaIssue.Issue` on encoding
 * failure.
 *
 * @category encoding
 * @since 4.0.0
 */
export declare const encodeResult: <S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Type"], options?: AST.ParseOptions) => Result.Result<S["Encoded"], Issue.Issue>;
/**
 * Creates a synchronous encoder for `unknown` input.
 *
 * **Details**
 *
 * The returned function returns the schema's `Encoded` value on success and throws
 * an `Error` with the `SchemaIssue.Issue` in its `cause` on encoding failure.
 *
 * @category encoding
 * @since 3.10.0
 */
export declare function encodeUnknownSync<S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions): (input: unknown, options?: AST.ParseOptions) => S["Encoded"];
/**
 * Creates a synchronous encoder for input already typed as the schema's decoded
 * `Type`.
 *
 * **Details**
 *
 * The returned function returns the schema's `Encoded` value on success and throws
 * an `Error` with the `SchemaIssue.Issue` in its `cause` on encoding failure.
 *
 * @category encoding
 * @since 3.10.0
 */
export declare const encodeSync: <S extends Schema.Encoder<unknown>>(schema: S, options?: AST.ParseOptions) => (input: S["Type"], options?: AST.ParseOptions) => S["Encoded"];
//# sourceMappingURL=SchemaParser.d.ts.map