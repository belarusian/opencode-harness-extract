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
import { LLMRequest as _LLMRequest, LLMResponse as _LLMResponse, ToolDefinition as _ToolDefinition, GenerationOptions as _GenerationOptions, Message as _Message, ResponseFormat as _ResponseFormat, } from "./schema/index.js";
import { buildOpenAIChatBody, buildOpenAIChatURL, buildOpenAIChatHeaders } from "./protocols/openai-chat.js";
import { streamFromURL } from "./protocols/sse-parser.js";
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
        const apiKey = request.model.native?.apiKey ?? request.model.providerID;
        // Use model.api.id for the actual API call
        const finalBody = { ...body, model: request.model.api.id };
        return streamFromURL(request.model.id, buildOpenAIChatHeaders(apiKey), finalBody, {
            modelID: request.model.id,
        });
    };
    const generate = (request) => {
        return stream(request).pipe(Stream.runCollect, Effect.map((collection) => {
            const events = [...collection];
            let usage;
            for (let i = events.length - 1; i >= 0; i--) {
                const event = events[i];
                if (event.type === "finish" && event.usage) {
                    usage = event.usage;
                    break;
                }
            }
            return eventsToResponse(events, usage);
        }));
    };
    const generateObject = (request) => {
        const jsonRequest = new _LLMRequest({
            ...request,
            responseFormat: _ResponseFormat.make({ type: "json", schema: {} }),
        });
        return stream(jsonRequest).pipe(Stream.runCollect, Effect.flatMap((collection) => {
            const events = [...collection];
            let text = "";
            for (const event of events) {
                if (event.type === "text-delta") {
                    text += event.text;
                }
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