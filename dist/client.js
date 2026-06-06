/**
 * LLMClient - Effect-based client for LLM API calls
 *
 * This is a simplified version of opencode's LLMClient.
 * It provides a clean API for making LLM requests using Effect.
 */
import * as Effect from "effect/Effect";
import * as Context from "effect/Context";
import * as Layer from "effect/Layer";
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
        return jsonStr;
    }),
    generateObject: (config, messages, _schema) => Effect.gen(function* () {
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
            return JSON.parse(jsonStr);
        }
        catch (error) {
            return yield* Effect.fail(new Error(`Failed to parse JSON: ${error}`));
        }
    }),
});
/**
 * Layer for LLMClient.
 */
export const LLMClientLayer = makeLLMClient;
//# sourceMappingURL=client.js.map