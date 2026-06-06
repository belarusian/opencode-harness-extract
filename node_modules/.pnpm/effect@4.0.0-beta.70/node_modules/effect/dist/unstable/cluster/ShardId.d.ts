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
import * as Equal from "../../Equal.ts";
import * as Hash from "../../Hash.ts";
import * as PrimaryKey from "../../PrimaryKey.ts";
import * as S from "../../Schema.ts";
declare const TypeId = "~effect/cluster/ShardId";
/**
 * Identifier for a shard within a shard group, with equality, hashing, and primary
 * key behavior based on the `group:id` string form.
 *
 * @category models
 * @since 4.0.0
 */
export interface ShardId extends Equal.Equal, Hash.Hash, PrimaryKey.PrimaryKey {
    readonly [TypeId]: typeof TypeId;
    readonly group: string;
    readonly id: number;
}
/**
 * Returns `true` when the value carries the `ShardId` runtime marker.
 *
 * @category guards
 * @since 4.0.0
 */
export declare const isShardId: (u: unknown) => u is ShardId;
/**
 * Schema for `ShardId` values encoded as `{ group, id }` objects and decoded via
 * `make`.
 *
 * @category schemas
 * @since 4.0.0
 */
export declare const ShardId: S.declare<ShardId, ShardId>;
/**
 * Creates or reuses the cached `ShardId` for the specified shard group and numeric
 * id.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (group: string, id: number) => ShardId;
/**
 * Formats a shard identifier as `group:id`.
 *
 * @category converting
 * @since 4.0.0
 */
export declare const toString: (shardId: {
    readonly group: string;
    readonly id: number;
}) => string;
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
export declare function fromStringEncoded(s: string): {
    readonly group: string;
    readonly id: number;
};
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
export declare function fromString(s: string): ShardId;
export {};
//# sourceMappingURL=ShardId.d.ts.map