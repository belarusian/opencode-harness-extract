/**
 * Client-side worker primitives shared by browser, Node, and Bun platform
 * packages.
 *
 * A `WorkerPlatform` turns a numeric worker id into a long-lived `Worker`
 * client using a runtime-specific `Spawner`. This module is the low-level
 * building block used by worker-backed RPC clients and by platform adapters
 * that need to communicate with dedicated workers, shared workers,
 * `MessagePort`s, worker threads, or child-process transports while keeping
 * setup, message handling, and cleanup inside `Effect` scopes.
 *
 * The worker protocol separates spawning from message delivery. Calls to
 * `send` made before the platform reports readiness are buffered and flushed
 * after `run` receives the ready signal, so a spawned worker must eventually be
 * run or buffered messages will never leave the client. Message values are
 * passed through `postMessage`, which means callers are responsible for
 * encoding payloads into values supported by the selected runtime's structured
 * clone implementation. Transfer lists can avoid copies for buffers, ports, or
 * other transferable values, but ownership moves to the worker and invalid
 * transfer lists surface as `WorkerSendError`s. Incoming messages are handled
 * by forking each handler invocation into the worker run's `FiberSet`, so
 * processing is concurrent rather than serialized; use an explicit queue,
 * semaphore, or protocol-level acknowledgement when ordering or back pressure
 * matters.
 *
 * @since 4.0.0
 */
import * as Context from "../../Context.ts";
import type * as Deferred from "../../Deferred.ts";
import * as Effect from "../../Effect.ts";
import * as Layer from "../../Layer.ts";
import * as Scope from "../../Scope.ts";
import { WorkerError } from "./WorkerError.ts";
declare const WorkerPlatform_base: Context.ServiceClass<WorkerPlatform, "effect/workers/Worker/WorkerPlatform", {
    readonly spawn: <O = unknown, I = unknown>(id: number) => Effect.Effect<Worker<O, I>, WorkerError, Spawner>;
}>;
/**
 * Service that spawns effect `Worker` instances for numeric worker ids using
 * the configured `Spawner`.
 *
 * @category models
 * @since 4.0.0
 */
export declare class WorkerPlatform extends WorkerPlatform_base {
}
/**
 * Effect-based worker abstraction that can send input messages and run a
 * long-lived handler for output messages, failing with `WorkerError` or handler
 * errors.
 *
 * @category models
 * @since 4.0.0
 */
export interface Worker<O = unknown, I = unknown> {
    readonly send: (message: I, transfers?: ReadonlyArray<unknown>) => Effect.Effect<void, WorkerError>;
    readonly run: <A, E, R>(handler: (message: O) => Effect.Effect<A, E, R>, options?: {
        readonly onSpawn?: Effect.Effect<void> | undefined;
    } | undefined) => Effect.Effect<never, E | WorkerError, R>;
}
/**
 * Wraps platform-specific send and run functions into a `Worker`, translating
 * platform ready/data messages and running the optional `onSpawn` effect when
 * the worker reports readiness.
 *
 * @category models
 * @since 4.0.0
 */
export declare const makeUnsafe: (options: {
    readonly send: (message: unknown, transfers?: ReadonlyArray<unknown>) => Effect.Effect<void, WorkerError>;
    readonly run: <A, E, R>(handler: (message: PlatformMessage) => Effect.Effect<A, E, R>) => Effect.Effect<never, E | WorkerError, R>;
}) => Worker<any, any>;
/**
 * Internal worker platform protocol message: `[0]` signals readiness and
 * `[1, payload]` carries data.
 *
 * @category models
 * @since 4.0.0
 */
export type PlatformMessage = readonly [ready: 0] | readonly [data: 1, unknown];
/**
 * Phantom identifier for the service that maps worker ids to platform-specific
 * worker instances.
 *
 * @category models
 * @since 4.0.0
 */
export interface Spawner {
    readonly _: unique symbol;
}
/**
 * Context service tag for the worker `SpawnerFn`.
 *
 * @category tags
 * @since 4.0.0
 */
export declare const Spawner: Context.Service<Spawner, SpawnerFn<unknown>>;
/**
 * Function that creates or locates a platform-specific worker instance for a
 * numeric worker id.
 *
 * @category models
 * @since 4.0.0
 */
export interface SpawnerFn<W = unknown> {
    (id: number): W;
}
/**
 * Creates a layer that provides a worker `Spawner` service from a `SpawnerFn`.
 *
 * @category layers
 * @since 4.0.0
 */
export declare const layerSpawner: <W = unknown>(spawner: SpawnerFn<W>) => Layer.Layer<Spawner>;
/**
 * Creates a `WorkerPlatform` from platform-specific setup and listen hooks,
 * buffering sent messages until the worker is ready and scoping port cleanup to
 * the worker run.
 *
 * @category constructors
 * @since 4.0.0
 */
export declare const makePlatform: <W>() => <P extends {
    readonly postMessage: (message: any, transfers?: any | undefined) => void;
}>(options: {
    readonly setup: (options: {
        readonly worker: W;
        readonly scope: Scope.Scope;
    }) => Effect.Effect<P, WorkerError>;
    readonly listen: (options: {
        readonly port: P;
        readonly emit: (data: any) => void;
        readonly deferred: Deferred.Deferred<never, WorkerError>;
        readonly scope: Scope.Scope;
    }) => Effect.Effect<void>;
}) => WorkerPlatform["Service"];
export {};
//# sourceMappingURL=Worker.d.ts.map