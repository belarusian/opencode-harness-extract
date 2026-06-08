/**
 * Tool execution with proper definitions, context, and result formatting.
 *
 * Matches opencode/llm's Tool interface:
 * - Tool: description + parameters JSON Schema + execute handler
 * - ToolExecuteContext: callID, name
 * - ToolFailure: structured error type
 * - ToolResultValue: text/json/error/content union for results
 */

import * as Effect from "effect/Effect"
import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import * as Schema from "effect/Schema"
import type { ToolCallID } from "./schema/index.js"
import type { ToolResultValue } from "./schema/messages.js"

// --- ToolFailure ---

export class ToolFailure extends Schema.TaggedErrorClass<ToolFailure>()("ToolFailure", {
  message: Schema.String,
}) {}

/** Type alias for ToolFailure instance. */
export type ToolFailureType = InstanceType<typeof ToolFailure>

// --- ToolExecuteContext ---

export interface ToolExecuteContext {
  readonly id: ToolCallID
  readonly name: string
}

// --- Tool ---

/**
 * A type-safe LLM tool.
 */
export interface Tool {
  readonly name: string
  readonly description: string
  /** JSON Schema for tool input parameters */
  readonly jsonSchema: Record<string, unknown>
  readonly execute?: (params: unknown, context: ToolExecuteContext) => Effect.Effect<unknown, ToolFailureType>
}

/**
 * Create a dynamic tool with JSON Schema.
 */
export function makeDynamicTool(
  name: string,
  description: string,
  jsonSchema: Record<string, unknown>,
  execute?: (params: unknown, context: ToolExecuteContext) => Effect.Effect<unknown, ToolFailureType>,
): Tool {
  return {
    name,
    description,
    jsonSchema,
    execute,
  }
}

/**
 * Build a ToolDefinition-compatible object from a Tool.
 * This can be passed to LLM APIs that expect tool definitions.
 */
export function toToolDefinition(tool: Tool): {
  name: string
  description: string
  parameters: Record<string, unknown>
} {
  return {
    name: tool.name,
    description: tool.description,
    parameters: tool.jsonSchema,
  }
}

// --- ToolResult formatting ---

/**
 * Format a tool execution result into ToolResultValue.
 */
export function formatToolResult(result: unknown): ToolResultValue {
  if (result === null || result === undefined) {
    return { type: "text", value: "" }
  }

  if (typeof result === "string") {
    return { type: "text", value: result }
  }

  if (typeof result === "object") {
    // Check if it has a .text and .attachments pattern (like opencode tool output)
    const obj = result as Record<string, unknown>
    if (obj.output && typeof obj.output === "string") {
      return { type: "text", value: obj.output as string }
    }
    // Otherwise serialize as JSON
    return { type: "json", value: result }
  }

  return { type: "json", value: result }
}

// --- ToolExecutor Service ---

export class ToolExecutor extends Context.Service<ToolExecutor, ToolExecutorShape>()("opencode-harness/ToolExecutor") {}

export interface ToolExecutorShape {
  /**
   * Execute a single tool with the given input.
   */
  readonly execute: (
    tool: Tool,
    input: unknown,
    context: ToolExecuteContext,
  ) => Effect.Effect<ToolResultValue, ToolFailureType>

  /**
   * Execute multiple tools in parallel.
   */
  readonly executeTools: (
    tools: Array<{
      tool: Tool
      input: unknown
      context: ToolExecuteContext
    }>,
  ) => Effect.Effect<Array<{ name: string; success: boolean; result?: ToolResultValue; error?: ToolFailureType }>>
}

export const makeToolExecutor = Layer.effect(
  ToolExecutor,
  Effect.gen(function* () {
    const execute = (
      tool: Tool,
      input: unknown,
      context: ToolExecuteContext,
    ): Effect.Effect<ToolResultValue, ToolFailureType> => {
      return Effect.gen(function* () {
        yield* Effect.logInfo(`[ToolExecutor] Executing: ${tool.name}`)

        // Execute
        if (!tool.execute) {
          return { type: "text", value: `Tool ${tool.name} has no execute handler` }
        }

        const result = yield* Effect.tapError(
          tool.execute(input, context),
          (error) =>
            Effect.logError(`[ToolExecutor] ${tool.name} failed: ${error instanceof ToolFailure ? error.message : String(error)}`),
        )

        // Format result
        const formatted = formatToolResult(result)
        yield* Effect.logInfo(`[ToolExecutor] ${tool.name} completed`)
        return formatted
      })
    }

    const executeTools = (
      tools: Array<{ tool: Tool; input: unknown; context: ToolExecuteContext }>,
    ): Effect.Effect<Array<{ name: string; success: boolean; result?: ToolResultValue; error?: ToolFailureType }>> => {
      return Effect.forEach(
        tools,
        ({ tool, input, context }) =>
          execute(tool, input, context).pipe(
            Effect.map((result) => ({ name: tool.name, success: true, result })),
            Effect.catch((error: unknown) => {
              const toolFailure = error instanceof ToolFailure ? error : new ToolFailure({ message: String(error) })
              return Effect.succeed({ name: tool.name, success: false, error: toolFailure as unknown as ToolFailureType })
            }),
          ),
        { concurrency: "unbounded" },
      )
    }

    return ToolExecutor.of({ execute, executeTools })
  }),
)

export const ToolExecutorLayer = makeToolExecutor
