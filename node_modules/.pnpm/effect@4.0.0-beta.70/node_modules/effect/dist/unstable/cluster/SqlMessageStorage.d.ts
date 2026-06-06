import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import * as SqlClient from "../sql/SqlClient.ts";
import * as MessageStorage from "./MessageStorage.ts";
import type { ShardingConfig } from "./ShardingConfig.ts";
import * as Snowflake from "./Snowflake.ts";
/**
 * Creates a SQL-backed `MessageStorage` implementation, running its migrations
 * and using the optional table prefix.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (options?: {
    readonly prefix?: string | undefined;
}) => Effect.Effect<MessageStorage.MessageStorage["Service"], never, SqlClient.SqlClient | Snowflake.Generator>;
/**
 * Layer that provides SQL-backed `MessageStorage` using the default table prefix
 * and the default snowflake generator.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<MessageStorage.MessageStorage, never, SqlClient.SqlClient | ShardingConfig>;
/**
 * Layer that provides SQL-backed `MessageStorage` using a custom table prefix.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerWith: (options: {
    readonly prefix?: string | undefined;
}) => Layer.Layer<MessageStorage.MessageStorage, never, SqlClient.SqlClient | ShardingConfig>;
//# sourceMappingURL=SqlMessageStorage.d.ts.map