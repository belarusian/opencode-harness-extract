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
    readonly schema?: unknown;
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
export declare function tool<T>(name: string, description: string, execute: (input: T) => Effect.Effect<unknown, Error>, schema?: unknown): Tool<T>;
/**
 * Validate tool input against JSON schema
 */
export declare function validateToolInput<T>(input: unknown, schema: unknown): Effect.Effect<T, Error>;
declare const ToolExecutor_base: Context.ServiceClass<ToolExecutor, "opencode-harness/ToolExecutor", ToolExecutorShape>;
/**
 * Tool execution service - executes tools with proper error handling
 */
export declare class ToolExecutor extends ToolExecutor_base {
}
export interface ToolExecutorShape {
    readonly execute: <T>(tool: Tool<T>, input: T) => Effect.Effect<unknown, Error>;
    readonly executeWithRetry: <T>(tool: Tool<T>, input: T, maxRetries?: number, delayMs?: number) => Effect.Effect<unknown, Error>;
    readonly executeTools: <T>(tools: Array<{
        tool: Tool<T>;
        input: T;
    }>) => Effect.Effect<Array<unknown>, Error>;
}
/**
 * Tool executor implementation
 */
export declare const makeToolExecutor: Layer.Layer<ToolExecutor, never, never>;
/**
 * Layer for ToolExecutor
 */
export declare const ToolExecutorLayer: Layer.Layer<ToolExecutor, never, never>;
declare const ToolCache_base: Context.ServiceClass<ToolCache, "opencode-harness/ToolCache", ToolCacheShape>;
/**
 * Tool cache for caching tool execution results
 */
export declare class ToolCache extends ToolCache_base {
}
export interface ToolCacheShape {
    readonly get: <T>(key: string) => Effect.Effect<T | undefined, Error>;
    readonly set: <T>(key: string, value: T) => Effect.Effect<void, Error>;
    readonly clear: () => Effect.Effect<void, Error>;
}
/**
 * In-memory tool cache implementation
 */
export declare const makeToolCache: Layer.Layer<ToolCache, never, never>;
/**
 * Layer for ToolCache
 */
export declare const ToolCacheLayer: Layer.Layer<ToolCache, never, never>;
/**
 * Combined layer for tool execution with caching
 */
export declare const ToolLayer: Layer.Layer<ToolExecutor, never, never>;
export {};
//# sourceMappingURL=tool.d.ts.map