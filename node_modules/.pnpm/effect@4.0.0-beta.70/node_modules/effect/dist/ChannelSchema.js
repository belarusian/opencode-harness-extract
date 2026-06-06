import * as Channel from "./Channel.js";
import * as Effect from "./Effect.js";
import { dual } from "./Function.js";
import * as Schema from "./Schema.js";
/**
 * Creates a channel that encodes non-empty chunks of schema values into the
 * schema's encoded representation.
 *
 * **Details**
 *
 * Encoding failures are emitted as `SchemaError`, and any encoding services
 * required by the schema become channel requirements.
 *
 * @category constructors
 * @since 4.0.0
 */
export const encode = schema => () => {
  const encode = Schema.encodeEffect(Schema.NonEmptyArray(schema));
  return Channel.fromTransform((upstream, _scope) => Effect.succeed(Effect.flatMap(upstream, chunk => encode(chunk))));
};
/**
 * Creates an `encode` channel variant whose encoded output chunks are typed as
 * `unknown`.
 *
 * **When to use**
 *
 * Use this at channel boundaries where the encoded representation is
 * intentionally untyped, while still encoding typed input chunks with the
 * provided schema.
 *
 * @category constructors
 * @since 4.0.0
 */
export const encodeUnknown = encode;
/**
 * Creates a channel that decodes non-empty chunks from the schema's encoded
 * representation into schema values.
 *
 * **Details**
 *
 * Decoding failures are emitted as `SchemaError`, and any decoding services
 * required by the schema become channel requirements.
 *
 * @category constructors
 * @since 4.0.0
 */
export const decode = schema => () => {
  const decode = Schema.decodeEffect(Schema.NonEmptyArray(schema));
  return Channel.fromTransform((upstream, _scope) => Effect.succeed(Effect.flatMap(upstream, chunk => decode(chunk))));
};
/**
 * Creates a `decode` channel variant for schema-decoding channel boundaries.
 *
 * **Details**
 *
 * The channel decodes non-empty encoded chunks into schema values, emits
 * `SchemaError` when decoding fails, and requires the schema's decoding
 * services.
 *
 * @category constructors
 * @since 4.0.0
 */
export const decodeUnknown = decode;
/**
 * Wraps a channel so callers work with typed input and output chunks while the
 * wrapped channel uses encoded chunks.
 *
 * **Details**
 *
 * Values sent into the resulting channel are encoded with `inputSchema` before
 * reaching the wrapped channel. Values emitted by the wrapped channel are
 * decoded with `outputSchema` before they are emitted downstream. Schema
 * failures are surfaced as `SchemaError`.
 *
 * @category combinators
 * @since 4.0.0
 */
export const duplex = /*#__PURE__*/dual(2, (self, options) => encode(options.inputSchema)().pipe(Channel.pipeTo(self), Channel.pipeTo(decode(options.outputSchema)())));
/**
 * Like `duplex`, but for channels whose encoded side is not statically typed.
 *
 * **Details**
 *
 * The resulting channel accepts typed input chunks, encodes them with
 * `inputSchema`, decodes unknown output chunks with `outputSchema`, and
 * surfaces schema failures as `SchemaError`.
 *
 * @category combinators
 * @since 4.0.0
 */
export const duplexUnknown = duplex;
//# sourceMappingURL=ChannelSchema.js.map