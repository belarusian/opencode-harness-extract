/**
 * Streaming support for LLM API responses
 */
import type { LLMConfig as Config } from "./config.js";
/**
 * Generate text with SSE streaming
 */
export declare function generateStream(config: Config, messages: Array<{
    role: string;
    content: string;
}>): AsyncGenerator<string, void, unknown>;
//# sourceMappingURL=streaming.d.ts.map