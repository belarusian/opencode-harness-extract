/**
 * Message and content part types
 */

import { Schema } from "effect"
import { CacheHint, JsonSchema, MessageRole, ProviderMetadata } from "./ids.js"
import { GenerationOptions, ProviderOptions, HttpOptions, CachePolicy } from "./options.js"
import { isRecord } from "../utils/record.js"

// --- System Part ---

const systemPartSchema = Schema.Struct({
  type: Schema.Literal("text"),
  text: Schema.String,
  cache: Schema.optional(CacheHint),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}).annotate({ identifier: "LLM.SystemPart" })
export type SystemPart = Schema.Schema.Type<typeof systemPartSchema>

export const SystemPart = Object.assign(systemPartSchema, {
  make: (text: string): SystemPart => ({ type: "text", text }),
  content: (input?: string | SystemPart | ReadonlyArray<SystemPart>) => {
    if (input === undefined) return []
    return typeof input === "string" ? [SystemPart.make(input)] : Array.isArray(input) ? [...input] : [input]
  },
})

// --- Content Parts ---

export const TextPart = Schema.Struct({
  type: Schema.Literal("text"),
  text: Schema.String,
  cache: Schema.optional(CacheHint),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Content.Text" })
export type TextPart = Schema.Schema.Type<typeof TextPart>

export const MediaPart = Schema.Struct({
  type: Schema.Literal("media"),
  mediaType: Schema.String,
  data: Schema.Union([Schema.String, Schema.Uint8Array]),
  filename: Schema.optional(Schema.String),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}).annotate({ identifier: "LLM.Content.Media" })
export type MediaPart = Schema.Schema.Type<typeof MediaPart>

export const ToolResultMediaPart = Schema.Struct({
  type: Schema.Literal("media"),
  mediaType: Schema.String,
  data: Schema.String,
  filename: Schema.optional(Schema.String),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}).annotate({ identifier: "LLM.ToolResult.Media" })
export type ToolResultMediaPart = Schema.Schema.Type<typeof ToolResultMediaPart>

export const ToolResultContentPart = Schema.Union([TextPart, ToolResultMediaPart])
export type ToolResultContentPart = Schema.Schema.Type<typeof ToolResultContentPart>

// --- ToolResultValue ---

const isToolResultValue = (value: unknown): value is ToolResultValue =>
  isRecord(value) &&
  (value.type === "text" || value.type === "json" || value.type === "error" || value.type === "content") &&
  "value" in value

export const ToolResultValue = Object.assign(
  Schema.Union([
    Schema.Struct({ type: Schema.Literal("json"), value: Schema.Unknown }),
    Schema.Struct({ type: Schema.Literal("text"), value: Schema.Unknown }),
    Schema.Struct({ type: Schema.Literal("error"), value: Schema.Unknown }),
    Schema.Struct({ type: Schema.Literal("content"), value: Schema.Array(ToolResultContentPart) }),
  ]).annotate({ identifier: "LLM.ToolResult" }),
  {
    is: isToolResultValue,
    make: (value: unknown, type: ToolResultValue["type"] = "json"): ToolResultValue => {
      if (isToolResultValue(value)) return value
      if (type === "content") return { type, value: Array.isArray(value) ? value : [] }
      return { type, value }
    },
  },
)
export type ToolResultValue = Schema.Schema.Type<typeof ToolResultValue>

// --- ToolCallPart ---

export const ToolCallPart = Object.assign(
  Schema.Struct({
    type: Schema.Literal("tool-call"),
    id: Schema.String,
    name: Schema.String,
    input: Schema.Unknown,
    providerExecuted: Schema.optional(Schema.Boolean),
    metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
    providerMetadata: Schema.optional(ProviderMetadata),
  }).annotate({ identifier: "LLM.Content.ToolCall" }),
  {
    make: (input: Omit<ToolCallPart, "type">): ToolCallPart => ({ type: "tool-call", ...input }),
  },
)
export type ToolCallPart = Schema.Schema.Type<typeof ToolCallPart>

// --- ToolResultPart ---

export const ToolResultPart = Object.assign(
  Schema.Struct({
    type: Schema.Literal("tool-result"),
    id: Schema.String,
    name: Schema.String,
    result: ToolResultValue,
    providerExecuted: Schema.optional(Schema.Boolean),
    cache: Schema.optional(CacheHint),
    metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
    providerMetadata: Schema.optional(ProviderMetadata),
  }).annotate({ identifier: "LLM.Content.ToolResult" }),
  {
    make: (
      input: Omit<ToolResultPart, "type" | "result"> & {
        readonly result: unknown
        readonly resultType?: ToolResultValue["type"]
      },
    ): ToolResultPart => ({
      type: "tool-result",
      id: input.id,
      name: input.name,
      result: ToolResultValue.make(input.result, input.resultType),
      providerExecuted: input.providerExecuted,
      cache: input.cache,
      metadata: input.metadata,
      providerMetadata: input.providerMetadata,
    }),
  },
)
export type ToolResultPart = Schema.Schema.Type<typeof ToolResultPart>

// --- ReasoningPart ---

export const ReasoningPart = Schema.Struct({
  type: Schema.Literal("reasoning"),
  text: Schema.String,
  encrypted: Schema.optional(Schema.String),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Content.Reasoning" })
export type ReasoningPart = Schema.Schema.Type<typeof ReasoningPart>

// --- ContentPart Union ---

export const ContentPart = Schema.Union([TextPart, MediaPart, ToolCallPart, ToolResultPart, ReasoningPart]).pipe(
  Schema.toTaggedUnion("type"),
)
export type ContentPart = Schema.Schema.Type<typeof ContentPart>

// --- Message ---

export class Message extends Schema.Class<Message>("LLM.Message")({
  id: Schema.optional(Schema.String),
  role: MessageRole,
  content: Schema.Array(ContentPart),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  native: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}) {}

export namespace Message {
  export type ContentInput = string | ContentPart | ReadonlyArray<ContentPart>
  export type Input = Omit<ConstructorParameters<typeof Message>[0], "content"> & {
    readonly content: ContentInput
  }

  export const text = (value: string): ContentPart => ({ type: "text", text: value })

  export const content = (input: ContentInput) =>
    typeof input === "string" ? [text(input)] : Array.isArray(input) ? [...input] : [input]

  export const make = (input: Message | Input) => {
    if (input instanceof Message) return input
    return new Message({ ...input, content: content(input.content) })
  }

  export const user = (content: ContentInput) => make({ role: "user", content })

  export const assistant = (content: ContentInput) => make({ role: "assistant", content })

  export const tool = (result: ToolResultPart | Parameters<typeof ToolResultPart.make>[0]) =>
    make({ role: "tool", content: ["type" in result ? result : ToolResultPart.make(result)] })
}

// --- ToolDefinition ---

export class ToolDefinition extends Schema.Class<ToolDefinition>("LLM.ToolDefinition")({
  name: Schema.String,
  description: Schema.String,
  inputSchema: JsonSchema,
  cache: Schema.optional(CacheHint),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  native: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}) {}

export namespace ToolDefinition {
  export type Input = ToolDefinition | ConstructorParameters<typeof ToolDefinition>[0]

  export const make = (input: Input) => (input instanceof ToolDefinition ? input : new ToolDefinition(input))
}

// --- ToolChoice ---

export class ToolChoice extends Schema.Class<ToolChoice>("LLM.ToolChoice")({
  type: Schema.Literals(["auto", "none", "required", "tool"]),
  name: Schema.optional(Schema.String),
}) {}

export namespace ToolChoice {
  export type Mode = Exclude<ToolChoice["type"], "tool">
  export type Input = ToolChoice | ConstructorParameters<typeof ToolChoice>[0] | ToolDefinition | string

  const isMode = (value: string): value is "auto" | "none" | "required" => value === "auto" || value === "none" || value === "required"

  export const named = (value: string) => new ToolChoice({ type: "tool", name: value })

  export const make = (input: Input) => {
    if (input instanceof ToolChoice) return input
    if (input instanceof ToolDefinition) return named(input.name)
    if (typeof input === "string") return isMode(input) ? new ToolChoice({ type: input }) : named(input)
    return new ToolChoice(input)
  }
}

// --- ResponseFormat ---

export const ResponseFormat = Schema.Union([
  Schema.Struct({ type: Schema.Literal("text") }),
  Schema.Struct({ type: Schema.Literal("json"), schema: JsonSchema }),
  Schema.Struct({ type: Schema.Literal("tool"), tool: ToolDefinition }),
]).pipe(Schema.toTaggedUnion("type"))
export type ResponseFormat = Schema.Schema.Type<typeof ResponseFormat>

// --- Model ---

export class ModelLimits extends Schema.Class<ModelLimits>("LLM.ModelLimits")({
  maxInputTokens: Schema.optional(Schema.Number),
  maxOutputTokens: Schema.optional(Schema.Number),
  maxTokensPerMessage: Schema.optional(Schema.Number),
  maxToolChoices: Schema.optional(Schema.Number),
  supportsParallelToolCalls: Schema.optional(Schema.Boolean),
  supportsResponseFormat: Schema.optional(Schema.Boolean),
  supportsToolChoice: Schema.optional(Schema.Boolean),
  supportsImages: Schema.optional(Schema.Boolean),
  supportsVideos: Schema.optional(Schema.Boolean),
  supportsAudio: Schema.optional(Schema.Boolean),
  supportsFiles: Schema.optional(Schema.Boolean),
  supportsReasoning: Schema.optional(Schema.Boolean),
  supportsStructuredOutput: Schema.optional(Schema.Boolean),
}) {}

export namespace ModelLimits {
  export type Input = ConstructorParameters<typeof ModelLimits>[0]
}

export class Model extends Schema.Class<Model>("LLM.Model")({
  id: Schema.String,
  providerID: Schema.String,
  route: Schema.optional(Schema.String),
  api: Schema.Struct({
    id: Schema.String,
    name: Schema.optional(Schema.String),
    npm: Schema.String,
    label: Schema.optional(Schema.String),
    suffix: Schema.optional(Schema.String),
    contextWindow: Schema.optional(Schema.Number),
    uploadedFiles: Schema.optional(Schema.Boolean),
  }),
  limits: Schema.optional(ModelLimits),
  variant: Schema.optional(Schema.String),
  native: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}) {}

export namespace Model {
  export type Input = ConstructorParameters<typeof Model>[0]

  export const make = (input: Input) => new Model(input)
}

// --- LLMRequest ---

export class LLMRequest extends Schema.Class<LLMRequest>("LLM.Request")({
  id: Schema.optional(Schema.String),
  model: Model,
  system: Schema.Array(SystemPart),
  messages: Schema.Array(Message),
  tools: Schema.Array(ToolDefinition),
  toolChoice: Schema.optional(ToolChoice),
  generation: Schema.optional(GenerationOptions),
  providerOptions: Schema.optional(ProviderOptions),
  http: Schema.optional(HttpOptions),
  responseFormat: Schema.optional(ResponseFormat),
  cache: Schema.optional(CachePolicy),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}) {}

export namespace LLMRequest {
  export type Input = ConstructorParameters<typeof LLMRequest>[0]

  export const input = (request: LLMRequest): Input => ({
    id: request.id,
    model: request.model,
    system: request.system,
    messages: request.messages,
    tools: request.tools,
    toolChoice: request.toolChoice,
    generation: request.generation,
    providerOptions: request.providerOptions,
    http: request.http,
    responseFormat: request.responseFormat,
    cache: request.cache,
    metadata: request.metadata,
  })

  export const update = (request: LLMRequest, patch: Partial<Input>) => {
    if (Object.keys(patch).length === 0) return request
    return new LLMRequest({
      ...input(request),
      ...patch,
      model: patch.model ?? request.model,
    })
  }
}

// --- PreparedRequest ---

export class PreparedRequest extends Schema.Class<PreparedRequest>("LLM.PreparedRequest")({
  id: Schema.optional(Schema.String),
  model: Model,
  system: Schema.Array(SystemPart),
  messages: Schema.Array(Message),
  tools: Schema.Array(ToolDefinition),
  toolChoice: Schema.optional(ToolChoice),
  generation: Schema.optional(GenerationOptions),
  providerOptions: Schema.optional(ProviderOptions),
  http: Schema.optional(HttpOptions),
  responseFormat: Schema.optional(ResponseFormat),
  cache: Schema.optional(CachePolicy),
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
  body: Schema.Unknown,
  url: Schema.String,
  headers: Schema.Record(Schema.String, Schema.String),
  method: Schema.optional(Schema.Literals(["POST", "GET"])),
}) {}

export namespace PreparedRequest {
  export type Input = ConstructorParameters<typeof PreparedRequest>[0]
}

// Explicit type exports for Effect v4 Schema.Class types
export type { Message as MessageType, Model as ModelType, ToolDefinition as ToolDefinitionType, ToolChoice as ToolChoiceType, LLMRequest as LLMRequestType, PreparedRequest as PreparedRequestType, ContentPart as ContentPartType, ToolCallPart as ToolCallPartType, ToolResultPart as ToolResultPartType, ReasoningPart as ReasoningPartType, TextPart as TextPartType, MediaPart as MediaPartType, ToolResultValue as ToolResultValueType, SystemPart as SystemPartType }
