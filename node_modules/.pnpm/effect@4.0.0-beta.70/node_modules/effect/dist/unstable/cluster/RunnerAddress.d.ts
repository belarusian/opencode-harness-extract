/**
 * The `RunnerAddress` module defines the network identity used to locate a
 * cluster runner. A runner address is a host and port pair that can be encoded,
 * compared, hashed, inspected, and used as a stable primary key.
 *
 * **Common use cases**
 *
 * - Representing the target runner for cluster routing and placement decisions
 * - Persisting or exchanging runner endpoints through schemas
 * - Using runner endpoints as keys in maps, registries, or shard ownership data
 *
 * **Gotchas**
 *
 * - Identity is structural: two addresses are equal when both host and port match
 * - The primary key is formatted as `host:port`, so host strings should already
 *   be normalized for the routing layer using them
 *
 * @since 4.0.0
 */
import * as Equal from "../../Equal.ts";
import * as Hash from "../../Hash.ts";
import { NodeInspectSymbol } from "../../Inspectable.ts";
import * as PrimaryKey from "../../PrimaryKey.ts";
import * as Schema from "../../Schema.ts";
declare const TypeId = "~effect/cluster/RunnerAddress";
declare const RunnerAddress_base: Schema.Class<RunnerAddress, Schema.Struct<{
    readonly host: Schema.String;
    readonly port: Schema.Number;
}>, {}>;
/**
 * Network address of a cluster runner, identified by host and port.
 *
 * @category models
 * @since 4.0.0
 */
export declare class RunnerAddress extends RunnerAddress_base {
    /**
     * Marks this value as a cluster runner address for runtime guards.
     *
     * @since 4.0.0
     */
    readonly [TypeId] = "~effect/cluster/RunnerAddress";
    /**
     * Compares runner addresses by host and port.
     *
     * @since 4.0.0
     */
    [Equal.symbol](that: RunnerAddress): boolean;
    /**
     * Computes a structural hash from the host and port.
     *
     * @since 4.0.0
     */
    [Hash.symbol](): number;
    /**
     * Stable primary key used to identify the runner address.
     *
     * @since 4.0.0
     */
    [PrimaryKey.symbol](): string;
    /**
     * Formats the runner address with its host and port.
     *
     * @since 4.0.0
     */
    toString(): string;
    /**
     * Formats the runner address for Node.js inspection.
     *
     * @since 4.0.0
     */
    [NodeInspectSymbol](): string;
}
/**
 * Constructs a `RunnerAddress` from a host and port.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (host: string, port: number) => RunnerAddress;
export {};
//# sourceMappingURL=RunnerAddress.d.ts.map