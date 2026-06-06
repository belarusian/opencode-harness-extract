/**
 * LLMClient - Effect-based client for LLM API calls
 *
 * This is a simplified version of opencode's LLMClient.
 * It provides a clean API for making LLM requests using Effect.
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import type { LLMConfig as Config } from "./config.js";
/**
 * Configuration for the LLM client.
 */
export interface LLMConfig {
    readonly baseUrl: string;
    readonly model: string;
    readonly apiKey?: string;
    readonly maxTokens?: number;
    readonly temperature?: number;
}
declare const LLMClient_base: Context.ServiceClass<LLMClient, "opencode-harness/LLMClient", LLMClientShape>;
/**
 * Service for the LLM client.
 */
export declare class LLMClient extends LLMClient_base {
}
/**
 * Shape of the LLM client service.
 */
export interface LLMClientShape {
    readonly generate: (config: Config, messages: Array<{
        role: string;
        content: string;
    }>) => Effect.Effect<string, Error>;
    readonly generateObject: <T>(config: Config, messages: Array<{
        role: string;
        content: string;
    }>, schema: unknown) => Effect.Effect<T, Error>;
}
/**
 * Create the LLM client implementation.
 * Returns a Layer that provides the LLMClient service.
 */
export declare const makeLLMClient: Layer.Layer<LLMClient, never, never>;
/**
 * Layer for LLMClient.
 */
export declare const LLMClientLayer: Layer.Layer<LLMClient, never, never>;
export {};
//# sourceMappingURL=client.d.ts.map