/**
 * Tool execution with proper definitions, context, and result formatting.
 *
 * Matches opencode/llm's Tool interface:
 * - Tool: description + parameters JSON Schema + execute handler
 * - ToolExecuteContext: callID, name
 * - ToolFailure: structured error type
 * - ToolResultValue: text/json/error/content union for results
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
// --- ToolFailure ---
export class ToolFailure extends Schema.TaggedErrorClass()("ToolFailure", {
    message: Schema.String,
}) {
}
/**
 * Create a dynamic tool with JSON Schema.
 */
export function makeDynamicTool(name, description, jsonSchema, execute) {
    return {
        name,
        description,
        jsonSchema,
        execute,
    };
}
/**
 * Build a ToolDefinition-compatible object from a Tool.
 * This can be passed to LLM APIs that expect tool definitions.
 */
export function toToolDefinition(tool) {
    return {
        name: tool.name,
        description: tool.description,
        parameters: tool.jsonSchema,
    };
}
// --- ToolResult formatting ---
/**
 * Format a tool execution result into ToolResultValue.
 */
export function formatToolResult(result) {
    if (result === null || result === undefined) {
        return { type: "text", value: "" };
    }
    if (typeof result === "string") {
        return { type: "text", value: result };
    }
    if (typeof result === "object") {
        // Check if it has a .text and .attachments pattern (like opencode tool output)
        const obj = result;
        if (obj.output && typeof obj.output === "string") {
            return { type: "text", value: obj.output };
        }
        // Otherwise serialize as JSON
        return { type: "json", value: result };
    }
    return { type: "json", value: result };
}
// --- ToolExecutor Service ---
export class ToolExecutor extends Context.Service()("opencode-harness/ToolExecutor") {
}
export const makeToolExecutor = Layer.effect(ToolExecutor, Effect.gen(function* () {
    const execute = (tool, input, context) => {
        return Effect.gen(function* () {
            yield* Effect.logInfo(`[ToolExecutor] Executing: ${tool.name}`);
            // Execute
            if (!tool.execute) {
                return { type: "text", value: `Tool ${tool.name} has no execute handler` };
            }
            const result = yield* Effect.tapError(tool.execute(input, context), (error) => Effect.logError(`[ToolExecutor] ${tool.name} failed: ${error instanceof ToolFailure ? error.message : String(error)}`));
            // Format result
            const formatted = formatToolResult(result);
            yield* Effect.logInfo(`[ToolExecutor] ${tool.name} completed`);
            return formatted;
        });
    };
    const executeTools = (tools) => {
        return Effect.forEach(tools, ({ tool, input, context }) => execute(tool, input, context).pipe(Effect.map((result) => ({ name: tool.name, success: true, result })), Effect.catch((error) => {
            const toolFailure = error instanceof ToolFailure ? error : new ToolFailure({ message: String(error) });
            return Effect.succeed({ name: tool.name, success: false, error: toolFailure });
        })), { concurrency: "unbounded" });
    };
    return ToolExecutor.of({ execute, executeTools });
}));
export const ToolExecutorLayer = makeToolExecutor;
//# sourceMappingURL=tool.js.map