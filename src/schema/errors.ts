/**
 * LLM error types
 */

import { Schema } from "effect"

export class LLMError extends Schema.TaggedErrorClass<LLMError>()("LLMError", {
  message: Schema.String,
  retryable: Schema.optional(Schema.Boolean),
}) {}

export class APIError extends Schema.TaggedErrorClass<APIError>()("APIError", {
  message: Schema.String,
  isRetryable: Schema.Boolean,
  metadata: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)),
}) {}

export class AuthenticationError extends Schema.TaggedErrorClass<AuthenticationError>()("AuthenticationError", {
  message: Schema.String,
  providerID: Schema.String,
}) {}

export class RateLimitError extends Schema.TaggedErrorClass<RateLimitError>()("RateLimitError", {
  message: Schema.String,
  retryAfter: Schema.optional(Schema.Number),
  providerID: Schema.String,
}) {}

export class ContextOverflowError extends Schema.TaggedErrorClass<ContextOverflowError>()("ContextOverflowError", {
  message: Schema.String,
  providerID: Schema.String,
  responseBody: Schema.optional(Schema.String),
}) {}

export class OutputLengthError extends Schema.TaggedErrorClass<OutputLengthError>()("OutputLengthError", {
  message: Schema.String,
  providerID: Schema.String,
  maxTokens: Schema.Number,
}) {}

export class AbortError extends Schema.TaggedErrorClass<AbortError>()("AbortError", {
  message: Schema.String,
  providerID: Schema.String,
}) {}

export class UnknownError extends Schema.TaggedErrorClass<UnknownError>()("UnknownError", {
  message: Schema.String,
  cause: Schema.optional(Schema.Unknown),
}) {}
