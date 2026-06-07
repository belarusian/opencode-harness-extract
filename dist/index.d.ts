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
export { ToolExecutor, ToolExecutorLayer, ToolLayer, makeToolExecutor, tool, validateToolInput } from "./tool.js";
export type { Tool, ToolFailure, ToolSchema } from "./tool.js";
export { generateStream } from "./streaming.js";
//# sourceMappingURL=index.d.ts.map