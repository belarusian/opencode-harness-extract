/**
 * SQL-backed storage for encrypted event-log servers.
 *
 * This module provides the encrypted server-side storage implementation used
 * when event-log entries should be durable in a SQL database without exposing
 * plaintext event data to that database. It is intended for remote event-log
 * servers, sync services, and multi-client deployments where the server assigns
 * stable sequence numbers and broadcasts changes while clients retain control of
 * event encryption and decryption.
 *
 * The storage creates dialect-specific tables for the server remote id and
 * session authentication bindings, then creates per-identity/store entry tables
 * using a SHA-256-derived table suffix. Those entry tables store IVs, entry ids,
 * encrypted entry bytes, and the SQL sequence used for ordering. Operators
 * should account for these dynamically created tables in migrations, backups,
 * retention policies, and table-prefix changes. Encryption key material is not
 * stored here, so rotating encryption schemes or moving data between databases
 * requires compatibility with the clients that produced the encrypted entries.
 *
 * @since 4.0.0
 */
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import type * as Scope from "../../Scope.ts";
import * as SqlClient from "../sql/SqlClient.ts";
import type * as SqlError from "../sql/SqlError.ts";
import * as EventLogEncryption from "./EventLogEncryption.ts";
import * as EventLogServerEncrypted from "./EventLogServerEncrypted.ts";
/**
 * Creates encrypted event-log server `Storage` backed by SQL.
 *
 * **Details**
 *
 * It persists the server remote id, session authentication bindings, and encrypted
 * entries in dialect-specific tables, creating per-identity/store entry tables as
 * needed.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makeStorage: (options?: {
    readonly entryTablePrefix?: string;
    readonly remoteIdTable?: string;
    readonly insertBatchSize?: number;
}) => Effect.Effect<EventLogServerEncrypted.Storage["Service"], SqlError.SqlError, SqlClient.SqlClient | EventLogEncryption.EventLogEncryption | Scope.Scope>;
/**
 * Provides encrypted server `Storage` using the SQL-backed implementation.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerStorage: (options?: {
    readonly entryTablePrefix?: string;
    readonly remoteIdTable?: string;
    readonly insertBatchSize?: number;
}) => Layer.Layer<EventLogServerEncrypted.Storage, SqlError.SqlError, SqlClient.SqlClient | EventLogEncryption.EventLogEncryption>;
/**
 * Provides SQL-backed encrypted server `Storage` and supplies the default Web
 * Crypto `EventLogEncryption` layer.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerStorageSubtle: (options?: {
    readonly entryTablePrefix?: string;
    readonly remoteIdTable?: string;
    readonly insertBatchSize?: number;
}) => Layer.Layer<EventLogServerEncrypted.Storage, SqlError.SqlError, SqlClient.SqlClient>;
//# sourceMappingURL=SqlEventLogServerEncrypted.d.ts.map