/**
 * SSE stream parser for OpenAI chat/completions streaming
 *
 * Converts OpenAI's SSE format into our unified LLMEvent stream.
 */

import * as Stream from "effect/Stream"
import {
  type LLMEvent,
  type LLMError,
  APIError,
  ToolCallID,
  ContentBlockID,
  Usage,
} from "../schema/index.js"

// --- OpenAI SSE chunk types ---

interface OpenAISSEChunk {
  id: string
  object: string
  created: number
  model: string
  choice: {
    index: number
    delta: {
      role?: string
      content?: string | null
      reasoning_content?: string | null
      tool_calls?: Array<{
        index: number
        id?: string
        type?: string
        function?: {
          name?: string
          arguments?: string
        }
      }>
      finish_reason?: string | null
    }
    logprobs?: unknown
    finish_reason?: string | null
  }[]
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
    prompt_tokens_details?: {
      cached_tokens?: number
      audio_tokens?: number
    }
    completion_tokens_details?: {
      reasoning_tokens?: number
      accepted_prediction_tokens?: number
      rejected_prediction_tokens?: number
    }
  }
  error?: {
    message: string
    type: string
    param?: string
    code: string
  }
}

// --- State machine ---

interface ParseState {
  toolCalls: Map<string, { id: string; name: string; args: string }>
  textBlockId: string
  reasoningBlockId: string
  stepIndex: number
  lastFinishReason: string | null
  usage: OpenAISSEChunk["usage"]
}

function initState(): ParseState {
  return {
    toolCalls: new Map(),
    textBlockId: "text-0",
    reasoningBlockId: "reasoning-0",
    stepIndex: 0,
    lastFinishReason: null,
    usage: undefined,
  }
}

/**
 * Parse an OpenAI SSE chunk into LLMEvents.
 */
function parseChunk(chunk: OpenAISSEChunk, state: ParseState): LLMEvent[] {
  const events: LLMEvent[] = []
  const choice = chunk.choice?.[0]
  if (!choice) return events

  const delta = choice.delta
  const finishReason = choice.finish_reason ?? (chunk.error ? "error" : null)

  if (finishReason) {
    state.lastFinishReason = finishReason
  }

  if (chunk.usage) {
    state.usage = chunk.usage
  }

  // Handle errors
  if (chunk.error) {
    events.push({
      type: "provider-error",
      message: chunk.error.message,
      retryable: chunk.error.code === "rate_limit_error" || chunk.error.code === "server_error",
    })
    return events
  }

  // Handle tool calls
  if (delta.tool_calls && delta.tool_calls.length > 0) {
    for (const tc of delta.tool_calls) {
      const key = `${tc.index}`
      let toolCall = state.toolCalls.get(key)

      // New tool call starting
      if (tc.id && !toolCall) {
        toolCall = {
          id: tc.id,
          name: tc.function?.name ?? "",
          args: "",
        }
        state.toolCalls.set(key, toolCall)

        events.push({
          type: "tool-input-start",
          id: ToolCallID.make(tc.id),
          name: tc.function?.name ?? "unknown",
        })

        if (tc.function?.name) {
          events.push({
            type: "tool-call",
            id: ToolCallID.make(tc.id),
            name: tc.function.name,
            input: {},
          })
        }
      }

      // Tool call continuing
      if (toolCall && tc.function?.arguments) {
        toolCall.args += tc.function.arguments
        events.push({
          type: "tool-input-delta",
          id: ToolCallID.make(toolCall.id),
          name: toolCall.name,
          text: tc.function.arguments,
        })
      }
    }
  }

  // Handle text content
  if (delta.content !== undefined && delta.content !== null) {
    events.push({
      type: "text-delta",
      id: ContentBlockID.make(state.textBlockId),
      text: delta.content,
    })
  }

  // Handle reasoning content
  if (delta.reasoning_content !== undefined && delta.reasoning_content !== null) {
    events.push({
      type: "reasoning-delta",
      id: ContentBlockID.make(state.reasoningBlockId),
      text: delta.reasoning_content,
    })
  }

  return events
}

/**
 * Flush state into final events.
 */
function flushState(state: ParseState): LLMEvent[] {
  const events: LLMEvent[] = []

  // Text end
  events.push({
    type: "text-end",
    id: ContentBlockID.make(state.textBlockId),
  })

  // Reasoning end
  events.push({
    type: "reasoning-end",
    id: ContentBlockID.make(state.reasoningBlockId),
  })

  // Tool input end + final tool-call with complete input
     for (const [key, tc] of state.toolCalls) {
        void key
    events.push({
      type: "tool-input-end",
      id: ToolCallID.make(tc.id),
      name: tc.name,
    })

    let parsedInput: unknown = {}
    try {
      parsedInput = JSON.parse(tc.args)
    } catch {
      parsedInput = tc.args
    }

    events.push({
      type: "tool-call",
      id: ToolCallID.make(tc.id),
      name: tc.name,
      input: parsedInput,
    })
  }

  // Step finish
  const finishReason = mapFinishReason(state.lastFinishReason)
  const usage = state.usage
    ? new Usage({
        inputTokens: state.usage.prompt_tokens,
        outputTokens: state.usage.completion_tokens,
        totalTokens: state.usage.total_tokens,
        reasoningTokens: state.usage.completion_tokens_details?.reasoning_tokens,
        cacheReadInputTokens: state.usage.prompt_tokens_details?.cached_tokens,
      })
    : undefined

  events.push({
    type: "step-finish",
    index: state.stepIndex,
    reason: finishReason,
    usage,
  })

  // Finish event
  if (state.lastFinishReason !== null) {
    events.push({
      type: "finish",
      reason: finishReason,
      usage,
    })
  }

  // Reset for next step
  state.stepIndex++
  state.toolCalls.clear()
  state.textBlockId = `text-${state.stepIndex}`
  state.reasoningBlockId = `reasoning-${state.stepIndex}`

  return events
}

function mapFinishReason(reason: string | null): Extract<LLMEvent, { type: "step-finish" }>["reason"] {
  if (!reason) return "unknown"
  switch (reason) {
    case "stop":
      return "stop"
    case "tool_calls":
      return "tool-calls"
    case "length":
      return "length"
    case "content_filter":
      return "content-filter"
    case "error":
      return "error"
    default:
      return "unknown"
  }
}

function parseSSELine(line: string): OpenAISSEChunk | null {
  if (!line.startsWith("data: ")) return null
  const data = line.slice(6)
  if (data === "[DONE]") return null
  try {
    return JSON.parse(data) as OpenAISSEChunk
  } catch {
    return null
  }
}

/**
 * Create a Stream<LLMEvent> from an OpenAI-compatible SSE endpoint.
 */
export function streamFromURL(
  url: string,
  headers: Record<string, string>,
  body: unknown,
  _options?: { modelID?: string },
): Stream.Stream<LLMEvent, LLMError> {
  const asyncGen = async function* () {
    const controller = new AbortController()
    let state = initState()
    let buffer = ""
    let emittedFinish = false

    // Emit step-start
    yield { type: "step-start", index: 0 } as LLMEvent

    const processChunk = (chunk: OpenAISSEChunk) => {
      const events = parseChunk(chunk, state)
       for (const _event of events) {
          // events emitted via yield
        }

      const choice = chunk.choice?.[0]
      if (choice?.finish_reason && choice.finish_reason !== "tool_calls") {
        const flushEvents = flushState(state)
        for (const _event of flushEvents) {
          // events emitted via yield
        }
        emittedFinish = true
      }
    }

    const processLine = (line: string) => {
      const chunk = parseSSELine(line)
      if (chunk) processChunk(chunk)
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const bodyText = await response.text()
        let retryable = false
        try {
          const errorBody = JSON.parse(bodyText)
          retryable =
            errorBody.error?.code === "rate_limit_error" || errorBody.error?.code === "server_error"
        } catch {
          // Not JSON
        }
        throw new APIError({
          message: `LLM request failed: ${response.status} ${bodyText}`,
          isRetryable: retryable,
          metadata: { status: response.status },
        })
      }

      if (!response.body) {
        throw new APIError({
          message: "Response body is null",
          isRetryable: false,
        })
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (trimmed) processLine(trimmed)
          }
        }

        if (buffer.trim()) processLine(buffer.trim())
      } finally {
        reader.releaseLock()
      }

      // Flush remaining state
      if (!emittedFinish) {
        const flushEvents = flushState(state)
        for (const event of flushEvents) {
          yield event
        }
      }
    } catch (error) {
      if (error && typeof error === "object" && "_tag" in error) {
        throw error
      }
      throw new APIError({
        message: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
        isRetryable: true,
      })
    } finally {
      controller.abort()
    }
  }

  return Stream.fromAsyncIterable(asyncGen(), (error) => {
    if (error && typeof error === "object" && "_tag" in error) return error as LLMError
    return {
      _tag: "APIError" as const,
      message: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
      isRetryable: true,
    } as unknown as LLMError
  })
}
