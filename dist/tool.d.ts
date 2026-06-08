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
import type { ToolCallID } from "./schema/index.js";
import type { ToolResultValue } from "./schema/messages.js";
declare const ToolFailure_base: Schema.Class<ToolFailure, Schema.TaggedStruct<"ToolFailure", {
    readonly message: Schema.String;
}>, import("effect/Cause").YieldableError>;
export declare class ToolFailure extends ToolFailure_base {
}
/** Type alias for ToolFailure instance. */
export type ToolFailureType = InstanceType<typeof ToolFailure>;
export interface ToolExecuteContext {
    readonly id: ToolCallID;
    readonly name: string;
}
/**
 * A type-safe LLM tool.
 */
export interface Tool {
    readonly name: string;
    readonly description: string;
    /** JSON Schema for tool input parameters */
    readonly jsonSchema: Record<string, unknown>;
    readonly execute?: (params: unknown, context: ToolExecuteContext) => Effect.Effect<unknown, ToolFailureType>;
}
/**
 * Create a dynamic tool with JSON Schema.
 */
export declare function makeDynamicTool(name: string, description: string, jsonSchema: Record<string, unknown>, execute?: (params: unknown, context: ToolExecuteContext) => Effect.Effect<unknown, ToolFailureType>): Tool;
/**
 * Build a ToolDefinition-compatible object from a Tool.
 * This can be passed to LLM APIs that expect tool definitions.
 */
export declare function toToolDefinition(tool: Tool): {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
};
/**
 * Format a tool execution result into ToolResultValue.
 */
export declare function formatToolResult(result: unknown): ToolResultValue;
declare const ToolExecutor_base: Context.ServiceClass<ToolExecutor, "opencode-harness/ToolExecutor", ToolExecutorShape>;
export declare class ToolExecutor extends ToolExecutor_base {
}
export interface ToolExecutorShape {
    /**
     * Execute a single tool with the given input.
     */
    readonly execute: (tool: Tool, input: unknown, context: ToolExecuteContext) => Effect.Effect<ToolResultValue, ToolFailureType>;
    /**
     * Execute multiple tools in parallel.
     */
    readonly executeTools: (tools: Array<{
        tool: Tool;
        input: unknown;
        context: ToolExecuteContext;
    }>) => Effect.Effect<Array<{
        name: string;
        success: boolean;
        result?: ToolResultValue;
        error?: ToolFailureType;
    }>>;
}
export declare const makeToolExecutor: Layer.Layer<ToolExecutor, never, never>;
export declare const ToolExecutorLayer: Layer.Layer<ToolExecutor, never, never>;
export {};
//# sourceMappingURL=tool.d.ts.map