/**
 * The `EntityId` module provides a branded string identifier for addressing a
 * specific entity instance inside the cluster. Entity ids are commonly used as
 * stable routing keys when sending messages to an entity, looking up its state,
 * or deriving the shard responsible for that entity.
 *
 * Because routing is based on the exact string value, choose ids that are
 * deterministic, normalized, and unique within the entity type you are
 * addressing. Avoid display names or other values that may change over time.
 *
 * @since 4.0.0
 */
import * as Schema from "../../Schema.js";
/**
 * Schema for branded string entity identifiers used inside the cluster.
 *
 * @category constructors
 * @since 4.0.0
 */
export const EntityId = /*#__PURE__*/Schema.String.pipe(/*#__PURE__*/Schema.brand("~effect/cluster/EntityId"));
/**
 * Brands a string as an `EntityId`.
 *
 * @category constructors
 * @since 4.0.0
 */
export const make = id => id;
//# sourceMappingURL=EntityId.js.map