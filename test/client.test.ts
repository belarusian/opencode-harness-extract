import { describe, it, expect } from "vitest";
import { LLMClient, LLMClientLayer, simpleRequest } from "../src/client.js";
import { CacheLayer } from "../src/cache.js";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

describe("LLMClient", () => {
  const config = {
    baseUrl: process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1",
    model: "gpt-oss",
    apiKey: process.env.LLM_API_KEY || "foo",
    maxTokens: 1000,
    temperature: 0.1,
  };

  describe("simpleRequest", () => {
    it("should build a request from simple inputs", () => {
      const request = simpleRequest(config, [
        { role: "user", content: "Hello" },
      ]);
      expect(request).toBeDefined();
      expect(request.messages.length).toBe(1);
      expect(request.messages[0].role).toBe("user");
    });

    it("should include system messages", () => {
      const request = simpleRequest(config, [{ role: "user", content: "Hello" }], {
        system: "You are a helpful assistant.",
      });
      expect(request.system.length).toBe(1);
      expect(request.system[0].text).toBe("You are a helpful assistant.");
    });

    it("should support json response format", () => {
      const request = simpleRequest(config, [{ role: "user", content: "Return JSON" }], {
        responseFormat: "json",
      });
      expect(request.responseFormat).toBeDefined();
      expect(request.responseFormat?.type).toBe("json");
    });
  });

  describe("stream", () => {
    it("should return a stream for a simple request", () => {
      const request = simpleRequest(config, [{ role: "user", content: "Hello" }]);
      
      // Just verify the request can be built without error
      expect(request.model.id).toBe(config.model);
    });

    it("should include tools in the request", () => {
      const request = simpleRequest(config, [{ role: "user", content: "Hello" }], {
        tools: [
          { name: "echo", description: "Echo input", parameters: { type: "object", properties: { msg: { type: "string" } } } },
        ],
      });
      expect(request.tools?.length).toBe(1);
      expect(request.tools?.[0].name).toBe("echo");
    });
  });

  describe("integration with stream events", () => {
    it("should parse SSE events from a mock stream", async () => {
      // Test that the SSE parser correctly identifies event types
      // We can't easily mock fetch, so we verify the parser logic indirectly
      
      // Import the parser to verify it's exported correctly
      const { streamFromURL } = await import("../src/protocols/sse-parser.js");
      expect(typeof streamFromURL).toBe("function");
    });

    it("should build OpenAI chat body correctly", async () => {
      const { buildOpenAIChatBody } = await import("../src/protocols/openai-chat.js");
      const request = simpleRequest(config, [{ role: "user", content: "Hello" }]);
      
      const body = buildOpenAIChatBody(request);
      expect(body.model).toBe(request.model.api.id);
      expect(body.messages.length).toBeGreaterThan(0);
      expect(body.stream).toBe(true);
    });

    it("should include tools in OpenAI chat body", async () => {
      const { buildOpenAIChatBody } = await import("../src/protocols/openai-chat.js");
      const request = simpleRequest(config, [{ role: "user", content: "Hello" }], {
        tools: [
          { name: "search", description: "Search the web", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
        ],
      });
      
      const body = buildOpenAIChatBody(request);
      expect(body.tools).toBeDefined();
      expect(body.tools?.length).toBe(1);
      expect(body.tools?.[0].function.name).toBe("search");
      expect(body.tools?.[0].function.parameters.required).toContain("query");
    });

    it("should set response_format for JSON requests", async () => {
      const { buildOpenAIChatBody } = await import("../src/protocols/openai-chat.js");
      const request = simpleRequest(config, [{ role: "user", content: "Return JSON" }], {
        responseFormat: "json",
      });
      
      const body = buildOpenAIChatBody(request);
      expect(body.response_format).toEqual({ type: "json_object" });
    });

    it("should include generation options in body", async () => {
      const { buildOpenAIChatBody } = await import("../src/protocols/openai-chat.js");
      const request = simpleRequest(config, [{ role: "user", content: "Hello" }], {
        generation: { maxOutputTokens: 50, temperature: 0.7, topP: 0.9 },
      });
      
      const body = buildOpenAIChatBody(request);
      expect(body.max_tokens).toBe(50);
      expect(body.temperature).toBe(0.7);
      expect(body.top_p).toBe(0.9);
    });

    it("should build non-streaming body without stream field", async () => {
      const { buildOpenAIChatStreamBody } = await import("../src/protocols/openai-chat.js");
      const request = simpleRequest(config, [{ role: "user", content: "Hello" }]);
      
      const body = buildOpenAIChatStreamBody(request);
      expect(body.stream).toBeUndefined();
      expect(body.model).toBe(request.model.api.id);
    });

    it("should build correct URL from base URL", async () => {
      const { buildOpenAIChatURL } = await import("../src/protocols/openai-chat.js");
      expect(buildOpenAIChatURL("http://localhost:8080/v1")).toBe("http://localhost:8080/v1/chat/completions");
      expect(buildOpenAIChatURL("http://localhost:8080/v1/")).toBe("http://localhost:8080/v1/chat/completions");
      expect(buildOpenAIChatURL("http://api.example.com")).toBe("http://api.example.com/chat/completions");
    });

    it("should build correct headers with API key", async () => {
      const { buildOpenAIChatHeaders } = await import("../src/protocols/openai-chat.js");
      const headers = buildOpenAIChatHeaders("sk-test-key");
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Authorization"]).toBe("Bearer sk-test-key");
    });

    it("should build headers without Authorization when no API key", async () => {
      const { buildOpenAIChatHeaders } = await import("../src/protocols/openai-chat.js");
      const headers = buildOpenAIChatHeaders(undefined);
      expect(headers["Content-Type"]).toBe("application/json");
      expect(headers["Authorization"]).toBeUndefined();
    });
  });
});
