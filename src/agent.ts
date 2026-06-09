/**
 * Agent loop — multi-step tool execution with follow-up rounds.
 *
 * This module provides two paths:
 *
 * 1. **Synchronous (runAgent)** — Call it, get a result. Collects all events
 *    per round, executes tools, builds messages for next round. Returns
 *    AgentLoopResult when complete.
 *
 * 2. **Reactive (streamAgent)** — Stream of LLMEvents. Text deltas, tool calls,
 *    tool results, and more text deltas all flow through the same Stream.
 *    Tools are executed internally, results emitted as tool-result events.
 *
 * Both paths share the same loop logic; the difference is whether events are
 * collected per round or forwarded to the caller.
 */

import * as Effect from "effect/Effect"
import * as Stream from "effect/Stream"
import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import { LLMClient, LLMClientLayer, LLMConfig, simpleRequest } from "./client.js"
import { ToolExecutor, ToolExecutorLayer, ToolFailureType, ToolExecuteContext, Tool } from "./tool.js"

import {
  LLMResponse as _LLMResponse,
  LLMEvent,
  Message as _Message,
  ToolChoice as _ToolChoice,
  ContentPart,
  ToolCallPart,
  ToolResultPart,
  FinishReason,
  Usage,
} from "./schema/index.js"
import * as Schema from "effect/Schema"

type LLMResponse = Schema.Schema.Type<typeof _LLMResponse>
type Message = Schema.Schema.Type<typeof _Message>

// --- Agent Loop Types ---

/**
 * A tool that can be called by the agent during the loop.
 * Has a typed execute handler with AgentToolContext.
 */
export interface AgentTool {
  readonly name: string
  readonly description: string
  readonly jsonSchema: Record<string, unknown>
  readonly execute: (params: unknown, context: AgentToolContext) => Effect.Effect<unknown, ToolFailureType>
}

/**
 * Convert an AgentTool to a plain Tool for the ToolExecutor.
 * Wraps the execute handler to inject step/round context.
 */
function toTool(agentTool: AgentTool, round: number): Tool {
  return {
    name: agentTool.name,
    description: agentTool.description,
    jsonSchema: agentTool.jsonSchema,
    execute: (params, ctx) => agentTool.execute(params, { ...ctx, step: round, round }),
  }
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
 * Result of running the agent loop synchronously.
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
   * Run the agent loop synchronously: stream → execute tools → repeat.
   * Returns AgentLoopResult when complete.
   */
  readonly run: (input: AgentLoopInput) => Effect.Effect<AgentLoopResult, Error>

  /**
   * Run the agent loop reactively: returns Stream<LLMEvent> with all events
   * including text deltas, tool calls, tool results, and more text deltas
   * across rounds.
   */
  readonly stream: (input: AgentLoopInput) => Stream.Stream<LLMEvent, Error>
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
  /** Generation options — passed through to the LLM request */
   readonly generation?: Record<string, unknown>
   /** Optional custom client layer (default: LLMClientLayer with caching) */
   readonly clientLayer?: Layer.Layer<LLMClient, never>
   /** Optional custom executor layer (default: ToolExecutorLayer) */
   readonly executorLayer?: Layer.Layer<ToolExecutor, never>
}

// --- Agent Loop Implementation ---

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
 * Helper: extract finish reason from events using proper tagged union narrowing.
 */
function extractFinishReason(events: LLMEvent[]): FinishReason | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]
    if (event.type === "finish") {
      return (event as Extract<LLMEvent, { type: "finish" }>).reason
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
 * Helper: extract usage from step-finish events.
 */
function extractUsage(events: LLMEvent[]): Usage | undefined {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i]
    if (event.type === "step-finish") {
      const stepFinish = event as Extract<LLMEvent, { type: "step-finish" }>
      if (stepFinish.usage) {
        return stepFinish.usage
      }
    }
  }
  return undefined
}

/**
 * Helper: build a final response from events with usage tracking.
 */
function buildResponse(events: LLMEvent[], accumulatedUsage: Usage | undefined): LLMResponse {
  const text = extractText(events)
  const finishReason = extractFinishReason(events)
  const usage = extractUsage(events)

  // Accumulate usage across rounds
  let finalUsage = accumulatedUsage
  if (usage) {
    if (!finalUsage) {
      finalUsage = usage
    } else {
      // Merge usage: add tokens from this round to accumulated
      finalUsage = new Usage({
        inputTokens: (finalUsage.inputTokens ?? 0) + (usage.inputTokens ?? 0),
        outputTokens: (finalUsage.outputTokens ?? 0) + (usage.outputTokens ?? 0),
        totalTokens: (finalUsage.totalTokens ?? 0) + (usage.totalTokens ?? 0),
        reasoningTokens: (finalUsage.reasoningTokens ?? 0) + (usage.reasoningTokens ?? 0),
        cacheReadInputTokens: (finalUsage.cacheReadInputTokens ?? 0) + (usage.cacheReadInputTokens ?? 0),
      })
    }
  }

  const contentParts: ContentPart[] = []
  if (text.trim()) {
    contentParts.push({ type: "text", text })
  }
  return new _LLMResponse({
    content: contentParts,
    finish: finishReason,
    usage: finalUsage,
  })
}

/**
 * Helper: build assistant content parts from events.
 */
function buildAssistantContent(events: LLMEvent[]): ContentPart[] {
  const parts: ContentPart[] = []
  const toolCalls = extractToolCalls(events)
  for (const tc of toolCalls) {
    parts.push(ToolCallPart.make({ id: tc.id, name: tc.name, input: tc.input }))
  }
  const text = extractText(events)
  if (text.trim()) {
    parts.push({ type: "text", text })
  }
  return parts
}

/**
 * Stop condition helper: stop after N steps.
 * Mirrors opencode's stepCountIs pattern.
 */
export function stepCountIs(maxSteps: number): StopWhen {
  return (state) => state.round >= maxSteps
}

// --- Internal loop state for both run and stream ---

interface LoopState {
  round: number
  history: Array<{ role: string; content: string }>
  richHistory: Message[]
  toolCallCount: number
  lastFinishReason: FinishReason | undefined
  lastText: string
  accumulatedUsage: Usage | undefined
}

// --- Stream implementation ---

/**
 * Internal: run the agent loop and emit events through a stream.
 * Tools are executed internally, results emitted as tool-result events.
 */
function runAgentStream(input: AgentLoopInput): Stream.Stream<LLMEvent, Error> {
  const maxSteps = input.maxSteps ?? 10

  const initialState: LoopState = {
    round: 0,
    history: input.messages.map((m) => ({ role: m.role, content: m.content })),
    richHistory: [],
    toolCallCount: 0,
    lastFinishReason: undefined,
    lastText: "",
    accumulatedUsage: undefined,
  }

  const toolDefs = input.tools.map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.jsonSchema,
  }))
  const toolChoice = input.toolChoice ? _ToolChoice.make(input.toolChoice) : undefined

  const loopStep = (
    state: LoopState,
    clientLayer: Layer.Layer<LLMClient>,
    executorLayer: Layer.Layer<ToolExecutor>,
  ): Stream.Stream<LLMEvent, Error> => {
    const { round, history, richHistory, toolCallCount, accumulatedUsage } = state

    // Build the LLM request
    const request = simpleRequest(input.config, history, {
      system: input.system,
      tools: toolDefs,
      toolChoice,
      responseFormat: input.responseFormat,
      generation: input.generation,
    })

    // Stream the model
    const modelStream = Stream.unwrap(
      Effect.gen(function* () {
        const client = yield* Effect.provide(clientLayer)(LLMClient)
        return client.stream(request)
      }),
    )

    // Process events and decide whether to continue
    return Stream.unwrap(
      Effect.gen(function* () {
        // Collect events from the stream
        const events = yield* modelStream.pipe(Stream.runCollect)

        // Extract state from events
        const text = extractText(events)
        const finishReason = extractFinishReason(events)
        const toolCallEvents = extractToolCalls(events)
        const hasToolCalls = toolCallEvents.length > 0
        const usage = extractUsage(events)

        // Update accumulated usage
        let newAccumulatedUsage = accumulatedUsage
        if (usage) {
          if (!newAccumulatedUsage) {
            newAccumulatedUsage = usage
          } else {
            newAccumulatedUsage = new Usage({
              inputTokens: (newAccumulatedUsage.inputTokens ?? 0) + (usage.inputTokens ?? 0),
              outputTokens: (newAccumulatedUsage.outputTokens ?? 0) + (usage.outputTokens ?? 0),
              totalTokens: (newAccumulatedUsage.totalTokens ?? 0) + (usage.totalTokens ?? 0),
              reasoningTokens: (newAccumulatedUsage.reasoningTokens ?? 0) + (usage.reasoningTokens ?? 0),
              cacheReadInputTokens: (newAccumulatedUsage.cacheReadInputTokens ?? 0) + (usage.cacheReadInputTokens ?? 0),
            })
          }
        }

        // Emit step-finish event for this round
        const stepFinishEvent = LLMEvent.stepFinish({
          index: round,
          reason: finishReason ?? "unknown",
          usage: usage,
        })

        // Emit finish event
        const finishEvent = LLMEvent.finish({
          reason: finishReason ?? "unknown",
          usage: newAccumulatedUsage,
        })

        // If no tool calls, emit final events and stop
        if (!hasToolCalls) {
          return Stream.fromIterable([
            ...events,
            stepFinishEvent,
            finishEvent,
          ])
        }

        // Execute tool calls
        const toolCallMap = new Map<string, AgentTool>()
        for (const tool of input.tools) {
          toolCallMap.set(tool.name, tool)
        }

        // Filter out tool calls with missing IDs
        const validToolCalls = toolCallEvents.filter((tc) => tc.id && tc.id.trim())

        if (validToolCalls.length === 0) {
          // Model returned tool-calls finish reason but no valid tool calls
          return Stream.fromIterable([
            ...events,
            stepFinishEvent,
            finishEvent,
          ])
        }

        // Execute tools via ToolExecutor
        const executor = yield* Effect.provide(executorLayer)(ToolExecutor)
        const results = yield* executor.executeTools(
          validToolCalls.map((tc) => {
            const agentTool = toolCallMap.get(tc.name)
            if (!agentTool) {
              return {
                tool: toTool(
                  {
                    name: tc.name,
                    description: "",
                    jsonSchema: {},
                    execute: () => Effect.succeed({ type: "text" as const, value: `Tool not found: ${tc.name}` }),
                  },
                  round + 1,
                ),
                input: tc.input,
                context: {
                  id: tc.id,
                  name: tc.name,
                },
              }
            }
            return {
              tool: toTool(agentTool, round + 1),
              input: tc.input,
              context: {
                id: tc.id,
                name: tc.name,
              },
            }
          }),
        )

        // Build assistant message with tool calls
        const assistantContent = buildAssistantContent(events)
        const assistantMessage = _Message.make({ role: "assistant", content: assistantContent })
        const richHistoryWithAssistant = [...richHistory, assistantMessage]

        // Build tool result messages and emit tool-result events
        const toolResults: ContentPart[] = []
        let newToolCallCount = toolCallCount + results.length

        const toolResultEvents: LLMEvent[] = []
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          const toolCall = validToolCalls[i]

          if (result.success && result.result) {
            toolResults.push(ToolResultPart.make({
              id: toolCall.id,
              name: toolCall.name,
              result: result.result,
            }))
            toolResultEvents.push(LLMEvent.toolResult({
              id: toolCall.id,
              name: toolCall.name,
              result: result.result,
            }))
          } else {
            toolResults.push(ToolResultPart.make({
              id: toolCall.id,
              name: toolCall.name,
              result: {
                type: "error",
                value: result.error?.message ?? "Unknown error",
              },
            }))
            toolResultEvents.push(LLMEvent.toolResult({
              id: toolCall.id,
              name: toolCall.name,
              result: {
                type: "error",
                value: result.error?.message ?? "Unknown error",
              },
            }))
          }
        }

        const richHistoryWithTools = [...richHistoryWithAssistant, _Message.make({ role: "tool", content: toolResults })]

        // Build next round's messages
        const assistantContentStr = assistantContent.map((p) => {
          if (p.type === "text") return p.text
          if (p.type === "tool-call") return `[tool-call: ${p.name}]`
          return ""
        }).join("\n")

        const toolContentStr = toolResults
          .filter((p): p is Extract<ContentPart, { type: "tool-result" }> => p.type === "tool-result")
          .map((p) => {
            const value = typeof p.result.value === "string" ? p.result.value : JSON.stringify(p.result.value)
            return `[tool-result: ${p.name}]: ${value}`
          })
          .join("\n")

        const newHistory = [
          ...history,
          { role: "assistant", content: assistantContentStr },
          { role: "tool", content: toolContentStr },
        ]

        // Check stop condition
        const state: AgentLoopState = {
          round: round + 1,
          messageCount: newHistory.length,
          toolCallCount: newToolCallCount,
          lastFinishReason: finishReason,
          hasToolCalls: true,
          lastText: text,
        }

        if (input.stopWhen && input.stopWhen(state)) {
          return Stream.fromIterable([
            ...events,
            ...toolResultEvents,
            stepFinishEvent,
            finishEvent,
          ])
        }

        // Check max steps
        if (round + 1 >= maxSteps) {
          return Stream.fromIterable([
            ...events,
            ...toolResultEvents,
            stepFinishEvent,
            finishEvent,
          ])
        }

        // Continue with next round
        const nextState: LoopState = {
          round: round + 1,
          history: newHistory,
          richHistory: richHistoryWithTools,
          toolCallCount: newToolCallCount,
          lastFinishReason: finishReason,
          lastText: text,
          accumulatedUsage: newAccumulatedUsage,
        }

        return Stream.concat(
          Stream.fromIterable([...events, ...toolResultEvents]),
          loopStep(nextState, clientLayer, executorLayer),
        )
      }),
    )
  }

  return Stream.unwrap(
    Effect.gen(function* () {
      const clientLayer = input.clientLayer ?? LLMClientLayer
      const executorLayer = input.executorLayer ?? ToolExecutorLayer
      return loopStep(initialState, clientLayer, executorLayer)
    }),
  )
}

// --- Service implementation ---

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
        let accumulatedUsage: Usage | undefined = undefined

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
            generation: input.generation,
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
            const response = buildResponse(lastEvents, accumulatedUsage)

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
            const response = buildResponse(lastEvents, accumulatedUsage)
            return {
              response,
              rounds: round,
              toolCallCount,
              messages: richHistory,
              stopReason: "stop",
            }
          }

          // Execute tools via ToolExecutor
          // Convert AgentTool to Tool, injecting round context into AgentToolContext
          const executor = yield* Effect.provide(executorLayer)(ToolExecutor)
          const results = yield* executor.executeTools(
            validToolCalls.map((tc) => {
              const agentTool = toolCallMap.get(tc.name)
              if (!agentTool) {
                return {
                  tool: toTool(
                    {
                      name: tc.name,
                      description: "",
                      jsonSchema: {},
                      execute: () => Effect.succeed({ type: "text" as const, value: `Tool not found: ${tc.name}` }),
                    },
                    round,
                  ),
                  input: tc.input,
                  context: {
                    id: tc.id,
                    name: tc.name,
                  },
                }
              }
              return {
                tool: toTool(agentTool, round),
                input: tc.input,
                context: {
                  id: tc.id,
                  name: tc.name,
                },
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
              toolResults.push(
                ToolResultPart.make({
                  id: toolCall.id,
                  name: toolCall.name,
                  result: result.result,
                }),
              )
            } else {
              toolResults.push(
                ToolResultPart.make({
                  id: toolCall.id,
                  name: toolCall.name,
                  result: {
                    type: "error",
                    value: result.error?.message ?? "Unknown error",
                  },
                }),
              )
            }
          }
          richHistory.push(_Message.make({ role: "tool", content: toolResults }))

          // Build next round's messages from history
          const assistantContentStr = assistantContent.map((p) => {
            if (p.type === "text") return p.text
            if (p.type === "tool-call") return `[tool-call: ${p.name}]`
            return ""
          }).join("\n")

          const toolContentStr = toolResults
            .filter((p): p is Extract<ContentPart, { type: "tool-result" }> => p.type === "tool-result")
            .map((p) => {
              const value = typeof p.result.value === "string" ? p.result.value : JSON.stringify(p.result.value)
              return `[tool-result: ${p.name}]: ${value}`
            })
            .join("\n")

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
            const response = buildResponse(lastEvents, accumulatedUsage)
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
        const response = buildResponse(lastEvents, accumulatedUsage)
        return {
          response,
          rounds: round,
          toolCallCount,
          messages: richHistory,
          stopReason: "maxSteps",
        }
      })
    }

    const stream = (input: AgentLoopInput): Stream.Stream<LLMEvent, Error> => {
      return runAgentStream(input)
    }

    return AgentLoop.of({ run, stream })
  }),
)

export const AgentLoopLayer = makeAgentLoop.pipe(
  Layer.provide(LLMClientLayer),
  Layer.provide(ToolExecutorLayer),
)

/**
 * Convenience: run the agent loop synchronously with default layers.
 */
export function runAgent(input: AgentLoopInput): Effect.Effect<AgentLoopResult, Error> {
  return Effect.gen(function* () {
    const loop = yield* Effect.provide(AgentLoopLayer)(AgentLoop)
    return yield* loop.run(input)
  })
}

/**
 * Convenience: run the agent loop reactively with default layers.
 * Returns Stream<LLMEvent> with all events including text deltas, tool calls,
 * tool results, and more text deltas across rounds.
 */
export function streamAgent(input: AgentLoopInput): Stream.Stream<LLMEvent, Error> {
  return Stream.unwrap(
    Effect.gen(function* () {
      const loop = yield* Effect.provide(AgentLoopLayer)(AgentLoop)
      return loop.stream(input)
    }),
  )
}
