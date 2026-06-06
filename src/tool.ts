/**
 * Tool execution utilities
 */

import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";

export interface ToolSchema<T> {
  readonly name: string;
  readonly description: string;
  readonly execute: (input: T) => Effect.Effect<unknown, Error>;
}

export interface Tool<T> {
  readonly schema: ToolSchema<T>;
}

export interface ToolFailure {
  readonly error: Error;
}

export function tool<T>(
  name: string,
  description: string,
  execute: (input: T) => Effect.Effect<unknown, Error>,
): Tool<T> {
  return {
    schema: { name, description, execute },
  };
}

/**
 * Tool execution service - executes tools with proper error handling
 */
export class ToolExecutor extends Context.Service<ToolExecutor, ToolExecutorShape>()("opencode-harness/ToolExecutor") {}

export interface ToolExecutorShape {
  readonly execute: <T>(
    tool: Tool<T>,
    input: T,
  ) => Effect.Effect<unknown, Error>;
}

/**
 * Tool executor implementation
 */
export const makeToolExecutor = Layer.succeed(
  ToolExecutor,
  {
    execute: <T>(tool: Tool<T>, input: T) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`[ToolExecutor] Executing tool: ${tool.schema.name}`);
        
        const result = yield* Effect.tapError(
          tool.schema.execute(input),
          (error) => Effect.logError(`[ToolExecutor] Tool ${tool.schema.name} failed: ${error.message}`)
        );
        
        yield* Effect.logInfo(`[ToolExecutor] Tool ${tool.schema.name} completed`);
        return result;
      })
  }
);

/**
 * Layer for ToolExecutor
 */
export const ToolExecutorLayer = makeToolExecutor;

/**
 * Tool cache for caching tool execution results
 */
export class ToolCache extends Context.Service<ToolCache, ToolCacheShape>()("opencode-harness/ToolCache") {}

export interface ToolCacheShape {
  readonly get: <T>(key: string) => Effect.Effect<T | undefined, Error>;
  readonly set: <T>(key: string, value: T) => Effect.Effect<void, Error>;
  readonly clear: () => Effect.Effect<void, Error>;
}

/**
 * In-memory tool cache implementation
 */
export const makeToolCache = Layer.succeed(
  ToolCache,
  {
    get: <T>(key: string) => Effect.sync(() => {
      const cached = cache.get(key);
      return cached as T | undefined;
    }),
    set: <T>(key: string, value: T) => Effect.sync(() => {
      cache.set(key, value);
    }),
    clear: () => Effect.sync(() => {
      cache.clear();
    })
  }
);

// In-memory cache storage
const cache: Map<string, unknown> = new Map();

/**
 * Layer for ToolCache
 */
export const ToolCacheLayer = makeToolCache;

/**
 * Combined layer for tool execution with caching
 */
export const ToolLayer = Layer.provide(ToolCacheLayer)(ToolExecutorLayer);
