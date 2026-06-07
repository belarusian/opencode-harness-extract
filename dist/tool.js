/**
 * Tool execution utilities
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
/**
 * Create a tool with optional schema validation
 */
export function tool(name, description, execute, schema) {
    return {
        schema: { name, description, execute, schema },
    };
}
/**
 * Validate tool input against JSON schema
 */
export function validateToolInput(input, schema) {
    return Effect.try({
        try: () => {
            if (!schema) {
                return input;
            }
            // Simple schema validation - in production, use ajv or similar
            if (typeof schema === "object" && schema !== null) {
                const s = schema;
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
            return input;
        },
        catch: (error) => new Error(`Tool input validation failed: ${error}`),
    });
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
        // Validate input if schema is provided
        if (tool.schema.schema) {
            yield* Effect.logInfo(`[ToolExecutor] Validating input against schema`);
            yield* validateToolInput(input, tool.schema.schema);
        }
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