/**
 * The `SchemaUtils` module contains focused helpers for schema patterns that
 * are useful but too specialized for the core `Schema` API surface.
 *
 * Use this module when you need to describe a native class with a schema while
 * keeping a plain struct as its encoded representation. This is especially
 * useful for classes such as `Data.Error` subclasses that should decode from
 * structured data, encode back to that data, and still preserve class identity
 * for instance checks and schema optics.
 *
 * **Gotchas**
 *
 * - The constructor is called with the decoded struct fields as a single
 *   argument, so the class constructor must accept that shape.
 * - Encoding uses the instance itself as the encoded shape, so the instance
 *   should expose properties compatible with the provided struct schema.
 *
 * @since 4.0.0
 */
import { identity } from "./Function.js";
import * as Schema from "./Schema.js";
import * as Transformation from "./SchemaTransformation.js";
/**
 * Builds an experimental schema for instances of a native class using a struct
 * schema as the encoded representation.
 *
 * **Details**
 *
 * Decoding constructs `new constructor(props)` from the encoded fields.
 * Encoding uses the instance as the encoded shape, so the class should expose
 * properties compatible with the provided encoding schema.
 *
 * @category schemas
 * @since 4.0.0
 */
export function getNativeClassSchema(constructor, options) {
  const transformation = Transformation.transform({
    decode: props => new constructor(props),
    encode: identity
  });
  return Schema.instanceOf(constructor, {
    toCodec: () => Schema.link()(options.encoding, transformation),
    ...options.annotations
  }).pipe(Schema.encodeTo(options.encoding, transformation));
}
//# sourceMappingURL=SchemaUtils.js.map