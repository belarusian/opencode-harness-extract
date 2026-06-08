/**
 * OpenAI Chat protocol — builds chat/completions body from LLMRequest
 */
import { LLMRequest as _LLMRequest } from "../schema/index.js";
import * as Schema from "effect/Schema";
type LLMRequest = Schema.Schema.Type<typeof _LLMRequest>;
export interface OpenAIChatMessage {
    role: "system" | "user" | "assistant" | "tool";
    content: string | Array<OpenAIChatContentPart> | null;
    name?: string;
    tool_calls?: OpenAIToolCall[];
    tool_call_id?: string;
    refusal?: string;
}
interface OpenAIChatContentPart {
    type: "text";
    text: string;
}
interface OpenAIToolCall {
    id: string;
    type: "function";
    function: {
        name: string;
        arguments: string;
    };
}
export interface OpenAIToolDefinition {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: Record<string, unknown>;
    };
}
export interface OpenAIChatBody {
    model: string;
    messages: OpenAIChatMessage[];
    tools?: OpenAIToolDefinition[];
    tool_choice?: string | {
        type: "function";
        function: {
            name: string;
        };
    };
    temperature?: number;
    top_p?: number;
    max_tokens?: number;
    stop?: string[];
    stream?: true;
    presence_penalty?: number;
    frequency_penalty?: number;
    seed?: number;
    logit_bias?: Record<string, number>;
    log_probs?: boolean;
    top_logprobs?: number;
    response_format?: {
        type: "text" | "json_object";
    };
    [key: string]: unknown;
}
/**
 * Build an OpenAI chat/completions body for streaming requests.
 */
export declare function buildOpenAIChatBody(request: LLMRequest): OpenAIChatBody;
/**
 * Build an OpenAI chat/completions body for non-streaming requests.
 */
export declare function buildOpenAIChatStreamBody(request: LLMRequest): OpenAIChatBody;
/**
 * Build the request URL for an OpenAI chat completion.
 */
export declare function buildOpenAIChatURL(baseURL: string): string;
/**
 * Build default headers for OpenAI chat completion.
 */
export declare function buildOpenAIChatHeaders(apiKey?: string): Record<string, string>;
export {};
//# sourceMappingURL=openai-chat.d.ts.map