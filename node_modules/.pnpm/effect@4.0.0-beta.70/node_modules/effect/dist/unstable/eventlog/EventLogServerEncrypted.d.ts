import * as Context from "../../Context.ts";
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import * as Schema from "../../Schema.ts";
import type * as Scope from "../../Scope.ts";
import * as Stream from "../../Stream.ts";
import * as RpcServer from "../rpc/RpcServer.ts";
import * as Transferable from "../workers/Transferable.ts";
import { type RemoteId } from "./EventJournal.ts";
import type { EncryptedRemoteEntry } from "./EventLogEncryption.ts";
import { type StoreId } from "./EventLogMessage.ts";
/**
 * Provides RPC handlers for the encrypted event-log server.
 *
 * **Details**
 *
 * Incoming encrypted write payloads are decoded and persisted through `Storage`;
 * change streams read encrypted entries from storage and encode them for the
 * remote protocol.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerRpcHandlers: Layer.Layer<import("./EventLogMessage.ts").EventLogAuthentication | import("../rpc/Rpc.ts").Handler<"EventLog.Hello"> | import("../rpc/Rpc.ts").Handler<"EventLog.Authenticate"> | import("../rpc/Rpc.ts").Handler<"EventLog.WriteChunked"> | import("../rpc/Rpc.ts").Handler<"EventLog.WriteSingle"> | import("../rpc/Rpc.ts").Handler<"EventLog.Changes">, never, Storage>;
/**
 * Provides an encrypted event-log RPC server using `EventLogRemoteRpcs` and the
 * encrypted server RPC handlers.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layer: Layer.Layer<never, never, RpcServer.Protocol | Storage>;
declare const PersistedEntry_base: Schema.Class<PersistedEntry, Schema.Struct<{
    readonly entryId: Schema.brand<Schema.instanceOf<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>, "effect/eventlog/EventJournal/EntryId">;
    readonly iv: Transferable.Transferable<Schema.instanceOf<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>>;
    readonly encryptedEntry: Transferable.Transferable<Schema.instanceOf<Uint8Array<ArrayBuffer>, Uint8Array<ArrayBuffer>>>;
}>, {}>;
/**
 * Encrypted entry representation persisted by the encrypted event-log server.
 *
 * @category storage
 * @since 4.0.0
 */
export declare class PersistedEntry extends PersistedEntry_base {
    /**
     * String representation of the encrypted entry id.
     *
     * @since 4.0.0
     */
    get entryIdString(): string;
}
declare const Storage_base: Context.ServiceClass<Storage, "effect/eventlog/EventLogServer/Storage", {
    readonly getId: Effect.Effect<RemoteId>;
    readonly getOrCreateSessionAuthBinding: (publicKey: string, signingPublicKey: Uint8Array<ArrayBuffer>) => Effect.Effect<Uint8Array<ArrayBuffer>>;
    readonly write: (publicKey: string, storeId: StoreId, entries: ReadonlyArray<PersistedEntry>) => Effect.Effect<ReadonlyArray<EncryptedRemoteEntry>>;
    readonly changes: (publicKey: string, storeId: StoreId, startSequence: number) => Stream.Stream<EncryptedRemoteEntry>;
}>;
/**
 * Storage service used by the encrypted event-log server.
 *
 * **Details**
 *
 * It provides the server remote id, stores session authentication bindings,
 * persists encrypted entries, and streams encrypted changes for a public key and
 * store id.
 *
 * @category storage
 * @since 4.0.0
 */
export declare class Storage extends Storage_base {
}
/**
 * Creates an in-memory encrypted server `Storage`.
 *
 * **Details**
 *
 * Data, session authentication bindings, and streams are process-local and are
 * released with the surrounding scope.
 *
 * @category storage
 * @since 4.0.0
 */
export declare const makeStorageMemory: Effect.Effect<Storage["Service"], never, Scope.Scope>;
/**
 * Provides encrypted server `Storage` using the in-memory implementation.
 *
 * @category storage
 * @since 4.0.0
 */
export declare const layerStorageMemory: Layer.Layer<Storage>;
export {};
//# sourceMappingURL=EventLogServerEncrypted.d.ts.map