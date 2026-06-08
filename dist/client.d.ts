/**
 * LLMClient - Effect-based client for LLM API calls
 *
 * Provides:
 * - stream(): Stream<LLMEvent> from any OpenAI-compatible endpoint
 * - generate(): Non-streaming LLM call
 * - generateObject(): JSON-structured output
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import * as Stream from "effect/Stream";
import { LLMRequest as _LLMRequest, LLMResponse as _LLMResponse, LLMEvent, LLMError, ToolChoice as _ToolChoice, GenerationOptions as _GenerationOptions } from "./schema/index.js";
import * as Schema from "effect/Schema";
type LLMRequest = Schema.Schema.Type<typeof _LLMRequest>;
type LLMResponse = Schema.Schema.Type<typeof _LLMResponse>;
type ToolChoice = Schema.Schema.Type<typeof _ToolChoice>;
type GenerationOptions = Schema.Schema.Type<typeof _GenerationOptions>;
export interface LLMConfig {
    readonly baseUrl: string;
    readonly model: string;
    readonly apiKey?: string;
    readonly maxTokens?: number;
    readonly temperature?: number;
    readonly topP?: number;
    readonly topK?: number;
    readonly maxRetries?: number;
}
declare const LLMClient_base: Context.ServiceClass<LLMClient, "opencode-harness/LLMClient", LLMClientShape>;
export declare class LLMClient extends LLMClient_base {
}
export interface LLMClientShape {
    readonly stream: (request: LLMRequest) => Stream.Stream<LLMEvent, LLMError>;
    readonly generate: (request: LLMRequest) => Effect.Effect<LLMResponse, LLMError>;
    readonly generateObject: <T>(request: LLMRequest) => Effect.Effect<T, LLMError>;
}
/**
 * Build an LLMRequest from simple config + messages.
 */
export declare function simpleRequest(config: LLMConfig, messages: Array<{
    role: string;
    content: string;
}>, options?: {
    system?: string | string[];
    tools?: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
    toolChoice?: ToolChoice;
    responseFormat?: "text" | "json";
    generation?: Partial<GenerationOptions>;
}): LLMRequest;
export declare const makeLLMClient: Layer.Layer<LLMClient, never, never>;
export declare const LLMClientLayer: Layer.Layer<LLMClient, never, never>;
export interface SimpleStreamInput {
    messages: Array<{
        role: string;
        content: string;
    }>;
    config: LLMConfig;
    system?: string | string[];
    tools?: Array<{
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    }>;
}
/**
 * Stream from simple inputs without building LLMRequest.
 */
export declare function simpleStream(input: SimpleStreamInput): Stream.Stream<LLMEvent, Error>;
export {};
//# sourceMappingURL=client.d.ts.map