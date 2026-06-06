/**
 * The `EntityAddress` module defines the value used to locate an entity within
 * a cluster. An address combines the entity type, entity id, and shard id so
 * messages, persisted envelopes, workflow executions, and entity managers can
 * agree on the same routing target.
 *
 * **Common tasks**
 *
 * - Build an address after resolving an entity id to a shard with `Sharding`
 * - Attach an address to cluster envelopes and persisted messages
 * - Compare or hash addresses when tracking active or resuming entities
 *
 * **Gotchas**
 *
 * - The shard id is part of the address identity; the same entity type and id
 *   on a different shard is a different address.
 * - Entity ids should be routed through the same shard group logic used by the
 *   entity definition so messages are sent to the runner that owns the shard.
 *
 * @since 4.0.0
 */
import * as Equal from "../../Equal.ts";
import * as Hash from "../../Hash.ts";
import * as Schema from "../../Schema.ts";
import { EntityId } from "./EntityId.ts";
import { EntityType } from "./EntityType.ts";
import { ShardId } from "./ShardId.ts";
declare const TypeId = "~effect/cluster/EntityAddress";
declare const EntityAddress_base: Schema.Class<EntityAddress, Schema.Struct<{
    readonly shardId: Schema.declare<ShardId, ShardId>;
    readonly entityType: Schema.brand<Schema.String, "~effect/cluster/EntityType">;
    readonly entityId: Schema.brand<Schema.String, "~effect/cluster/EntityId">;
}>, {}>;
/**
 * Represents the unique address of an entity within the cluster.
 *
 * @category models
 * @since 4.0.0
 */
export declare class EntityAddress extends EntityAddress_base {
    /**
     * Marks this value as a cluster entity address for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/EntityAddress";
    /**
     * Formats the entity type, entity id, and shard id as a readable address.
     *
     * @since 4.0.0
     */
    toString(): string;
    /**
     * Compares entity addresses by entity type, entity id, and shard id.
     *
     * @since 4.0.0
     */
    [Equal.symbol](that: EntityAddress): boolean;
    /**
     * Computes a structural hash from the entity type, entity id, and shard id.
     *
     * @since 4.0.0
     */
    [Hash.symbol](): number;
}
/**
 * Constructs an `EntityAddress` from a shard ID, entity type, and entity ID.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (options: {
    readonly shardId: ShardId;
    readonly entityType: EntityType;
    readonly entityId: EntityId;
}) => EntityAddress;
export {};
//# sourceMappingURL=EntityAddress.d.ts.map