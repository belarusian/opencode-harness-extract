/**
 * The `SchemaParser` module turns schemas into reusable runtime operations for
 * constructing, validating, decoding, and encoding values. It is the execution
 * layer behind a schema's AST: parsers walk the schema structure, apply
 * transformations, honor parse options, run checks, and report failures as
 * `SchemaIssue.Issue` values.
 *
 * Use this module when you need a parser with a specific result shape:
 * `Effect` for effectful parsing and service requirements, `Promise` for
 * JavaScript interop, `Exit` or `Result` when failures should stay in data,
 * `Option` for yes/no validation, and synchronous helpers when throwing is the
 * desired boundary.
 *
 * Decoding reads from the encoded/input side of a schema into its decoded
 * `Type`, while encoding runs the schema in the opposite direction. The
 * `make*` helpers construct decoded values and apply constructor defaults before
 * validation. Parse options supplied when a parser is created are merged with
 * options supplied at call time, and schema-level parse annotations can further
 * refine behavior.
 *
 * @since 4.0.0
 */
import * as Arr from "./Array.js";
import * as Cause from "./Cause.js";
import * as Effect from "./Effect.js";
import * as Exit from "./Exit.js";
import { identity, memoize } from "./Function.js";
import * as InternalAnnotations from "./internal/schema/annotations.js";
import * as Option from "./Option.js";
import * as Predicate from "./Predicate.js";
import * as Result from "./Result.js";
import * as AST from "./SchemaAST.js";
import * as Issue from "./SchemaIssue.js";
const recurDefaults = /*#__PURE__*/memoize(ast => {
  switch (ast._tag) {
    case "Declaration":
      {
        const getLink = ast.annotations?.[AST.ClassTypeId];
        if (Predicate.isFunction(getLink)) {
          const link = getLink(ast.typeParameters);
          const to = recurDefaults(link.to);
          return AST.replaceEncoding(ast, to === link.to ? [link] : [new AST.Link(to, link.transformation)]);
        }
        return ast;
      }
    case "Objects":
    case "Arrays":
      return ast.recur(ast => {
        const defaultValue = ast.context?.defaultValue;
        if (defaultValue) {
          return AST.replaceEncoding(recurDefaults(ast), defaultValue);
        }
        return recurDefaults(ast);
      });
    case "Suspend":
      return ast.recur(recurDefaults);
    default:
      return ast;
  }
});
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
export function makeEffect(schema) {
  const ast = recurDefaults(AST.toType(schema.ast));
  const parser = run(ast);
  return (input, options) => {
    return parser(input, options?.disableChecks ? options?.parseOptions ? {
      ...options.parseOptions,
      disableChecks: true
    } : {
      disableChecks: true
    } : options?.parseOptions);
  };
}
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
export function makeOption(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    return Exit.getSuccess(Effect.runSyncExit(parser(input, options)));
  };
}
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
export function make(schema) {
  const parser = makeEffect(schema);
  return (input, options) => {
    return Effect.runSync(Effect.mapErrorEager(parser(input, options), issue => new Error(issue.toString(), {
      cause: issue
    })));
  };
}
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
export function is(schema) {
  return _is(schema.ast);
}
/** @internal */
export function _is(ast) {
  const parser = asExit(run(AST.toType(ast)));
  return input => {
    return Exit.isSuccess(parser(input, AST.defaultParseOptions));
  };
}
/** @internal */
export function _issue(ast) {
  const parser = run(ast);
  return (input, options) => {
    return Effect.runSync(Effect.matchEager(parser(input, options), {
      onSuccess: () => undefined,
      onFailure: identity
    }));
  };
}
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
export function asserts(schema, input) {
  const parser = asExit(run(AST.toType(schema.ast)));
  const exit = parser(input, AST.defaultParseOptions);
  if (Exit.isFailure(exit)) {
    const issue = Cause.findError(exit.cause);
    if (Result.isFailure(issue)) {
      throw Cause.squash(issue.failure);
    }
    throw new Error(issue.success.toString(), {
      cause: issue.success
    });
  }
}
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
export function decodeUnknownEffect(schema, options) {
  const parser = run(schema.ast);
  return options === undefined ? parser : (input, overrideOptions) => parser(input, mergeParseOptions(options, overrideOptions));
}
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
export const decodeEffect = decodeUnknownEffect;
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
export function decodeUnknownPromise(schema, options) {
  return asPromise(decodeUnknownEffect(schema, options));
}
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
export function decodePromise(schema, options) {
  return asPromise(decodeEffect(schema, options));
}
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
export function decodeUnknownExit(schema, options) {
  return asExit(decodeUnknownEffect(schema, options));
}
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
export const decodeExit = decodeUnknownExit;
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
export function decodeUnknownOption(schema, options) {
  return asOption(decodeUnknownEffect(schema, options));
}
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
export const decodeOption = decodeUnknownOption;
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
export function decodeUnknownResult(schema, options) {
  return asResult(decodeUnknownEffect(schema, options));
}
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
export const decodeResult = decodeUnknownResult;
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
export function decodeUnknownSync(schema, options) {
  return asSync(decodeUnknownEffect(schema, options));
}
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
export const decodeSync = decodeUnknownSync;
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
export function encodeUnknownEffect(schema, options) {
  const parser = run(AST.flip(schema.ast));
  return options === undefined ? parser : (input, overrideOptions) => parser(input, mergeParseOptions(options, overrideOptions));
}
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
export const encodeEffect = encodeUnknownEffect;
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
export const encodeUnknownPromise = (schema, options) => asPromise(encodeUnknownEffect(schema, options));
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
export const encodePromise = encodeUnknownPromise;
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
export function encodeUnknownExit(schema, options) {
  return asExit(encodeUnknownEffect(schema, options));
}
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
export const encodeExit = encodeUnknownExit;
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
export function encodeUnknownOption(schema, options) {
  return asOption(encodeUnknownEffect(schema, options));
}
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
export const encodeOption = encodeUnknownOption;
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
export function encodeUnknownResult(schema, options) {
  return asResult(encodeUnknownEffect(schema, options));
}
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
export const encodeResult = encodeUnknownResult;
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
export function encodeUnknownSync(schema, options) {
  return asSync(encodeUnknownEffect(schema, options));
}
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
export const encodeSync = encodeUnknownSync;
const mergeParseOptions = (options, overrideOptions) => overrideOptions === undefined ? options : {
  ...options,
  ...overrideOptions
};
/** @internal */
export function run(ast) {
  const parser = recur(ast);
  return (input, options) => Effect.flatMapEager(parser(Option.some(input), options ?? AST.defaultParseOptions), oa => {
    if (oa._tag === "None") {
      return Effect.fail(new Issue.InvalidValue(oa));
    }
    return Effect.succeed(oa.value);
  });
}
function asPromise(parser) {
  return (input, options) => Effect.runPromise(parser(input, options));
}
function asExit(parser) {
  return (input, options) => Effect.runSyncExit(parser(input, options));
}
/** @internal */
export function asOption(parser) {
  const parserExit = asExit(parser);
  return (input, options) => Exit.getSuccess(parserExit(input, options));
}
function asResult(parser) {
  const parserExit = asExit(parser);
  return (input, options) => {
    const exit = parserExit(input, options);
    if (Exit.isSuccess(exit)) {
      return Result.succeed(exit.value);
    }
    const error = Cause.findError(exit.cause);
    if (Result.isFailure(error)) {
      throw Cause.squash(error.failure);
    }
    return Result.fail(error.success);
  };
}
function asSync(parser) {
  return (input, options) => Effect.runSync(Effect.mapErrorEager(parser(input, options), issue => new Error(issue.toString(), {
    cause: issue
  })));
}
const recur = /*#__PURE__*/memoize(ast => {
  let parser;
  const astOptions = InternalAnnotations.resolve(ast)?.["parseOptions"];
  if (!ast.context && !ast.encoding && !ast.checks) {
    return (ou, options) => {
      parser ??= ast.getParser(recur);
      if (astOptions) {
        options = {
          ...options,
          ...astOptions
        };
      }
      return parser(ou, options);
    };
  }
  const isStructural = AST.isArrays(ast) || AST.isObjects(ast) || AST.isDeclaration(ast) && ast.typeParameters.length > 0;
  return (ou, options) => {
    if (astOptions) {
      options = {
        ...options,
        ...astOptions
      };
    }
    const encoding = ast.encoding;
    let srou;
    if (encoding) {
      const links = encoding;
      const len = links.length;
      for (let i = len - 1; i >= 0; i--) {
        const link = links[i];
        const to = link.to;
        const parser = recur(to);
        srou = srou ? Effect.flatMapEager(srou, ou => parser(ou, options)) : parser(ou, options);
        if (link.transformation._tag === "Transformation") {
          const getter = link.transformation.decode;
          srou = Effect.flatMapEager(srou, ou => getter.run(ou, options));
        } else {
          srou = link.transformation.decode(srou, options);
        }
      }
      srou = Effect.mapErrorEager(srou, issue => new Issue.Encoding(ast, ou, issue));
    }
    parser ??= ast.getParser(recur);
    let sroa = srou ? Effect.flatMapEager(srou, ou => parser(ou, options)) : parser(ou, options);
    if (ast.checks && !options?.disableChecks) {
      const checks = ast.checks;
      if (options?.errors === "all" && isStructural && Option.isSome(ou)) {
        sroa = Effect.catchEager(sroa, issue => {
          const issues = [];
          AST.collectIssues(checks.filter(check => check.annotations?.[AST.STRUCTURAL_ANNOTATION_KEY]), ou.value, issues, ast, options);
          const out = Arr.isArrayNonEmpty(issues) ? issue._tag === "Composite" && issue.ast === ast ? new Issue.Composite(ast, issue.actual, [...issue.issues, ...issues]) : new Issue.Composite(ast, ou, [issue, ...issues]) : issue;
          return Effect.fail(out);
        });
      }
      sroa = Effect.flatMapEager(sroa, oa => {
        if (Option.isSome(oa)) {
          const value = oa.value;
          const issues = [];
          AST.collectIssues(checks, value, issues, ast, options);
          if (Arr.isArrayNonEmpty(issues)) {
            return Effect.fail(new Issue.Composite(ast, oa, issues));
          }
        }
        return Effect.succeed(oa);
      });
    }
    return sroa;
  };
});
//# sourceMappingURL=SchemaParser.js.map