/**
 * Streaming support for LLM API responses
 */

import type { LLMConfig as Config } from "./config.js";

/**
 * Generate text with SSE streaming
 */
export function generateStream(
  config: Config,
  messages: Array<{ role: string; content: string }>,
): AsyncGenerator<string, void, unknown> {
  return async function* () {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (config.apiKey) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const requestBody = {
      model: config.model,
      messages: messages,
      stream: true,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    };

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`LLM request failed: ${response.status} ${bodyText}`);
    }

    if (!response.body) {
      throw new Error("Response body is null");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch {
            // Ignore parse errors (may be empty lines or other data)
          }
        }
      }
    }
  }();
}
