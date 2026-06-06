/**
 * opencode-harness-llm
 *
 * A standalone LLM client extracted from opencode's packages/llm.
 *
 * This package provides:
 * - LLMClient: Effect-based client for LLM API calls
 * - Providers: OpenAI, Anthropic, Google, and compatible providers
 * - Protocols: OpenAI Chat, Anthropic Messages, Bedrock Converse, Gemini
 * - Tool execution: Run tools with proper error handling
 * - Streaming: Support for SSE and WebSocket streaming
 */
export { LLMClient, LLMClientLayer } from "./client.js";
export type { ProviderDefinition, ProviderModelFactory } from "./provider.js";
export * as providers from "./providers/index.js";
export * as protocols from "./protocols/index.js";
export * as schema from "./schema.js";
export type { Tool, ToolFailure } from "./tool.js";
export { toDefinitions, tool } from "./tool.js";
export type { AnyTool, ExecutableTool, ExecutableTools, Tool as ToolShape, ToolExecute, ToolExecuteContext, Tools, ToolSchema, } from "./tool.js";
//# sourceMappingURL=index.d.ts.map