/**
 * The `ShardId` module models the address of a shard inside an Effect Cluster
 * shard group. A shard id is made from a string `group` and numeric `id`, and
 * the module gives that pair stable equality, hashing, primary-key behavior,
 * schema support, and conversion to and from the `group:id` string form used by
 * routing and storage boundaries.
 *
 * **Common tasks**
 *
 * - Create or reuse a cached shard identifier with {@link make}
 * - Check runtime values with {@link isShardId}
 * - Encode or decode shard identifiers with {@link ShardId}
 * - Format for logs, persistence, or transport with {@link toString}
 * - Parse encoded shard keys with {@link fromString} or {@link fromStringEncoded}
 *
 * **Gotchas**
 *
 * - Equality and hashing are based on the `group:id` representation, so both
 *   fields must match for two shard ids to be equal
 * - Encoded strings are split at the last `:`; groups may contain colons, but
 *   ids must parse as numbers
 * - This module identifies shards after a routing or hashing decision; it does
 *   not choose a shard for an arbitrary entity key
 *
 * @since 4.0.0
 */
import * as Equal from "../../Equal.js";
import * as Hash from "../../Hash.js";
import { hasProperty } from "../../Predicate.js";
import * as PrimaryKey from "../../PrimaryKey.js";
import * as S from "../../Schema.js";
import * as Getter from "../../SchemaGetter.js";
const TypeId = "~effect/cluster/ShardId";
/**
 * Returns `true` when the value carries the `ShardId` runtime marker.
 *
 * @category guards
 * @since 4.0.0
 */
export const isShardId = u => hasProperty(u, TypeId);
/**
 * Schema for `ShardId` values encoded as `{ group, id }` objects and decoded via
 * `make`.
 *
 * @category schemas
 * @since 4.0.0
 */
export const ShardId = /*#__PURE__*/S.declare(isShardId, {
  toCodecJson: () => S.link()(S.Struct({
    group: S.String,
    id: S.Number
  }), {
    decode: Getter.transform(({
      group,
      id
    }) => make(group, id)),
    encode: Getter.passthrough()
  })
});
/**
 * Creates or reuses the cached `ShardId` for the specified shard group and numeric
 * id.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = (group, id) => {
  const key = `${group}:${id}`;
  let shardId = shardIdCache.get(key);
  if (!shardId) {
    shardId = makeProto(group, id);
    shardIdCache.set(key, shardId);
  }
  return shardId;
};
const shardIdCache = /*#__PURE__*/new Map();
const makeProto = (group, id) => {
  const self = Object.create(ShardIdProto);
  self.group = group;
  self.id = id;
  return self;
};
const ShardIdProto = {
  [TypeId]: TypeId,
  [Equal.symbol](that) {
    return this.group === that.group && this.id === that.id;
  },
  [Hash.symbol]() {
    return Hash.string(this.toString());
  },
  [PrimaryKey.symbol]() {
    return this.toString();
  },
  toString() {
    return `${this.group}:${this.id}`;
  }
};
/**
 * Formats a shard identifier as `group:id`.
 *
 * @category converting
 * @since 4.0.0
 */
export const toString = shardId => {
  return `${shardId.group}:${shardId.id}`;
};
/**
 * Parses a `group:id` string into plain shard id parts.
 *
 * **Details**
 *
 * Throws an `Error` when the string has no colon separator or the id segment is
 * not numeric.
 *
 * @category decoding
 * @since 4.0.0
 */
export function fromStringEncoded(s) {
  const index = s.lastIndexOf(":");
  if (index === -1) {
    throw new Error(`Invalid ShardId format`);
  }
  const group = s.substring(0, index);
  const id = Number(s.substring(index + 1));
  if (isNaN(id)) {
    throw new Error(`ShardId id must be a number`);
  }
  return {
    group,
    id
  };
}
/**
 * Parses a `group:id` string into a cached `ShardId`.
 *
 * **Details**
 *
 * Throws an `Error` when the string has no colon separator or the id segment is
 * not numeric.
 *
 * @category decoding
 * @since 4.0.0
 */
export function fromString(s) {
  const encoded = fromStringEncoded(s);
  return make(encoded.group, encoded.id);
}
//# sourceMappingURL=ShardId.js.map