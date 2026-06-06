/**
 * Tool execution utilities
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
export function tool(name, description, execute) {
    return {
        schema: { name, description, execute },
    };
}
/**
 * Tool execution service - executes tools with proper error handling
 */
export class ToolExecutor extends Context.Service()("opencode-harness/ToolExecutor") {
}
/**
 * Tool executor implementation
 */
export const makeToolExecutor = Layer.succeed(ToolExecutor, {
    execute: (tool, input) => Effect.gen(function* () {
        yield* Effect.logInfo(`[ToolExecutor] Executing tool: ${tool.schema.name}`);
        const result = yield* Effect.tapError(tool.schema.execute(input), (error) => Effect.logError(`[ToolExecutor] Tool ${tool.schema.name} failed: ${error.message}`));
        yield* Effect.logInfo(`[ToolExecutor] Tool ${tool.schema.name} completed`);
        return result;
    })
});
/**
 * Layer for ToolExecutor
 */
export const ToolExecutorLayer = makeToolExecutor;
/**
 * Tool cache for caching tool execution results
 */
export class ToolCache extends Context.Service()("opencode-harness/ToolCache") {
}
/**
 * In-memory tool cache implementation
 */
export const makeToolCache = Layer.succeed(ToolCache, {
    get: (key) => Effect.sync(() => {
        const cached = cache.get(key);
        return cached;
    }),
    set: (key, value) => Effect.sync(() => {
        cache.set(key, value);
    }),
    clear: () => Effect.sync(() => {
        cache.clear();
    })
});
// In-memory cache storage
const cache = new Map();
/**
 * Layer for ToolCache
 */
export const ToolCacheLayer = makeToolCache;
/**
 * Combined layer for tool execution with caching
 */
export const ToolLayer = Layer.provide(ToolCacheLayer)(ToolExecutorLayer);
//# sourceMappingURL=tool.js.map