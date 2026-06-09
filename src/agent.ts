/**
 * Agent loop — multi-step tool execution with follow-up rounds.
 *
 * Extracted from opencode's session/processor.ts + prompt.ts runLoop.
 *
 * The loop:
 * 1. Streams the model with current messages + tools
 * 2. On tool-calls finish reason, executes the tools
 * 3. Appends assistant + tool-result messages as a follow-up request
 * 4. Loops until stopWhen is satisfied or model returns stop
 *
 * This is the core "agentic" behavior — without it, the harness is
 * just a client. The caller composes the loop by providing tools
 * and a stop condition.
 */

import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import { LLMClient, LLMClientLayer, LLMConfig, simpleRequest } from "./client.js"
import { ToolExecutor, ToolExecutorLayer, ToolFailureType, ToolExecuteContext } from "./tool.js"

import {
  LLMResponse as _LLMResponse,
  LLMEvent,
  Message as _Message,
  ToolChoice as _ToolChoice,
  ContentPart,
  ToolCallPart,
  ToolResultPart,
  ToolResultValue,
  FinishReason,
} from "./schema/index.js"
import * as Schema from "effect/Schema"

type LLMResponse = Schema.Schema.Type<typeof _LLMResponse>
type Message = Schema.Schema.Type<typeof _Message>

// --- Agent Loop Types ---

/**
 * A tool that can be called by the agent during the loop.
 * Extends the base Tool interface with a typed execute handler.
 */
export interface AgentTool {
  readonly name: string
  readonly description: string
  readonly jsonSchema: Record<string, unknown>
  readonly execute: (params: unknown, context: AgentToolContext) => Effect.Effect<unknown, ToolFailureType>
}

/** Context passed to tool execute handlers during the agent loop. */
export interface AgentToolContext extends ToolExecuteContext {
  readonly step: number
  readonly round: number
}

/**
 * Stop condition predicate — receives the current round state
 * and returns true to stop the loop.
 */
export type StopWhen = (state: AgentLoopState) => boolean

/**
 * Current state of the agent loop, passed to stopWhen.
 */
export interface AgentLoopState {
  /** Current round number (1-indexed) */
  readonly round: number
  /** Total messages in the conversation history */
  readonly messageCount: number
  /** Number of tool calls made so far */
  readonly toolCallCount: number
  /** Last finish reason from the model */
  readonly lastFinishReason: FinishReason | undefined
  /** Whether the last round had tool calls */
  readonly hasToolCalls: boolean
  /** Accumulated text content from the last response */
  readonly lastText: string
}

/**
 * Result of running the agent loop.
 */
export interface AgentLoopResult {
  /** The final LLM response */
  readonly response: LLMResponse
  /** Total number of rounds executed */
  readonly rounds: number
  /** Total tool calls made across all rounds */
  readonly toolCallCount: number
  /** All messages exchanged during the loop */
  readonly messages: Message[]
  /** Stop reason — why the loop ended */
  readonly stopReason: "stop" | "maxSteps" | "stopWhen"
}

// --- AgentLoop Service ---

export class AgentLoop extends Context.Service<AgentLoop, AgentLoopShape>()("opencode-harness/AgentLoop") {}

export interface AgentLoopShape {
  /**
   * Run the agent loop: stream → execute tools → repeat.
   */
  readonly run: (input: AgentLoopInput) => Effect.Effect<AgentLoopResult, Error>
}

/**
 * Input for the agent loop.
 */
export interface AgentLoopInput {
  /** LLM configuration */
  readonly config: LLMConfig
  /** Initial user messages */
  readonly messages: Array<{ role: string; content: string }>
  /** Optional system prompt */
  readonly system?: string | string[]
  /** Tools available to the agent */
  readonly tools: AgentTool[]
  /** Stop condition — called after each round */
  readonly stopWhen?: StopWhen
  /** Maximum number of rounds (default: 10) */
  readonly maxSteps?: number
  /** Tool choice mode */
  readonly toolChoice?: "auto" | "none" | "required"
  /** Response format */
  readonly responseFormat?: "text" | "json"
  /** Generation options */
  readonly generation?: Record<string, unknown>
}

// --- AgentLoop Implementation ---

/**
 * Helper: extract text from events.
 */
function extractText(events: LLMEvent[]): string {
  let text = ""
  for (const event of events) {
    if (event.type === "text-delta") {
      text += event.text
    }
  }
  return text
}

/**
 * Helper: extract finish reason from events.
 */
function extractFinishReason(events: LLMEvent[]): FinishReason | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === "finish") {
      return (events[i] as any).reason as FinishReason | undefined
    }
  }
  return undefined
}

/**
 * Helper: extract tool-call events.
 */
function extractToolCalls(events: LLMEvent[]): Array<Extract<LLMEvent, { type: "tool-call" }>> {
  return events.filter((e) => e.type === "tool-call") as Array<Extract<LLMEvent, { type: "tool-call" }>>
}

/**
 * Helper: build a final response from events.
 */
function buildResponse(events: LLMEvent[]): LLMResponse {
  const text = extractText(events)
  const finishReason = extractFinishReason(events)
  const contentParts: ContentPart[] = []
  if (text.trim()) {
    contentParts.push({ type: "text", text })
  }
  return new _LLMResponse({
    content: contentParts,
    finish: finishReason,
    usage: undefined,
  })
}

/**
 * Helper: build assistant content parts from events.
 */
function buildAssistantContent(events: LLMEvent[]): ContentPart[] {
  const parts: ContentPart[] = []
  const toolCalls = extractToolCalls(events)
  for (const tc of toolCalls) {
    parts.push({
      type: "tool-call",
      id: tc.id,
      name: tc.name,
      input: tc.input,
    } as unknown as ToolCallPart)
  }
  const text = extractText(events)
  if (text.trim()) {
    parts.push({ type: "text", text })
  }
  return parts
}

export const makeAgentLoop = Layer.effect(
  AgentLoop,
  Effect.gen(function* () {
    const run = (input: AgentLoopInput): Effect.Effect<AgentLoopResult, Error> => {
      return Effect.gen(function* () {
        const maxSteps = input.maxSteps ?? 10
        const toolDefs = input.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.jsonSchema,
        }))
        const toolChoice = input.toolChoice ? _ToolChoice.make(input.toolChoice) : undefined

        // Track conversation history as plain messages
        let history: Array<{ role: string; content: string }> = input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        }))

        // Track rich history for result
        const richHistory: Message[] = []
        let toolCallCount = 0
        let round = 0
        let lastFinishReason: FinishReason | undefined = undefined
        let lastText = ""
        let lastEvents: LLMEvent[] = []

        const clientLayer = LLMClientLayer
        const executorLayer = ToolExecutorLayer

        while (round < maxSteps) {
          round++

          // Build the LLM request
          const request = simpleRequest(input.config, history, {
            system: input.system,
            tools: toolDefs,
            toolChoice,
            responseFormat: input.responseFormat,
            generation: input.generation as any,
          })

          // Stream the model
          const client = yield* Effect.provide(clientLayer)(LLMClient)
          const stream = client.stream(request)

          // Collect events from the stream
          const events = yield* stream.pipe(Stream.runCollect)
          lastEvents = [...events]

          // Extract text content
          lastText = extractText(lastEvents)
          lastFinishReason = extractFinishReason(lastEvents)

          // Check if we have tool calls in the response
          const toolCallEvents = extractToolCalls(lastEvents)
          const hasToolCalls = toolCallEvents.length > 0

          if (!hasToolCalls) {
            // No tool calls — build final response and exit
            const response = buildResponse(lastEvents)

            return {
              response,
              rounds: round,
              toolCallCount,
              messages: richHistory,
              stopReason: input.stopWhen ? "stopWhen" : "stop",
            }
          }

          // Execute tool calls
          const toolCallMap = new Map<string, AgentTool>()
          for (const tool of input.tools) {
            toolCallMap.set(tool.name, tool)
          }

          // Filter out tool calls with missing IDs (can happen with some providers)
          const validToolCalls = toolCallEvents.filter((tc) => tc.id && tc.id.trim())

          if (validToolCalls.length === 0) {
            // Model returned tool-calls finish reason but no valid tool calls
            // This means the model is stuck — treat as stop
            const response = buildResponse(lastEvents)
            return {
              response,
              rounds: round,
              toolCallCount,
              messages: richHistory,
              stopReason: "stop",
            }
          }

          // Execute tools via ToolExecutor
          const executor = yield* Effect.provide(executorLayer)(ToolExecutor)
          const results = yield* executor.executeTools(
            validToolCalls.map((tc) => {
              const agentTool = toolCallMap.get(tc.name)
              if (!agentTool) {
                return {
                  tool: {
                    name: tc.name,
                    description: "",
                    jsonSchema: {},
                    execute: () => Effect.succeed({ type: "text" as const, value: `Tool not found: ${tc.name}` }),
                  } as any,
                  input: tc.input,
                  context: {
                    id: tc.id,
                    name: tc.name,
                  } as ToolExecuteContext,
                }
              }
              return {
                tool: agentTool as any,
                input: tc.input,
                context: {
                  id: tc.id,
                  name: tc.name,
                } as ToolExecuteContext,
              }
            }),
          )

          toolCallCount += results.length

          // Build assistant message with tool calls
          const assistantContent = buildAssistantContent(lastEvents)
          richHistory.push(_Message.make({ role: "assistant", content: assistantContent }))

          // Build tool result messages
          const toolResults: ContentPart[] = []
          for (let i = 0; i < results.length; i++) {
            const result = results[i]
            const toolCall = validToolCalls[i]
            if (result.success && result.result) {
              toolResults.push({
                type: "tool-result",
                id: toolCall.id,
                name: toolCall.name,
                result: result.result as ToolResultValue,
              } as unknown as ToolResultPart)
            } else {
              toolResults.push({
                type: "tool-result",
                id: toolCall.id,
                name: toolCall.name,
                result: {
                  type: "error",
                  value: result.error?.message ?? "Unknown error",
                },
              } as unknown as ToolResultPart)
            }
          }
          richHistory.push(_Message.make({ role: "tool", content: toolResults }))

          // Build next round's messages from history
          const assistantContentStr = assistantContent.map((p) => {
            if (p.type === "text") return (p as { text: string }).text
            if (p.type === "tool-call") {
              const tc = p as unknown as { name: string; input: unknown }
              return `[tool-call: ${tc.name}]`
            }
            return ""
          }).join("\n")

          const toolContentStr = toolResults.map((p) => {
            const tr = p as unknown as { name: string; result: { type: string; value: unknown } }
            const value = typeof tr.result.value === "string" ? tr.result.value : JSON.stringify(tr.result.value)
            return `[tool-result: ${tr.name}]: ${value}`
          }).join("\n")

          history = [
            ...history,
            {
              role: "assistant",
              content: assistantContentStr,
            },
            {
              role: "tool",
              content: toolContentStr,
            },
          ]

          // Check stop condition
          const state: AgentLoopState = {
            round,
            messageCount: history.length,
            toolCallCount,
            lastFinishReason,
            hasToolCalls: true,
            lastText,
          }

          if (input.stopWhen && input.stopWhen(state)) {
            const response = buildResponse(lastEvents)
            return {
              response,
              rounds: round,
              toolCallCount,
              messages: richHistory,
              stopReason: "stopWhen",
            }
          }
        }

        // Max steps reached
        const response = buildResponse(lastEvents)
        return {
          response,
          rounds: round,
          toolCallCount,
          messages: richHistory,
          stopReason: "maxSteps",
        }
      })
    }

    return AgentLoop.of({ run })
  }),
)

export const AgentLoopLayer = makeAgentLoop.pipe(
  Layer.provide(LLMClientLayer),
  Layer.provide(ToolExecutorLayer),
)

/**
 * Convenience: run the agent loop with default layers.
 */
export function runAgent(input: AgentLoopInput): Effect.Effect<AgentLoopResult, Error> {
  return Effect.gen(function* () {
    const loop = yield* Effect.provide(AgentLoopLayer)(AgentLoop)
    return yield* loop.run(input)
  })
}
