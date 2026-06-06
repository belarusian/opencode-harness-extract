/**
 * opencode-harness-llm
 *
 * A standalone LLM client extracted from opencode's packages/llm.
 *
 * This package provides:
 * - LLMClient: Effect-based client for LLM API calls
 * - Tool execution: Run tools with proper error handling
 * - Streaming: Support for SSE streaming responses
 * - Caching: Request/response caching for efficiency
 */
export { LLMClient, LLMClientLayer } from "./client.js";
export { Cache, CacheLayer, makeCache } from "./cache.js";
export type { Tool, ToolFailure } from "./tool.js";
export { ToolExecutor, ToolExecutorLayer, ToolLayer, makeToolExecutor, tool } from "./tool.js";
export { generateStream } from "./streaming.js";
export type { ToolSchema } from "./tool.js";
//# sourceMappingURL=index.d.ts.map