/**
 * Generation and HTTP options
 */

import { Schema } from "effect"
// Options module

export class GenerationOptions extends Schema.Class<GenerationOptions>("LLM.GenerationOptions")({
  temperature: Schema.optional(Schema.Number),
  topP: Schema.optional(Schema.Number),
  topK: Schema.optional(Schema.Number),
  minP: Schema.optional(Schema.Number),
  presencePenalty: Schema.optional(Schema.Number),
  frequencyPenalty: Schema.optional(Schema.Number),
  seed: Schema.optional(Schema.Number),
  maxOutputTokens: Schema.optional(Schema.Number),
  stopSequences: Schema.optional(Schema.Array(Schema.String)),
  logitBias: Schema.optional(Schema.Record(Schema.String, Schema.Number)),
  logProbs: Schema.optional(Schema.Boolean),
  topLogProbs: Schema.optional(Schema.Number),
}) {}

export namespace GenerationOptions {
  export type Input = ConstructorParameters<typeof GenerationOptions>[0]
}

export class ProviderOptions extends Schema.Class<ProviderOptions>("LLM.ProviderOptions")({
  anthropic: Schema.optional(Schema.Unknown),
  openai: Schema.optional(Schema.Unknown),
  google: Schema.optional(Schema.Unknown),
  googleGoogle: Schema.optional(Schema.Unknown),
  googleVertex: Schema.optional(Schema.Unknown),
  googleGemini: Schema.optional(Schema.Unknown),
  mistral: Schema.optional(Schema.Unknown),
  groq: Schema.optional(Schema.Unknown),
  deepseek: Schema.optional(Schema.Unknown),
  fireworks: Schema.optional(Schema.Unknown),
  cohere: Schema.optional(Schema.Unknown),
  openrouter: Schema.optional(Schema.Unknown),
  azure: Schema.optional(Schema.Unknown),
  xai: Schema.optional(Schema.Unknown),
  perplexity: Schema.optional(Schema.Unknown),
  harness: Schema.optional(Schema.Unknown),
}) {}

export namespace ProviderOptions {
  export type Input = ConstructorParameters<typeof ProviderOptions>[0]
}

export class HttpOptions extends Schema.Class<HttpOptions>("LLM.HttpOptions")({
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  timeout: Schema.optional(Schema.Number),
  retries: Schema.optional(Schema.Number),
  retryDelay: Schema.optional(Schema.Number),
  signal: Schema.optional(Schema.Unknown),
}) {}

export namespace HttpOptions {
  export type Input = ConstructorParameters<typeof HttpOptions>[0]
}

export class CachePolicy extends Schema.Class<CachePolicy>("LLM.CachePolicy")({
  strategy: Schema.optional(Schema.Literals(["standard", "force-cache", "skip-cache"])),
  ttl: Schema.optional(Schema.Number),
  key: Schema.optional(Schema.String),
}) {}

export namespace CachePolicy {
  export type Input = ConstructorParameters<typeof CachePolicy>[0]
}
