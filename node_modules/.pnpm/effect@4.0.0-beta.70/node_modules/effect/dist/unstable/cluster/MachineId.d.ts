/**
 * The `MachineId` module provides the branded integer identifier used to
 * distinguish cluster runners when generating distributed ids and coordinating
 * runner state.
 *
 * **When to use**
 *
 * - Persisting or exchanging the machine id assigned to a cluster runner
 * - Passing a runner-specific identity to the cluster snowflake generator
 * - Decoding machine ids from storage while keeping them distinct from plain numbers
 *
 * **Gotchas**
 *
 * - Machine ids must be unique for concurrently active runners that generate snowflakes
 * - Snowflake ids store the machine component in 10 bits, so only the value modulo 1024 is encoded
 *
 * @since 4.0.0
 */
import * as Schema from "../../Schema.ts";
/**
 * Schema for branded integer machine identifiers used by the cluster.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const MachineId: Schema.brand<Schema.Int, "~effect/cluster/MachineId">;
/**
 * Branded integer type representing a cluster machine ID.
 *
 * @category models
 * @since 4.0.0
 */
export type MachineId = typeof MachineId.Type;
/**
 * Brands a number as a `MachineId`.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (id: number) => MachineId;
//# sourceMappingURL=MachineId.d.ts.map