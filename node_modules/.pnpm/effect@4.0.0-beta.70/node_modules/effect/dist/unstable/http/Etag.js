/**
 * Utilities for representing and generating HTTP entity tags.
 *
 * ETags are validators that identify a particular representation of a
 * resource. Servers commonly attach them to responses so clients and
 * intermediaries can revalidate cached content with conditional requests such
 * as `If-None-Match`, or protect updates with preconditions such as `If-Match`.
 *
 * This module models weak and strong ETags, formats them for the `ETag` header,
 * and provides generator layers that derive tags from file size and
 * modification-time metadata. Metadata-derived tags are convenient for static
 * files, but they are only as precise as the underlying metadata: choose strong
 * tags only when that metadata reliably changes for every byte-level change,
 * and use weak tags when the validator is suitable for cache revalidation but
 * not for operations that require byte-for-byte identity.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as Layer from "../../Layer.js";
import * as Option from "../../Option.js";
/**
 * Formats an `Etag` as an HTTP header value, including quotes and the `W/` prefix for weak tags.
 *
 * @category convertions
 * @since 4.0.0
 */
export const toString = self => {
  switch (self._tag) {
    case "Weak":
      return `W/"${self.value}"`;
    case "Strong":
      return `"${self.value}"`;
  }
};
/**
 * Service for generating ETags from filesystem file information or Web `File`-like metadata.
 *
 * @category models
 * @since 4.0.0
 */
export class Generator extends /*#__PURE__*/Context.Service()("effect/http/Etag/Generator") {}
const fromFileInfo = info => {
  const mtime = Option.match(info.mtime, {
    onNone: () => "0",
    onSome: mtime => mtime.getTime().toString(16)
  });
  return `${info.size.toString(16)}-${mtime}`;
};
const fromFileWeb = file => {
  return `${file.size.toString(16)}-${file.lastModified.toString(16)}`;
};
/**
 * Layer that provides a `Generator` which produces strong ETags from file size and modification time metadata.
 *
 * @category layers
 * @since 4.0.0
 */
export const layer = /*#__PURE__*/Layer.succeed(Generator)({
  fromFileInfo(info) {
    return Effect.sync(() => ({
      _tag: "Strong",
      value: fromFileInfo(info)
    }));
  },
  fromFileWeb(file) {
    return Effect.sync(() => ({
      _tag: "Strong",
      value: fromFileWeb(file)
    }));
  }
});
/**
 * Layer that provides a `Generator` which produces weak ETags from file size and modification time metadata.
 *
 * @category layers
 * @since 4.0.0
 */
export const layerWeak = /*#__PURE__*/Layer.succeed(Generator)({
  fromFileInfo(info) {
    return Effect.sync(() => ({
      _tag: "Weak",
      value: fromFileInfo(info)
    }));
  },
  fromFileWeb(file) {
    return Effect.sync(() => ({
      _tag: "Weak",
      value: fromFileWeb(file)
    }));
  }
});
//# sourceMappingURL=Etag.js.map