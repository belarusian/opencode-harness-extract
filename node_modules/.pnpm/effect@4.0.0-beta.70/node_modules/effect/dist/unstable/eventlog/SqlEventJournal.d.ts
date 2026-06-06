import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import * as SqlClient from "../sql/SqlClient.ts";
import * as SqlError from "../sql/SqlError.ts";
import * as EventJournal from "./EventJournal.ts";
/**
 * Creates an `EventJournal` backed by a SQL database.
 *
 * **Details**
 *
 * The constructor creates the entry and remote metadata tables when needed,
 * persists local and remote entries, and uses the configured `SqlClient`.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const make: (options?: {
    readonly entryTable?: string;
    readonly remotesTable?: string;
}) => Effect.Effect<EventJournal.EventJournal["Service"], SqlError.SqlError, SqlClient.SqlClient>;
/**
 * Provides `EventJournal` using the SQL-backed implementation created by
 * `make`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: (options?: {
    readonly entryTable?: string;
    readonly remotesTable?: string;
}) => Layer.Layer<EventJournal.EventJournal, SqlError.SqlError, SqlClient.SqlClient>;
//# sourceMappingURL=SqlEventJournal.d.ts.map