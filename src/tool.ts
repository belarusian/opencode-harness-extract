/**
 * Tool execution utilities
 */

import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import * as d from "effect/Duration";

export interface ToolSchema<T> {
  readonly name: string;
  readonly description: string;
  readonly execute: (input: T) => Effect.Effect<unknown, Error>;
  readonly schema?: unknown; // Optional JSON schema for input validation
}

export interface Tool<T> {
  readonly schema: ToolSchema<T>;
}

export interface ToolFailure {
  readonly error: Error;
}

/**
 * Create a tool with optional schema validation
 */
export function tool<T>(
  name: string,
  description: string,
  execute: (input: T) => Effect.Effect<unknown, Error>,
  schema?: unknown,
): Tool<T> {
  return {
    schema: { name, description, execute, schema },
  };
}

/**
 * Validate tool input against JSON schema
 */
export function validateToolInput<T>(
  input: unknown,
  schema: unknown,
): Effect.Effect<T, Error> {
  return Effect.try({
    try: () => {
      if (!schema) {
        return input as T;
      }
      // Simple schema validation - in production, use ajv or similar
      if (typeof schema === "object" && schema !== null) {
        const s = schema as Record<string, unknown>;
        if (s.type === "object" && typeof input !== "object" || input === null) {
          throw new Error(`Expected object, got ${typeof input}`);
        }
        if (s.type === "string" && typeof input !== "string") {
          throw new Error(`Expected string, got ${typeof input}`);
        }
        if (s.type === "number" && typeof input !== "number") {
          throw new Error(`Expected number, got ${typeof input}`);
        }
        if (s.type === "boolean" && typeof input !== "boolean") {
          throw new Error(`Expected boolean, got ${typeof input}`);
        }
      }
      return input as T;
    },
    catch: (error) => new Error(`Tool input validation failed: ${error}`),
  });
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

  readonly executeWithRetry: <T>(
    tool: Tool<T>,
    input: T,
    maxRetries?: number,
    delayMs?: number,
  ) => Effect.Effect<unknown, Error>;

  readonly executeTools: <T>(
    tools: Array<{ tool: Tool<T>; input: T }>,
  ) => Effect.Effect<Array<{ tool: string; success: boolean; result?: unknown; error?: Error }>, Error>;
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
        
        // Validate input if schema is provided
        if (tool.schema.schema) {
          yield* Effect.logInfo(`[ToolExecutor] Validating input against schema`);
          yield* validateToolInput<T>(input, tool.schema.schema);
        }
        
        const result = yield* Effect.tapError(
          tool.schema.execute(input),
          (error) => Effect.logError(`[ToolExecutor] Tool ${tool.schema.name} failed: ${error.message}`)
        );
        
        yield* Effect.logInfo(`[ToolExecutor] Tool ${tool.schema.name} completed`);
        return result;
      }),

    executeWithRetry: <T>(tool: Tool<T>, input: T, maxRetries: number = 3, delayMs: number = 1000) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`[ToolExecutor] Executing tool with retry: ${tool.schema.name} (maxRetries=${maxRetries})`);
        
        let lastError: Error | undefined;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            yield* Effect.logInfo(`[ToolExecutor] Attempt ${attempt}/${maxRetries}`);
            
            // Validate input if schema is provided
            if (tool.schema.schema) {
              yield* validateToolInput<T>(input, tool.schema.schema);
            }
            
            const result = yield* tool.schema.execute(input);
            yield* Effect.logInfo(`[ToolExecutor] Tool ${tool.schema.name} succeeded on attempt ${attempt}`);
            return result;
          } catch (error) {
            lastError = error as Error;
            yield* Effect.logError(`[ToolExecutor] Attempt ${attempt} failed: ${lastError.message}`);
            
            if (attempt < maxRetries) {
              yield* Effect.logInfo(`[ToolExecutor] Retrying in ${delayMs}ms...`);
              yield* Effect.sleep(d.fromInputUnsafe(delayMs));
            }
          }
        }
        
        yield* Effect.logError(`[ToolExecutor] Tool ${tool.schema.name} failed after ${maxRetries} attempts`);
        return yield* Effect.fail(lastError || new Error(`Tool ${tool.schema.name} failed after ${maxRetries} attempts`));
      }),

    executeTools: <T>(tools: Array<{ tool: Tool<T>; input: T }>) =>
      Effect.gen(function* () {
        yield* Effect.logInfo(`[ToolExecutor] Executing ${tools.length} tools in parallel`);
        
        const results = yield* Effect.forEach(
          tools,
          ({ tool, input }) =>
            Effect.gen(function* () {
              yield* Effect.logInfo(`[ToolExecutor] Executing tool: ${tool.schema.name}`);
              
              // Validate input if schema is provided
              if (tool.schema.schema) {
                yield* Effect.logInfo(`[ToolExecutor] Validating input against schema`);
                yield* validateToolInput<T>(input, tool.schema.schema);
              }
              
              const result = yield* Effect.tapError(
                tool.schema.execute(input),
                (error) => Effect.logError(`[ToolExecutor] Tool ${tool.schema.name} failed: ${error.message}`)
              );
              
              yield* Effect.logInfo(`[ToolExecutor] Tool ${tool.schema.name} completed`);
              return {
                tool: tool.schema.name,
                success: true,
                result,
              } as const;
            }),
          { concurrency: "unbounded" }
        );
        
        yield* Effect.logInfo(`[ToolExecutor] All ${tools.length} tools completed`);
        return results as Array<{ tool: string; success: boolean; result?: unknown; error?: Error }>;
      }),
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
