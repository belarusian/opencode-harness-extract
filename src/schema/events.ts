/**
 * LLMEvent — the unified event contract for LLM streams
 *
 * Every LLM provider stream is normalized to this tagged union.
 * Consumers (processors, adapters) pattern-match on `type`.
 */

import { Schema } from "effect"
import {
  ContentBlockID,
  FinishReason,
  ProviderMetadata,
  ToolCallID,
} from "./ids.js"
import { Usage } from "./events-usage.js"
import { ToolResultValue, ContentPart } from "./messages.js"

// --- Individual event schemas ---

export const StepStart = Schema.Struct({
  type: Schema.tag("step-start"),
  index: Schema.Number,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.StepStart" })
export type StepStart = Schema.Schema.Type<typeof StepStart>

export const TextStart = Schema.Struct({
  type: Schema.tag("text-start"),
  id: ContentBlockID,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.TextStart" })
export type TextStart = Schema.Schema.Type<typeof TextStart>

export const TextDelta = Schema.Struct({
  type: Schema.tag("text-delta"),
  id: ContentBlockID,
  text: Schema.String,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.TextDelta" })
export type TextDelta = Schema.Schema.Type<typeof TextDelta>

export const TextEnd = Schema.Struct({
  type: Schema.tag("text-end"),
  id: ContentBlockID,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.TextEnd" })
export type TextEnd = Schema.Schema.Type<typeof TextEnd>

export const ReasoningStart = Schema.Struct({
  type: Schema.tag("reasoning-start"),
  id: ContentBlockID,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ReasoningStart" })
export type ReasoningStart = Schema.Schema.Type<typeof ReasoningStart>

export const ReasoningDelta = Schema.Struct({
  type: Schema.tag("reasoning-delta"),
  id: ContentBlockID,
  text: Schema.String,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ReasoningDelta" })
export type ReasoningDelta = Schema.Schema.Type<typeof ReasoningDelta>

export const ReasoningEnd = Schema.Struct({
  type: Schema.tag("reasoning-end"),
  id: ContentBlockID,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ReasoningEnd" })
export type ReasoningEnd = Schema.Schema.Type<typeof ReasoningEnd>

export const ToolInputStart = Schema.Struct({
  type: Schema.tag("tool-input-start"),
  id: ToolCallID,
  name: Schema.String,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ToolInputStart" })
export type ToolInputStart = Schema.Schema.Type<typeof ToolInputStart>

export const ToolInputDelta = Schema.Struct({
  type: Schema.tag("tool-input-delta"),
  id: ToolCallID,
  name: Schema.String,
  text: Schema.String,
}).annotate({ identifier: "LLM.Event.ToolInputDelta" })
export type ToolInputDelta = Schema.Schema.Type<typeof ToolInputDelta>

export const ToolInputEnd = Schema.Struct({
  type: Schema.tag("tool-input-end"),
  id: ToolCallID,
  name: Schema.String,
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ToolInputEnd" })
export type ToolInputEnd = Schema.Schema.Type<typeof ToolInputEnd>

export const ToolCall = Schema.Struct({
  type: Schema.tag("tool-call"),
  id: ToolCallID,
  name: Schema.String,
  input: Schema.Unknown,
  providerExecuted: Schema.optional(Schema.Boolean),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ToolCall" })
export type ToolCall = Schema.Schema.Type<typeof ToolCall>

export const ToolResult = Schema.Struct({
  type: Schema.tag("tool-result"),
  id: ToolCallID,
  name: Schema.String,
  result: ToolResultValue,
  providerExecuted: Schema.optional(Schema.Boolean),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ToolResult" })
export type ToolResult = Schema.Schema.Type<typeof ToolResult>

export const ToolError = Schema.Struct({
  type: Schema.tag("tool-error"),
  id: ToolCallID,
  name: Schema.String,
  message: Schema.String,
  error: Schema.optional(Schema.Defect),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ToolError" })
export type ToolError = Schema.Schema.Type<typeof ToolError>

export const StepFinish = Schema.Struct({
  type: Schema.tag("step-finish"),
  index: Schema.Number,
  reason: FinishReason,
  usage: Schema.optional(Usage),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.StepFinish" })
export type StepFinish = Schema.Schema.Type<typeof StepFinish>

export const Finish = Schema.Struct({
  type: Schema.tag("finish"),
  reason: FinishReason,
  usage: Schema.optional(Usage),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.Finish" })
export type Finish = Schema.Schema.Type<typeof Finish>

export const ProviderErrorEvent = Schema.Struct({
  type: Schema.tag("provider-error"),
  message: Schema.String,
  retryable: Schema.optional(Schema.Boolean),
  providerMetadata: Schema.optional(ProviderMetadata),
}).annotate({ identifier: "LLM.Event.ProviderError" })
export type ProviderErrorEvent = Schema.Schema.Type<typeof ProviderErrorEvent>

// --- Tagged union ---

const llmEventTagged = Schema.Union([
  StepStart,
  TextStart,
  TextDelta,
  TextEnd,
  ReasoningStart,
  ReasoningDelta,
  ReasoningEnd,
  ToolInputStart,
  ToolInputDelta,
  ToolInputEnd,
  ToolCall,
  ToolResult,
  ToolError,
  StepFinish,
  Finish,
  ProviderErrorEvent,
]).pipe(Schema.toTaggedUnion("type"))

/**
 * camelCase aliases for LLMEvent.guards (provided by Schema.toTaggedUnion).
 * Lets consumers write `events.filter(LLMEvent.is.toolCall)` instead of
 * `events.filter(LLMEvent.guards["tool-call"])`.
 */
export const LLMEvent = Object.assign(llmEventTagged, {
  stepStart: StepStart.make,
  textStart: TextStart.make,
  textDelta: TextDelta.make,
  textEnd: TextEnd.make,
  reasoningStart: ReasoningStart.make,
  reasoningDelta: ReasoningDelta.make,
  reasoningEnd: ReasoningEnd.make,
  toolInputStart: ToolInputStart.make,
  toolInputDelta: ToolInputDelta.make,
  toolInputEnd: ToolInputEnd.make,
  toolCall: ToolCall.make,
  toolResult: ToolResult.make,
  toolError: ToolError.make,
  stepFinish: StepFinish.make,
  finish: Finish.make,
  providerError: ProviderErrorEvent.make,
})

export type LLMEvent = Schema.Schema.Type<typeof llmEventTagged>

// --- LLMResponse (for non-streaming) ---

export class LLMResponse extends Schema.Class<LLMResponse>("LLM.Response")({
  content: Schema.Array(ContentPart),
  finish: Schema.optional(FinishReason),
  usage: Schema.optional(Usage),
  providerMetadata: Schema.optional(ProviderMetadata),
}) {}

export namespace LLMResponse {
  export type Output = LLMResponse | { readonly events: ReadonlyArray<LLMEvent>; readonly usage?: Usage }
}

// --- Usage re-export ---

export { Usage } from "./events-usage.js"
