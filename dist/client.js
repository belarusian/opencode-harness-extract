/**
 * LLMClient - Effect-based client for LLM API calls
 *
 * This is a simplified version of opencode's LLMClient.
 * It provides a clean API for making LLM requests using Effect.
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
import { Cache, CacheLayer } from "./cache.js";
import { generateStream } from "./streaming.js";
import { ToolExecutor, ToolExecutorLayer } from "./tool.js";
/**
 * Generate a cache key for LLM requests
 */
function generateCacheKey(config, messages) {
    const keyData = {
        baseUrl: config.baseUrl,
        model: config.model,
        maxTokens: config.maxTokens,
        temperature: config.temperature,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
    };
    return `llm:${JSON.stringify(keyData)}`;
}
/**
 * Service for the LLM client.
 */
export class LLMClient extends Context.Service()("opencode-harness/LLMClient") {
}
/**
 * Create the LLM client implementation.
 * Returns a Layer that provides the LLMClient service.
 */
export const makeLLMClient = Layer.succeed(LLMClient, {
    generate: (config, messages) => Effect.gen(function* () {
        const cacheKey = generateCacheKey(config, messages);
        // Try cache first (cache is provided by CacheLayer in LLMClientLayer)
        const cached = yield* Effect.provide(CacheLayer)(Cache).pipe(Effect.flatMap((cache) => cache.get(cacheKey)));
        if (cached !== undefined) {
            yield* Effect.logInfo(`[LLMClient] Cache hit for key: ${cacheKey}`);
            return cached;
        }
        yield* Effect.logInfo(`[LLMClient] Cache miss for key: ${cacheKey}`);
        const requestBody = {
            model: config.model,
            messages: messages,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
        };
        const headers = {
            "Content-Type": "application/json",
        };
        if (config.apiKey) {
            headers["Authorization"] = `Bearer ${config.apiKey}`;
        }
        const response = yield* Effect.tryPromise({
            try: async () => {
                const res = await fetch(`${config.baseUrl}/chat/completions`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(requestBody),
                });
                if (!res.ok) {
                    const bodyText = await res.text();
                    throw new Error(`LLM request failed: ${res.status} ${bodyText}`);
                }
                return res.json();
            },
            catch: (error) => new Error(`HTTP error: ${error}`),
        });
        const message = response.choices?.[0]?.message?.content;
        if (!message) {
            return yield* Effect.fail(new Error("No response from LLM"));
        }
        // Strip markdown code block wrapper if present
        let jsonStr = message.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.slice(7);
        }
        if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith("```")) {
            jsonStr = jsonStr.slice(0, -3);
        }
        jsonStr = jsonStr.trim();
        // Store in cache
        yield* Effect.provide(CacheLayer)(Cache).pipe(Effect.flatMap((cache) => cache.set(cacheKey, jsonStr)));
        return jsonStr;
    }),
    generateObject: (config, messages, _schema) => Effect.gen(function* () {
        const cacheKey = generateCacheKey(config, messages);
        // Try cache first (cache is provided by CacheLayer in LLMClientLayer)
        const cached = yield* Effect.provide(CacheLayer)(Cache).pipe(Effect.flatMap((cache) => cache.get(cacheKey)));
        if (cached !== undefined) {
            yield* Effect.logInfo(`[LLMClient] Cache hit for key: ${cacheKey}`);
            try {
                return JSON.parse(cached);
            }
            catch (error) {
                yield* Effect.logError(`[LLMClient] Failed to parse cached response: ${error}`);
                // Fall through to call LLM
            }
        }
        yield* Effect.logInfo(`[LLMClient] Cache miss for key: ${cacheKey}`);
        const requestBody = {
            model: config.model,
            messages: messages,
            response_format: { type: "json_object" },
            max_tokens: config.maxTokens,
            temperature: config.temperature,
        };
        const headers = {
            "Content-Type": "application/json",
        };
        if (config.apiKey) {
            headers["Authorization"] = `Bearer ${config.apiKey}`;
        }
        const response = yield* Effect.tryPromise({
            try: async () => {
                const res = await fetch(`${config.baseUrl}/chat/completions`, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(requestBody),
                });
                if (!res.ok) {
                    const bodyText = await res.text();
                    throw new Error(`LLM request failed: ${res.status} ${bodyText}`);
                }
                return res.json();
            },
            catch: (error) => new Error(`HTTP error: ${error}`),
        });
        const message = response.choices?.[0]?.message?.content;
        if (!message) {
            return yield* Effect.fail(new Error("No response from LLM"));
        }
        // Strip markdown code block wrapper if present
        let jsonStr = message.trim();
        if (jsonStr.startsWith("```json")) {
            jsonStr = jsonStr.slice(7);
        }
        if (jsonStr.startsWith("```")) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith("```")) {
            jsonStr = jsonStr.slice(0, -3);
        }
        jsonStr = jsonStr.trim();
        try {
            const result = JSON.parse(jsonStr);
            // Store in cache
            yield* Effect.provide(CacheLayer)(Cache).pipe(Effect.flatMap((cache) => cache.set(cacheKey, jsonStr)));
            return result;
        }
        catch (error) {
            return yield* Effect.fail(new Error(`Failed to parse JSON: ${error}`));
        }
    }),
    generateStream: (config, messages) => Effect.succeed(generateStream(config, messages)),
    executeTool: (tool, input) => Effect.gen(function* () {
        const toolExecutor = yield* ToolExecutor;
        return yield* toolExecutor.execute(tool, input);
    }).pipe(Effect.provide(ToolExecutorLayer)),
});
/**
 * Layer for LLMClient with ToolExecutor and Cache
 */
export const LLMClientLayer = Layer.provide(ToolExecutorLayer)(Layer.provide(CacheLayer)(makeLLMClient));
//# sourceMappingURL=client.js.map