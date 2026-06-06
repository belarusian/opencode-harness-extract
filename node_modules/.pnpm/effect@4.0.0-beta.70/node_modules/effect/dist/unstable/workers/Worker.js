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
import * as Context from "../../Context.js";
import * as Effect from "../../Effect.js";
import * as FiberSet from "../../FiberSet.js";
import * as Latch from "../../Latch.js";
import * as Layer from "../../Layer.js";
import * as Scope from "../../Scope.js";
import { WorkerError, WorkerSendError } from "./WorkerError.js";
/**
 * Service that spawns effect `Worker` instances for numeric worker ids using
 * the configured `Spawner`.
 *
 * @category models
 * @since 4.0.0
 */
export class WorkerPlatform extends /*#__PURE__*/Context.Service()("effect/workers/Worker/WorkerPlatform") {}
/**
 * Wraps platform-specific send and run functions into a `Worker`, translating
 * platform ready/data messages and running the optional `onSpawn` effect when
 * the worker reports readiness.
 *
 * @category models
 * @since 4.0.0
 */
export const makeUnsafe = options => ({
  send: options.send,
  run(handler, options_) {
    const onSpawn = options_?.onSpawn ?? Effect.void;
    return options.run(msg => {
      if (msg[0] === 0) return onSpawn;
      return handler(msg[1]);
    });
  }
});
/**
 * Context service tag for the worker `SpawnerFn`.
 *
 * @category tags
 * @since 4.0.0
 */
export const Spawner = /*#__PURE__*/Context.Service("effect/workers/Worker/Spawner");
/**
 * Creates a layer that provides a worker `Spawner` service from a `SpawnerFn`.
 *
 * @category layers
 * @since 4.0.0
 */
export const layerSpawner = /*#__PURE__*/Layer.succeed(Spawner);
/**
 * Creates a `WorkerPlatform` from platform-specific setup and listen hooks,
 * buffering sent messages until the worker is ready and scoping port cleanup to
 * the worker run.
 *
 * @category constructors
 * @since 4.0.0
 */
export const makePlatform = () => options => WorkerPlatform.of({
  spawn(id) {
    return Effect.gen(function* () {
      const spawn = yield* Spawner;
      let currentPort;
      const buffer = [];
      const run = (handler, opts) => Effect.uninterruptibleMask(restore => Effect.scopedWith(Effect.fnUntraced(function* (scope) {
        const port = yield* options.setup({
          worker: spawn(id),
          scope
        });
        yield* Scope.addFinalizer(scope, Effect.sync(() => {
          currentPort = undefined;
        }));
        const fiberSet = yield* FiberSet.make().pipe(Scope.provide(scope));
        const run = yield* FiberSet.runtime(fiberSet)();
        const ready = Latch.makeUnsafe();
        yield* options.listen({
          port,
          scope,
          emit(data) {
            if (data[0] === 0) {
              if (opts?.onSpawn) {
                run(Effect.ensuring(opts.onSpawn, ready.open));
              } else {
                ready.openUnsafe();
              }
              return;
            }
            run(handler(data[1]));
          },
          deferred: fiberSet.deferred
        });
        yield* ready.await;
        currentPort = port;
        if (buffer.length > 0) {
          for (const [message, transfers] of buffer) {
            port.postMessage([0, message], transfers);
          }
          buffer.length = 0;
        }
        return yield* restore(FiberSet.join(fiberSet));
      })));
      const send = (message, transfers) => Effect.suspend(() => {
        if (currentPort === undefined) {
          buffer.push([message, transfers]);
          return Effect.void;
        }
        try {
          currentPort.postMessage([0, message], transfers);
          return Effect.void;
        } catch (cause) {
          return Effect.fail(new WorkerError({
            reason: new WorkerSendError({
              message: "Failed to send message to worker",
              cause
            })
          }));
        }
      });
      return {
        run,
        send
      };
    });
  }
});
//# sourceMappingURL=Worker.js.map