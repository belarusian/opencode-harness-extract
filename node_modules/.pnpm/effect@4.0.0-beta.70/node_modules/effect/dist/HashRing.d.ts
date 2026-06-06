import type { Pipeable } from "./Pipeable.ts";
import * as PrimaryKey from "./PrimaryKey.ts";
declare const TypeId: "~effect/cluster/HashRing";
/**
 * A weighted consistent-hashing ring for assigning inputs to nodes with stable
 * remapping as nodes are added or removed.
 *
 * **Details**
 *
 * Nodes are identified by their `PrimaryKey` value and can be iterated from the
 * ring.
 *
 * @category models
 * @since 3.19.0
 */
export interface HashRing<A extends PrimaryKey.PrimaryKey> extends Pipeable, Iterable<A> {
    readonly [TypeId]: typeof TypeId;
    readonly baseWeight: number;
    totalWeightCache: number;
    readonly nodes: Map<string, [node: A, weight: number]>;
    ring: Array<[hash: number, node: string]>;
}
/**
 * Checks whether a value is a `HashRing`.
 *
 * @category guards
 * @since 3.19.0
 */
export declare const isHashRing: (u: unknown) => u is HashRing<any>;
/**
 * Creates an empty `HashRing`.
 *
 * **Details**
 *
 * `baseWeight` controls how many virtual points are added for a node with
 * weight `1`; it defaults to `128` and is clamped to at least `1`.
 *
 * @category constructors
 * @since 3.19.0
 */
export declare const make: <A extends PrimaryKey.PrimaryKey>(options?: {
    readonly baseWeight?: number | undefined;
}) => HashRing<A>;
/**
 * Add new nodes to the ring. If a node already exists in the ring, it
 * will be updated. For example, you can use this to update the node's weight.
 *
 * @category combinators
 * @since 3.19.0
 */
export declare const addMany: {
    /**
     * Add new nodes to the ring. If a node already exists in the ring, it
     * will be updated. For example, you can use this to update the node's weight.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(nodes: Iterable<A>, options?: {
        readonly weight?: number | undefined;
    }): (self: HashRing<A>) => HashRing<A>;
    /**
     * Add new nodes to the ring. If a node already exists in the ring, it
     * will be updated. For example, you can use this to update the node's weight.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, nodes: Iterable<A>, options?: {
        readonly weight?: number | undefined;
    }): HashRing<A>;
};
/**
 * Add a new node to the ring. If the node already exists in the ring, it
 * will be updated. For example, you can use this to update the node's weight.
 *
 * @category combinators
 * @since 3.19.0
 */
export declare const add: {
    /**
     * Add a new node to the ring. If the node already exists in the ring, it
     * will be updated. For example, you can use this to update the node's weight.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(node: A, options?: {
        readonly weight?: number | undefined;
    }): (self: HashRing<A>) => HashRing<A>;
    /**
     * Add a new node to the ring. If the node already exists in the ring, it
     * will be updated. For example, you can use this to update the node's weight.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, node: A, options?: {
        readonly weight?: number | undefined;
    }): HashRing<A>;
};
/**
 * Removes the node from the ring. No-op's if the node does not exist.
 *
 * @category combinators
 * @since 3.19.0
 */
export declare const remove: {
    /**
     * Removes the node from the ring. No-op's if the node does not exist.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(node: A): (self: HashRing<A>) => HashRing<A>;
    /**
     * Removes the node from the ring. No-op's if the node does not exist.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, node: A): HashRing<A>;
};
/**
 * Checks whether the ring contains a node with the same `PrimaryKey` value.
 *
 * @category combinators
 * @since 3.19.0
 */
export declare const has: {
    /**
     * Checks whether the ring contains a node with the same `PrimaryKey` value.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(node: A): (self: HashRing<A>) => boolean;
    /**
     * Checks whether the ring contains a node with the same `PrimaryKey` value.
     *
     * @category combinators
     * @since 3.19.0
     */
    <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, node: A): boolean;
};
/**
 * Gets the node which should handle the given input. Returns undefined if
 * the hashring has no elements with weight.
 *
 * @category combinators
 * @since 3.19.0
 */
export declare const get: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, input: string) => A | undefined;
/**
 * Distributes `count` shards across the nodes in the ring, attempting to
 * balance the number of shards allocated to each node. Returns undefined if
 * the hashring has no elements with weight.
 *
 * @category combinators
 * @since 3.19.0
 */
export declare const getShards: <A extends PrimaryKey.PrimaryKey>(self: HashRing<A>, count: number) => Array<A> | undefined;
export {};
//# sourceMappingURL=HashRing.d.ts.map