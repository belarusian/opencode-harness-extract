import * as PrimaryKey from "../../PrimaryKey.js";
import * as Request from "../../Request.js";
import * as Schema from "../../Schema.js";
/**
 * Property key used to attach success and error schemas to persistable
 * requests.
 *
 * @category Symbols
 * @since 4.0.0
 */
export const symbol = "~effect/persistence/Persistable";
/**
 * Creates request classes that implement `Persistable` and `Request.Request`.
 *
 * **Details**
 *
 * The generated class stores the supplied tag, derives its primary key from
 * the payload, and carries schemas for persisted success and error exits.
 *
 * @category constructors
 * @since 4.0.0
 */
export const Class = () => (tag, options) => {
  function Persistable(props) {
    this._tag = tag;
    if (props) {
      Object.assign(this, props);
    }
  }
  Persistable.prototype = {
    ...Request.RequestPrototype,
    [PrimaryKey.symbol]() {
      return options.primaryKey(this);
    },
    [symbol]: {
      success: options.success ?? Schema.Void,
      error: options.error ?? Schema.Never
    }
  };
  return Persistable;
};
/**
 * Returns the cached `Exit` schema for a persistable request's success and
 * error schemas.
 *
 * @category Accessors
 * @since 4.0.0
 */
export const exitSchema = self => {
  let schema = exitSchemaCache.get(self);
  if (schema) return schema;
  schema = Schema.Exit(self[symbol].success, self[symbol].error, Schema.Defect);
  exitSchemaCache.set(self, schema);
  return schema;
};
const exitSchemaCache = /*#__PURE__*/new WeakMap();
/**
 * Encodes an `Exit` for a persistable request using its success and error
 * schemas.
 *
 * @category Serialization
 * @since 4.0.0
 */
export const serializeExit = (self, exit) => {
  const schema = Schema.toCodecJson(exitSchema(self));
  return Schema.encodeEffect(schema)(exit);
};
/**
 * Decodes a persisted value into an `Exit` for a persistable request using its
 * success and error schemas.
 *
 * @category Serialization
 * @since 4.0.0
 */
export const deserializeExit = (self, encoded) => {
  const schema = Schema.toCodecJson(exitSchema(self));
  return Schema.decodeUnknownEffect(schema)(encoded);
};
//# sourceMappingURL=Persistable.js.map