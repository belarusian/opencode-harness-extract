/**
 * opencode-harness-llm
 *
 * A standalone LLM client extracted from opencode's packages/llm.
 *
 * This package provides:
 * - LLMClient: Effect-based client for LLM API calls with streaming
 * - LLMEvent: Unified event contract for LLM streams (text, tools, reasoning, etc.)
 * - Tool execution: Run tools with proper context and result formatting
 * - Caching: Request/response caching for efficiency
 * - Schema: Full type definitions for messages, tools, events, errors
 */

// Schema types (core contract)
export {
  // IDs
  ProviderID,
  ProtocolID,
  ContentBlockID,
  ToolCallID,
  MessageRole,
  FinishReason,
  ProviderMetadata,
  CacheHint,
  JsonSchema,
  // Options
  GenerationOptions,
  ProviderOptions,
  HttpOptions,
  CachePolicy,
  // Messages
  SystemPart,
  TextPart,
  MediaPart,
  ToolResultMediaPart,
  ToolResultContentPart,
  ToolResultValue,
  ToolCallPart,
  ToolResultPart,
  ReasoningPart,
  ContentPart,
  Message,
  ToolDefinition,
  ToolChoice,
  ResponseFormat,
  Model,
  ModelLimits,
  LLMRequest,
  PreparedRequest,
  // Events
  LLMEvent,
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
  ToolCall as ToolCallEvent,
  ToolResult as ToolResultEvent,
  ToolError,
  StepFinish,
  Finish,
  ProviderErrorEvent,
  LLMResponse,
  Usage,
  // Errors
  LLMError,
  APIError,
  AuthenticationError,
  RateLimitError,
  ContextOverflowError,
  OutputLengthError,
  AbortError,
  UnknownError,
} from "./schema/index.js"

// Client
export { LLMClient, LLMClientLayer, LLMConfig, simpleRequest, simpleStream, makeLLMClient } from "./client.js"
export type { LLMClientShape } from "./client.js"

// Cache
export { Cache, CacheLayer, makeCache } from "./cache.js"
export type { CacheShape } from "./cache.js"

// Tools
export {
  ToolExecutor,
  ToolExecutorLayer,
  makeToolExecutor,
  makeDynamicTool,
  toToolDefinition,
  formatToolResult,
  ToolFailure,
} from "./tool.js"
export type {
  Tool,
  ToolExecuteContext,
  ToolExecutorShape,
  ToolFailure as ToolFailureType,
} from "./tool.js"

// Agent loop
export {
  AgentLoop,
  AgentLoopLayer,
  makeAgentLoop,
  runAgent,
  streamAgent,
  stepCountIs,
} from "./agent.js"
export type {
  AgentLoopInput,
  AgentLoopResult,
  AgentLoopShape,
  AgentTool,
  AgentToolContext,
  StopWhen,
  AgentLoopState,
} from "./agent.js"

// Protocol helpers
export { buildOpenAIChatBody, buildOpenAIChatURL, buildOpenAIChatHeaders } from "./protocols/openai-chat.js"
export { streamFromURL } from "./protocols/sse-parser.js"
