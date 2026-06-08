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
import { CacheLayer } from "./cache.js";
import { LLMRequest as _LLMRequest, LLMResponse as _LLMResponse, ToolDefinition as _ToolDefinition, GenerationOptions as _GenerationOptions, Message as _Message, Usage as _Usage, ResponseFormat as _ResponseFormat, } from "./schema/index.js";
import { buildOpenAIChatBody, buildOpenAIChatURL, buildOpenAIChatHeaders, buildOpenAIChatStreamBody } from "./protocols/openai-chat.js";
import { streamFromBody } from "./protocols/sse-parser.js";
import { isRecord } from "./utils/record.js";
// --- LLMClient Service ---
export class LLMClient extends Context.Service()("opencode-harness/LLMClient") {
}
// --- Helpers ---
/**
 * Build an LLMRequest from simple config + messages.
 */
export function simpleRequest(config, messages, options) {
    const model = {
        id: config.model,
        providerID: "openai-compatible",
        api: {
            id: config.model,
            npm: "@ai-sdk/openai-compatible",
        },
        native: { baseUrl: config.baseUrl, apiKey: config.apiKey },
    };
    const system = [];
    if (options?.system) {
        const parts = Array.isArray(options.system) ? options.system : [options.system];
        for (const text of parts) {
            system.push({ type: "text", text });
        }
    }
    const msgs = messages.map((m) => _Message.make({
        role: m.role,
        content: m.content,
    }));
    const genOpts = options?.generation
        ? new _GenerationOptions({
            maxOutputTokens: config.maxTokens,
            temperature: config.temperature,
            topP: config.topP,
            topK: config.topK,
            ...options.generation,
        })
        : undefined;
    const respFormat = options?.responseFormat
        ? options.responseFormat === "json"
            ? _ResponseFormat.make({ type: "json", schema: {} })
            : _ResponseFormat.make({ type: "text" })
        : undefined;
    return new _LLMRequest({
        model,
        system,
        messages: msgs,
        tools: (options?.tools ?? []).map((t) => _ToolDefinition.make({
            name: t.name,
            description: t.description,
            inputSchema: t.parameters,
        })),
        toolChoice: options?.toolChoice,
        generation: genOpts,
        responseFormat: respFormat,
    });
}
/**
 * Build LLMResponse from collected events.
 */
function eventsToResponse(events, usage) {
    const contentParts = [];
    let finish = undefined;
    for (const event of events) {
        if (event.type === "text-delta") {
            let textPart = contentParts.find((p) => p.type === "text");
            if (!textPart) {
                textPart = { type: "text", text: "" };
                contentParts.push(textPart);
            }
            // Need to mutate — use Object.assign workaround since Schema.Class makes fields readonly
            ;
            textPart.text += event.text;
        }
    }
    return new _LLMResponse({
        content: contentParts,
        finish: finish,
        usage,
    });
}
// --- Implementation ---
export const makeLLMClient = Layer.effect(LLMClient, Effect.gen(function* () {
    const stream = (request) => {
        const body = buildOpenAIChatBody(request);
        const baseUrl = request.model.native?.baseUrl ?? "http://localhost:8080/v1";
        const apiKey = request.model.native?.apiKey;
        // Use model.api.id for the actual API call
        const finalBody = { ...body, model: request.model.api.id };
        const url = buildOpenAIChatURL(baseUrl);
        return streamFromBody(url, buildOpenAIChatHeaders(apiKey), finalBody, {
            modelID: request.model.id,
        });
    };
    const generate = (request) => {
        const body = buildOpenAIChatStreamBody(request);
        const baseUrl = request.model.native?.baseUrl ?? "http://localhost:8080/v1";
        const apiKey = request.model.native?.apiKey;
        const finalBody = { ...body, model: request.model.api.id };
        const url = buildOpenAIChatURL(baseUrl);
        const headers = buildOpenAIChatHeaders(apiKey);
        return Effect.tryPromise({
            try: () => fetch(url, { method: "POST", headers, body: JSON.stringify(finalBody) }),
            catch: (error) => ({
                _tag: "APIError",
                message: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
                isRetryable: true,
            }),
        }).pipe(Effect.flatMap((response) => Effect.tryPromise({
            try: () => response.json(),
            catch: (error) => ({
                _tag: "APIError",
                message: `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
                isRetryable: false,
            }),
        })), Effect.flatMap((json) => {
            if (!isRecord(json) || !Array.isArray(json.choices) || json.choices.length === 0) {
                return Effect.succeed(eventsToResponse([], undefined));
            }
            const data = json;
            const choices = data.choices;
            const choice = choices[0];
            const message = choice.message;
            const contentParts = [];
            if (message?.content && typeof message.content === "string" && message.content.trim()) {
                contentParts.push({ type: "text", text: message.content });
            }
            let usage = undefined;
            if (data.usage && isRecord(data.usage)) {
                const u = data.usage;
                usage = new _Usage({
                    inputTokens: u.prompt_tokens,
                    outputTokens: u.completion_tokens,
                    totalTokens: u.total_tokens,
                    reasoningTokens: u.completion_tokens_details && isRecord(u.completion_tokens_details)
                        ? u.completion_tokens_details.reasoning_tokens
                        : undefined,
                    cacheReadInputTokens: u.prompt_tokens_details && isRecord(u.prompt_tokens_details)
                        ? u.prompt_tokens_details.cached_tokens
                        : undefined,
                });
            }
            const finish = choice.finish_reason ? String(choice.finish_reason) : undefined;
            return Effect.succeed(new _LLMResponse({
                content: contentParts,
                finish: finish,
                usage,
            }));
        }));
    };
    const generateObject = (request) => {
        const jsonRequest = new _LLMRequest({
            ...request,
            responseFormat: _ResponseFormat.make({ type: "json", schema: {} }),
        });
        const body = buildOpenAIChatStreamBody(jsonRequest);
        const baseUrl = jsonRequest.model.native?.baseUrl ?? "http://localhost:8080/v1";
        const apiKey = jsonRequest.model.native?.apiKey;
        const finalBody = { ...body, model: jsonRequest.model.api.id };
        const url = buildOpenAIChatURL(baseUrl);
        const headers = buildOpenAIChatHeaders(apiKey);
        return Effect.tryPromise({
            try: () => fetch(url, { method: "POST", headers, body: JSON.stringify(finalBody) }),
            catch: (error) => ({
                _tag: "APIError",
                message: `Fetch failed: ${error instanceof Error ? error.message : String(error)}`,
                isRetryable: true,
            }),
        }).pipe(Effect.flatMap((response) => {
            if (!response.ok) {
                return Effect.tryPromise({
                    try: () => response.text(),
                    catch: (e) => ({
                        _tag: "APIError",
                        message: `HTTP ${response.status}: ${e instanceof Error ? e.message : String(e)}`,
                        isRetryable: false,
                    }),
                }).pipe(Effect.flatMap((text) => Effect.fail({
                    _tag: "APIError",
                    message: `LLM request failed: ${response.status} ${text}`,
                    isRetryable: false,
                })));
            }
            return Effect.tryPromise({
                try: () => response.json(),
                catch: (error) => ({
                    _tag: "APIError",
                    message: `Failed to parse response: ${error instanceof Error ? error.message : String(error)}`,
                    isRetryable: false,
                }),
            });
        }), Effect.flatMap((json) => {
            if (!isRecord(json) || !Array.isArray(json.choices) || json.choices.length === 0) {
                return Effect.fail({
                    _tag: "APIError",
                    message: "Empty response from LLM",
                    isRetryable: false,
                });
            }
            const data = json;
            const choices = data.choices;
            const choice = choices[0];
            const message = choice.message;
            let text = "";
            if (message?.content && typeof message.content === "string") {
                text = message.content;
            }
            let jsonStr = text.trim();
            if (jsonStr.startsWith("```json"))
                jsonStr = jsonStr.slice(7);
            if (jsonStr.startsWith("```"))
                jsonStr = jsonStr.slice(3);
            if (jsonStr.endsWith("```"))
                jsonStr = jsonStr.slice(0, -3);
            jsonStr = jsonStr.trim();
            return Effect.try({
                try: () => JSON.parse(jsonStr),
                catch: (error) => new Error(`Failed to parse JSON response: ${error instanceof Error ? error.message : String(error)}`),
            });
        }));
    };
    return LLMClient.of({ stream, generate, generateObject });
}));
export const LLMClientLayer = makeLLMClient.pipe(Layer.provide(CacheLayer));
/**
 * Stream from simple inputs without building LLMRequest.
 */
export function simpleStream(input) {
    const request = simpleRequest(input.config, input.messages, {
        system: input.system,
        tools: input.tools,
    });
    const body = buildOpenAIChatBody(request);
    const url = buildOpenAIChatURL(input.config.baseUrl);
    const headers = buildOpenAIChatHeaders(input.config.apiKey);
    const asyncGen = async function* () {
        const controller = new AbortController();
        try {
            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal: controller.signal,
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`LLM request failed: ${response.status} ${text}`);
            }
            if (!response.body) {
                throw new Error("Response body is null");
            }
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done)
                        break;
                    const chunk = decoder.decode(value, { stream: true });
                    buffer += chunk;
                    const lines = buffer.split("\n");
                    buffer = lines.pop() ?? "";
                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (trimmed && trimmed.startsWith("data: ")) {
                            const data = trimmed.slice(6);
                            if (data === "[DONE]")
                                continue;
                            try {
                                const parsed = JSON.parse(data);
                                const choice = parsed.choice?.[0];
                                if (choice?.delta?.content) {
                                    yield {
                                        type: "text-delta",
                                        id: "text-0",
                                        text: choice.delta.content,
                                    };
                                }
                            }
                            catch {
                                // Ignore parse errors
                            }
                        }
                    }
                }
            }
            finally {
                reader.releaseLock();
            }
        }
        finally {
            controller.abort();
        }
    };
    return Stream.fromAsyncIterable(asyncGen(), (error) => error instanceof Error ? error : new Error(String(error)));
}
//# sourceMappingURL=client.js.map