/**
 * LLMClient - Effect-based client for LLM API calls
 *
 * Provides:
 * - stream(): Stream<LLMEvent> from any OpenAI-compatible endpoint
 * - generate(): Non-streaming LLM call
 * - generateObject(): JSON-structured output
 */

import * as Effect from "effect/Effect"
import * as Context from "effect/Context"
import * as Layer from "effect/Layer"
import * as Stream from "effect/Stream"
import { CacheLayer } from "./cache.js"
import {
  LLMRequest as _LLMRequest,
  LLMResponse as _LLMResponse,
  LLMEvent,
  LLMError,
  Model as _Model,
  ToolDefinition as _ToolDefinition,
  ToolChoice as _ToolChoice,
  GenerationOptions as _GenerationOptions,
  SystemPart as _SystemPart,
  ContentPart as _ContentPart,
  Message as _Message,
  Usage as _Usage,
  ResponseFormat as _ResponseFormat,
 } from "./schema/index.js"
import * as Schema from "effect/Schema"

type LLMRequest = Schema.Schema.Type<typeof _LLMRequest>
type LLMResponse = Schema.Schema.Type<typeof _LLMResponse>
type Model = Schema.Schema.Type<typeof _Model>
type ToolDefinition = Schema.Schema.Type<typeof _ToolDefinition>
type ToolChoice = Schema.Schema.Type<typeof _ToolChoice>
type GenerationOptions = Schema.Schema.Type<typeof _GenerationOptions>
type SystemPart = Schema.Schema.Type<typeof _SystemPart>
type ContentPart = Schema.Schema.Type<typeof _ContentPart>
type Message = Schema.Schema.Type<typeof _Message>
type Usage = Schema.Schema.Type<typeof _Usage>

import { buildOpenAIChatBody, buildOpenAIChatURL, buildOpenAIChatHeaders, buildOpenAIChatStreamBody } from "./protocols/openai-chat.js"
import { streamFromBody, mapFinishReason } from "./protocols/sse-parser.js"
import { isRecord } from "./utils/record.js"

// --- Configuration ---

export interface LLMConfig {
  readonly baseUrl: string
  readonly model: string
  readonly apiKey?: string
  readonly maxTokens?: number
  readonly temperature?: number
  readonly topP?: number
  readonly topK?: number
  readonly maxRetries?: number
}

// --- LLMClient Service ---

export class LLMClient extends Context.Service<LLMClient, LLMClientShape>()("opencode-harness/LLMClient") {}

export interface LLMClientShape {
  readonly stream: (request: LLMRequest) => Stream.Stream<LLMEvent, LLMError>
  readonly generate: (request: LLMRequest) => Effect.Effect<LLMResponse, LLMError>
  readonly generateObject: <T>(request: LLMRequest) => Effect.Effect<T, LLMError>
}

// --- Helpers ---

/**
 * Build an LLMRequest from simple config + messages.
 */
export function simpleRequest(
  config: LLMConfig,
  messages: Array<{ role: string; content: string }>,
  options?: {
    system?: string | string[]
    tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>
    toolChoice?: ToolChoice
    responseFormat?: "text" | "json"
    generation?: Partial<GenerationOptions>
  },
): LLMRequest {
  const model: Model = {
    id: config.model,
    providerID: "openai-compatible",
    api: {
      id: config.model,
      npm: "@ai-sdk/openai-compatible",
    },
    native: { baseUrl: config.baseUrl, apiKey: config.apiKey },
  }

  const system: SystemPart[] = []
  if (options?.system) {
    const parts = Array.isArray(options.system) ? options.system : [options.system]
    for (const text of parts) {
      system.push({ type: "text", text })
    }
  }

  const msgs: Message[] = messages.map((m) =>
    _Message.make({
      role: m.role as "system" | "user" | "assistant" | "tool",
      content: m.content,
    }),
  )

  const genOpts = options?.generation
    ? new _GenerationOptions({
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature,
        topP: config.topP,
        topK: config.topK,
        ...options.generation,
      })
    : undefined

  const respFormat = options?.responseFormat
    ? options.responseFormat === "json"
      ? _ResponseFormat.make({ type: "json", schema: {} })
      : _ResponseFormat.make({ type: "text" })
    : undefined

  return new _LLMRequest({
    model,
    system,
    messages: msgs,
    tools: (options?.tools ?? []).map(
      (t) =>
        _ToolDefinition.make({
          name: t.name,
          description: t.description,
          inputSchema: t.parameters,
        }) as unknown as ToolDefinition,
    ),
    toolChoice: options?.toolChoice,
    generation: genOpts,
    responseFormat: respFormat,
  })
}

/**
 * Build LLMResponse from collected events.
 */
function eventsToResponse(events: LLMEvent[], usage: Usage | undefined): LLMResponse {
  const contentParts: ContentPart[] = []
  let finish: string | undefined = undefined

  for (const event of events) {
    if (event.type === "text-delta") {
      let textPart = contentParts.find((p) => p.type === "text") as
        | Extract<ContentPart, { type: "text" }>
        | undefined
      if (!textPart) {
        textPart = { type: "text", text: "" }
        contentParts.push(textPart)
      }
      // Need to mutate — use Object.assign workaround since Schema.Class makes fields readonly
      ;(textPart as { text: string }).text += event.text
    }
  }

  return new _LLMResponse({
    content: contentParts,
    finish: finish as Parameters<typeof _LLMResponse.make>[0]["finish"],
    usage,
  })
}

// --- Implementation ---

export const makeLLMClient = Layer.effect(
  LLMClient,
  Effect.gen(function* () {
    const stream = (request: LLMRequest): Stream.Stream<LLMEvent, LLMError> => {
      const body = buildOpenAIChatBody(request)
      const baseUrl = (request.model.native?.baseUrl as string | undefined) ?? "http://localhost:8080/v1"
      const apiKey = (request.model.native?.apiKey as string | undefined)

      // Use model.api.id for the actual API call
      const finalBody = { ...body, model: request.model.api.id }
      const url = buildOpenAIChatURL(baseUrl)

      return streamFromBody(url, buildOpenAIChatHeaders(apiKey), finalBody, {
        modelID: request.model.id,
      })
    }

    const generate = (request: LLMRequest): Effect.Effect<LLMResponse, LLMError> => {
      const body = buildOpenAIChatStreamBody(request)
      const baseUrl = (request.model.native?.baseUrl as string | undefined) ?? "http://localhost:8080/v1"
      const apiKey = (request.model.native?.apiKey as string | undefined)
      const finalBody = { ...body, model: request.model.api.id }
      const url = buildOpenAIChatURL(baseUrl)
      const headers = buildOpenAIChatHeaders(apiKey)

      return Effect.tryPromise({
        try: () => fetch(url, { method: "POST", headers, body: JSON.stringify(finalBody) }),
        catch: (error) => ({
          _tag: "APIError" as const,
          message: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
          isRetryable: true,
        } as unknown as LLMError),
      }).pipe(
        Effect.flatMap((response) =>
          Effect.tryPromise({
            try: () => response.json(),
            catch: (error) => ({
              _tag: "APIError" as const,
              message: `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
              isRetryable: false,
            } as unknown as LLMError),
          }),
        ),
        Effect.flatMap((json: unknown) => {
          if (!isRecord(json) || !Array.isArray((json as Record<string, unknown>).choices) || ((json as Record<string, unknown>).choices as Array<unknown>).length === 0) {
            return Effect.succeed(eventsToResponse([], undefined))
          }

          const data = json as Record<string, unknown>
          const choices = data.choices as Array<{ message?: Record<string, unknown>; finish_reason?: string }>
          const choice = choices[0]
          const message = choice.message as Record<string, unknown> | undefined

          const contentParts: ContentPart[] = []

          // Text content
          if (message?.content && typeof message.content === "string" && message.content.trim()) {
            contentParts.push({ type: "text", text: message.content })
          }

          // Tool calls
          if (Array.isArray(message?.tool_calls)) {
            const toolCalls = message.tool_calls as Array<{ id: string; type: string; function?: { name: string; arguments: string } }>
            for (const tc of toolCalls) {
              if (tc.type === "function" && tc.function) {
                let input: unknown = {}
                try {
                  input = JSON.parse(tc.function.arguments)
                } catch {
                  input = tc.function.arguments
                }
                contentParts.push({
                  type: "tool-call",
                  id: tc.id,
                  name: tc.function.name,
                  input,
                })
              }
            }
          }

          // Reasoning content
          if (message?.reasoning && typeof message.reasoning === "string" && message.reasoning.trim()) {
            contentParts.push({ type: "reasoning", text: message.reasoning })
          }

          let usage: Usage | undefined = undefined
          if (data.usage && isRecord(data.usage)) {
            const u = data.usage as Record<string, unknown>
            usage = new _Usage({
              inputTokens: u.prompt_tokens as number | undefined,
              outputTokens: u.completion_tokens as number | undefined,
              totalTokens: u.total_tokens as number | undefined,
              reasoningTokens: u.completion_tokens_details && isRecord(u.completion_tokens_details)
                ? (u.completion_tokens_details as Record<string, unknown>).reasoning_tokens as number | undefined
                : undefined,
              cacheReadInputTokens: u.prompt_tokens_details && isRecord(u.prompt_tokens_details)
                ? (u.prompt_tokens_details as Record<string, unknown>).cached_tokens as number | undefined
                : undefined,
            })
          }

          const finish = choice.finish_reason ? mapFinishReason(choice.finish_reason) : undefined

          return Effect.succeed(new _LLMResponse({
            content: contentParts,
            finish: finish as Parameters<typeof _LLMResponse.make>[0]["finish"],
            usage,
          }))
        }),
      )
    }

    const generateObject = <T>(request: LLMRequest): Effect.Effect<T, LLMError> => {
      const jsonRequest = new _LLMRequest({
        ...request,
        responseFormat: _ResponseFormat.make({ type: "json", schema: {} }),
      })

      const body = buildOpenAIChatStreamBody(jsonRequest)
      const baseUrl = (jsonRequest.model.native?.baseUrl as string | undefined) ?? "http://localhost:8080/v1"
      const apiKey = (jsonRequest.model.native?.apiKey as string | undefined)
      const finalBody = { ...body, model: jsonRequest.model.api.id }
      const url = buildOpenAIChatURL(baseUrl)
      const headers = buildOpenAIChatHeaders(apiKey)

      return Effect.tryPromise({
        try: () => fetch(url, { method: "POST", headers, body: JSON.stringify(finalBody) }),
        catch: (error) => ({
          _tag: "APIError" as const,
          message: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
          isRetryable: true,
        } as unknown as LLMError),
      }).pipe(
        Effect.flatMap((response) => {
          if (!response.ok) {
            return Effect.tryPromise({
              try: () => response.text(),
              catch: (e) => ({
                _tag: "APIError" as const,
                message: `HTTP ${response.status}: ${e instanceof Error ? e.message : String(e)}`,
                isRetryable: false,
              } as unknown as LLMError),
            }).pipe(Effect.flatMap((text) => Effect.fail({
              _tag: "APIError" as const,
              message: `LLM request failed: ${response.status} ${text}`,
              isRetryable: false,
            } as unknown as LLMError)))
          }
          return Effect.tryPromise({
            try: () => response.json(),
            catch: (error) => ({
              _tag: "APIError" as const,
              message: `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
              isRetryable: false,
            } as unknown as LLMError),
          })
        }),
        Effect.flatMap((json: unknown) => {
          if (!isRecord(json) || !Array.isArray((json as Record<string, unknown>).choices) || ((json as Record<string, unknown>).choices as Array<unknown>).length === 0) {
            return Effect.fail({
              _tag: "APIError" as const,
              message: "Empty response from LLM",
              isRetryable: false,
            } as unknown as LLMError)
          }

          const data = json as Record<string, unknown>
          const choices = data.choices as Array<{ message?: Record<string, unknown> }>
          const choice = choices[0]
          const message = choice.message as Record<string, unknown> | undefined
          let text = ""
          if (message?.content && typeof message.content === "string") {
            text = message.content
          }

          let jsonStr = text.trim()
          if (!jsonStr) {
            return Effect.fail({
              _tag: "APIError" as const,
              message: "Empty response from LLM — no content in choices[0].message",
              isRetryable: false,
            } as unknown as LLMError)
          }
          if (jsonStr.startsWith("```json")) jsonStr = jsonStr.slice(7)
          if (jsonStr.startsWith("```")) jsonStr = jsonStr.slice(3)
          if (jsonStr.endsWith("```")) jsonStr = jsonStr.slice(0, -3)
          jsonStr = jsonStr.trim()

          return Effect.try({
            try: () => JSON.parse(jsonStr) as T,
            catch: (error) =>
              new Error(
                `Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`,
              ) as unknown as LLMError,
          })
        }),
      )
    }

    return LLMClient.of({ stream, generate, generateObject })
  }),
)

export const LLMClientLayer = makeLLMClient.pipe(Layer.provide(CacheLayer))

// --- Convenience: simpleStream ---

export interface SimpleStreamInput {
  messages: Array<{ role: string; content: string }>
  config: LLMConfig
  system?: string | string[]
  tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>
}

/**
 * Stream from simple inputs without building LLMRequest.
 */
export function simpleStream(input: SimpleStreamInput): Stream.Stream<LLMEvent, Error> {
  const request = simpleRequest(input.config, input.messages, {
    system: input.system,
    tools: input.tools,
  })

  const body = buildOpenAIChatBody(request)
  const url = buildOpenAIChatURL(input.config.baseUrl)
  const headers = buildOpenAIChatHeaders(input.config.apiKey)

  const asyncGen = async function* (): AsyncGenerator<LLMEvent, void, unknown> {
    const controller = new AbortController()
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`LLM request failed: ${response.status} ${text}`)
      }

      if (!response.body) {
        throw new Error("Response body is null")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

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
            if (trimmed && trimmed.startsWith("data: ")) {
              const data = trimmed.slice(6)
              if (data === "[DONE]") continue

              try {
                const parsed = JSON.parse(data)
                const choice = parsed.choice?.[0]
                if (choice?.delta?.content) {
                  yield {
                    type: "text-delta",
                    id: "text-0",
                    text: choice.delta.content,
                  }
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } finally {
      controller.abort()
    }
  }

  return Stream.fromAsyncIterable(asyncGen(), (error) => error instanceof Error ? error : new Error(String(error)))
}
