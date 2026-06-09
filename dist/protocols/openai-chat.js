/**
 * OpenAI Chat protocol — builds chat/completions body from LLMRequest
 */
// --- Body builder ---
/**
 * Convert a Message to OpenAI chat message format.
 */
function messageToOpenAI(msg) {
    switch (msg.role) {
        case "system": {
            const texts = msg.content.filter((p) => p.type === "text");
            return {
                role: "system",
                content: texts.map((p) => p.text).join("\n") || "",
            };
        }
        case "user": {
            const parts = [];
            for (const part of msg.content) {
                if (part.type === "text") {
                    parts.push({ type: "text", text: part.text });
                }
                else if (part.type === "media") {
                    parts.push({ type: "text", text: `[image: ${part.filename ?? part.mediaType}]` });
                }
            }
            return {
                role: "user",
                content: parts.length === 1 && parts[0].type === "text" ? parts[0].text : parts,
            };
        }
        case "assistant": {
            const toolCalls = [];
            const texts = [];
            for (const part of msg.content) {
                if (part.type === "text") {
                    texts.push(part.text);
                }
                else if (part.type === "tool-call") {
                    toolCalls.push({
                        id: part.id,
                        type: "function",
                        function: {
                            name: part.name,
                            arguments: typeof part.input === "string" ? part.input : JSON.stringify(part.input),
                        },
                    });
                }
            }
            const result = {
                role: "assistant",
                content: texts.join("\n") || (toolCalls.length > 0 ? null : ""),
            };
            if (toolCalls.length > 0) {
                result.tool_calls = toolCalls;
            }
            return result;
        }
        case "tool": {
            const toolResult = msg.content[0];
            if (!toolResult) {
                return { role: "tool", content: "", tool_call_id: "" };
            }
            // Handle tool-result parts
            if (toolResult.type === "tool-result") {
                return {
                    role: "tool",
                    content: typeof toolResult.result.value === "string"
                        ? toolResult.result.value
                        : JSON.stringify(toolResult.result.value),
                    tool_call_id: toolResult.id,
                };
            }
            // Handle text content (from reconstructed history)
            if (toolResult.type === "text") {
                return { role: "tool", content: toolResult.text, tool_call_id: "" };
            }
            return { role: "tool", content: "", tool_call_id: "" };
        }
    }
}
/**
 * Convert ToolDefinition to OpenAI tool format.
 */
function toolToOpenAI(tool) {
    return {
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema,
        },
    };
}
/**
 * Convert ToolChoice to OpenAI format.
 */
function toolChoiceToOpenAI(toolChoice) {
    switch (toolChoice.type) {
        case "auto":
            return "auto";
        case "none":
            return "none";
        case "required":
            return "required";
        case "tool":
            return { type: "function", function: { name: toolChoice.name } };
    }
}
/**
 * Internal builder shared by streaming and non-streaming paths.
 */
function buildChatBody(request, stream) {
    const messages = request.messages.map(messageToOpenAI);
    // Inject system messages at the front
    const systemParts = request.system;
    if (systemParts.length > 0) {
        const systemText = systemParts.map((p) => p.text).join("\n\n");
        const existingSystemIdx = messages.findIndex((m) => m.role === "system");
        if (existingSystemIdx >= 0) {
            const existing = messages[existingSystemIdx];
            messages[existingSystemIdx] = {
                ...existing,
                content: `${systemText}\n\n${existing.content}`,
            };
        }
        else {
            messages.unshift({ role: "system", content: systemText });
        }
    }
    const body = {
        model: request.model.id,
        messages,
        stream: stream ? true : undefined,
    };
    // Tools
    if (request.tools.length > 0) {
        body.tools = request.tools.map(toolToOpenAI);
    }
    // Tool choice
    if (request.toolChoice) {
        body.tool_choice = toolChoiceToOpenAI(request.toolChoice);
    }
    // Generation options
    if (request.generation) {
        if (request.generation.temperature !== undefined)
            body.temperature = request.generation.temperature;
        if (request.generation.topP !== undefined)
            body.top_p = request.generation.topP;
        if (request.generation.topK !== undefined)
            body.top_k = request.generation.topK;
        if (request.generation.maxOutputTokens !== undefined)
            body.max_tokens = request.generation.maxOutputTokens;
        if (request.generation.stopSequences && request.generation.stopSequences.length > 0)
            body.stop = [...request.generation.stopSequences];
        if (request.generation.presencePenalty !== undefined)
            body.presence_penalty = request.generation.presencePenalty;
        if (request.generation.frequencyPenalty !== undefined)
            body.frequency_penalty = request.generation.frequencyPenalty;
        if (request.generation.seed !== undefined)
            body.seed = request.generation.seed;
        if (request.generation.logitBias)
            body.logit_bias = request.generation.logitBias;
        if (request.generation.logProbs)
            body.log_probs = request.generation.logProbs;
        if (request.generation.topLogProbs)
            body.top_logprobs = request.generation.topLogProbs;
    }
    // Response format
    if (request.responseFormat) {
        if (request.responseFormat.type === "json") {
            body.response_format = { type: "json_object" };
        }
    }
    // Provider-specific options — merge into body
    if (request.providerOptions) {
        for (const [_provider, options] of Object.entries(request.providerOptions)) {
            if (options && typeof options === "object" && !Array.isArray(options)) {
                Object.assign(body, options);
            }
        }
    }
    return body;
}
/**
 * Build an OpenAI chat/completions body for streaming requests.
 */
export function buildOpenAIChatBody(request) {
    return buildChatBody(request, true);
}
/**
 * Build an OpenAI chat/completions body for non-streaming requests.
 */
export function buildOpenAIChatStreamBody(request) {
    return buildChatBody(request, false);
}
/**
 * Build the request URL for an OpenAI chat completion.
 */
export function buildOpenAIChatURL(baseURL) {
    const normalized = baseURL.endsWith("/") ? baseURL.slice(0, -1) : baseURL;
    return `${normalized}/chat/completions`;
}
/**
 * Build default headers for OpenAI chat completion.
 */
export function buildOpenAIChatHeaders(apiKey) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
    }
    return headers;
}
//# sourceMappingURL=openai-chat.js.map