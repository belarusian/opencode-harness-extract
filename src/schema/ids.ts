/**
 * ID types used across the LLM schema
 */

import { Schema } from "effect"

export const ProviderID = Schema.String.pipe(
  Schema.annotate({ identifier: "LLM.ProviderID" }),
)
export type ProviderID = Schema.Schema.Type<typeof ProviderID>

export const ProtocolID = Schema.String.pipe(
  Schema.annotate({ identifier: "LLM.ProtocolID" }),
)
export type ProtocolID = Schema.Schema.Type<typeof ProtocolID>

export const ContentBlockID = Schema.String.pipe(
  Schema.annotate({ identifier: "LLM.ContentBlockID" }),
)
export type ContentBlockID = Schema.Schema.Type<typeof ContentBlockID>

export const ToolCallID = Schema.String.pipe(
  Schema.annotate({ identifier: "LLM.ToolCallID" }),
)
export type ToolCallID = Schema.Schema.Type<typeof ToolCallID>

export const JsonSchema = Schema.Record(Schema.String, Schema.Unknown).pipe(
  Schema.annotate({ identifier: "LLM.JsonSchema" }),
)
export type JsonSchema = Schema.Schema.Type<typeof JsonSchema>

export const MessageRole = Schema.Literals(["system", "user", "assistant", "tool"])
export type MessageRole = Schema.Schema.Type<typeof MessageRole>

export const FinishReason = Schema.Literals([
  "stop",
  "tool-calls",
  "length",
  "model-limit",
  "content-filter",
  "error",
  "other",
  "cancelled",
  "timed-out",
  "interrupted",
  "unknown",
])
export type FinishReason = Schema.Schema.Type<typeof FinishReason>

export const ProviderMetadata = Schema.Record(Schema.String, Schema.Unknown).pipe(
  Schema.annotate({ identifier: "LLM.ProviderMetadata" }),
)
export type ProviderMetadata = Schema.Schema.Type<typeof ProviderMetadata>

export const CacheHint = Schema.Literals(["force-cache", "skip-cache"])
export type CacheHint = Schema.Schema.Type<typeof CacheHint>
