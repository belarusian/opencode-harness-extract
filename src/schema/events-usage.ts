/**
 * Token usage reported by an LLM provider.
 */

import { Schema } from "effect"
import { ProviderMetadata } from "./ids.js"

export class Usage extends Schema.Class<Usage>("LLM.Usage")({
  inputTokens: Schema.optional(Schema.Number),
  outputTokens: Schema.optional(Schema.Number),
  nonCachedInputTokens: Schema.optional(Schema.Number),
  cacheReadInputTokens: Schema.optional(Schema.Number),
  cacheWriteInputTokens: Schema.optional(Schema.Number),
  reasoningTokens: Schema.optional(Schema.Number),
  totalTokens: Schema.optional(Schema.Number),
  providerMetadata: Schema.optional(ProviderMetadata),
}) {
  /** Visible output tokens — outputTokens minus reasoningTokens, clamped to zero. */
  get visibleOutputTokens(): number {
    return Math.max(0, (this.outputTokens ?? 0) - (this.reasoningTokens ?? 0))
  }
}


export type UsageInput = Usage | ConstructorParameters<typeof Usage>[0]
