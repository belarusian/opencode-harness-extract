import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { LLMClient, LLMClientLayer, simpleRequest } from "../src/client.js";
import { ToolChoice, LLMEvent } from "../src/schema/index.js";
import { AgentLoop } from "../src/agent.js";
import { runAgent, streamAgent, AgentTool, AgentLoopLayer } from "../src/agent.js";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

// Integration tests require a running LLM endpoint.
// Set LLM_BASE_URL to enable: LLM_BASE_URL=http://localhost:8080/v1 pnpm test
const hasEndpoint = !!process.env.LLM_BASE_URL;

describe("Integration: LLM Streaming", () => {
  if (!hasEndpoint) {
    it.skip("skipped — set LLM_BASE_URL to enable", () => {})
    return
  }
  const baseUrl = process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1";
  const apiKey = process.env.LLM_API_KEY || "";
  const model = process.env.LLM_MODEL || "gpt-oss";

  const config = {
    baseUrl,
    model,
    apiKey,
    maxTokens: 256,
    temperature: 0.1,
  };

  it("should stream text from a real LLM endpoint", async () => {
    const request = simpleRequest(config, [
      { role: "user", content: "Say exactly: 'Integration test passed'" },
    ]);

    const program = Effect.gen(function* () {
      const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
      const stream = client.stream(request);

      // Collect all text deltas from the stream
      const chunks = yield* stream.pipe(
        Stream.filter((event) => event.type === "text-delta"),
        Stream.map((event) => event.text),
        Stream.runCollect,
      );

      return [...chunks].join("");
    });

    const result = await Effect.runPromise(program);
    expect(result.length).toBeGreaterThan(0);
    expect(result.toLowerCase()).toContain("integration test passed");
  }, 30000);

  it("should collect step-finish event with usage", async () => {
    const request = simpleRequest(config, [
      { role: "user", content: "Say hi" },
    ]);

    const program = Effect.gen(function* () {
      const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
      const stream = client.stream(request);

      const events = yield* stream.pipe(Stream.runCollect);

      const eventTypes = [...events].map((e) => e.type);
      return {
        hasStepFinish: eventTypes.includes("step-finish"),
        hasFinish: eventTypes.includes("finish"),
      };
    });

    const result = await Effect.runPromise(program);
    expect(result.hasStepFinish).toBe(true);
    expect(result.hasFinish).toBe(true);
  }, 30000);

  it("should handle provider errors gracefully", async () => {
    // Just verify the stream infrastructure works without crashing
    const request = simpleRequest(config, [{ role: "user", content: "Hi" }]);

    const program = Effect.gen(function* () {
      const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
      const stream = client.stream(request);

      let eventCount = 0;
      yield* stream.pipe(
        Stream.tap(() => Effect.sync(() => { eventCount++; })),
        Stream.runCollect,
      );

      return eventCount;
    });

    const count = await Effect.runPromise(program);
    expect(count).toBeGreaterThan(0);
  }, 30000);
});

describe("Integration: Non-Streaming", () => {
  if (!hasEndpoint) {
    it.skip("skipped — set LLM_BASE_URL to enable", () => {})
    return
  }
  const baseUrl = process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1";
  const apiKey = process.env.LLM_API_KEY || "";
  const model = process.env.LLM_MODEL || "gpt-oss";

  const config = {
    baseUrl,
    model,
    apiKey,
    maxTokens: 128,
    temperature: 0.1,
  };

  it("should generate text with generate", async () => {
    const request = simpleRequest(config, [
      { role: "user", content: "Say exactly: 'non-streaming works'" },
    ]);

    const program = Effect.gen(function* () {
      const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
      return yield* client.generate(request);
    });

    const result = await Effect.runPromise(program);
    expect(result.content.length).toBeGreaterThan(0);
    const textContent = result.content.find((p) => p.type === "text") as Extract<typeof p, { type: "text" }> | undefined;
    expect(textContent?.text.toLowerCase()).toContain("non-streaming works");
  }, 30000);

  it("should handle tool calls in generate response", async () => {
    const request = simpleRequest(config, [
      { role: "user", content: "Call the echo tool with message 'hello'" },
    ], {
      tools: [
        { name: "echo", description: "Echo a message", parameters: { type: "object", properties: { message: { type: "string" } }, required: ["message"] } },
      ],
      toolChoice: ToolChoice.make("required"),
    });

    const program = Effect.gen(function* () {
      const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
      return yield* client.generate(request);
    });

    const result = await Effect.runPromise(program);
    const toolCall = result.content.find((p) => p.type === "tool-call") as Extract<typeof p, { type: "tool-call" }> | undefined;
    expect(toolCall?.name).toBe("echo");
  }, 30000);
});

describe("Integration: JSON Output", () => {
  if (!hasEndpoint) {
    it.skip("skipped — set LLM_BASE_URL to enable", () => {})
    return
  }
  const baseUrl = process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1";
  const apiKey = process.env.LLM_API_KEY || "";
  const model = process.env.LLM_MODEL || "gpt-oss";

  const config = {
    baseUrl,
    model,
    apiKey,
    maxTokens: 128,
    temperature: 0.1,
  };

  it("should generate valid JSON with generateObject", async () => {
    const request = simpleRequest(config, [
      { role: "user", content: 'Return a JSON object with keys "greeting" and "language". Use short values.' },
    ], { responseFormat: "json" });

    const program = Effect.gen(function* () {
      const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
      return yield* client.generateObject<{ greeting: string; language: string }>(request);
    });

    const result = await Effect.runPromise(program);
    expect(result).toHaveProperty("greeting");
    expect(result).toHaveProperty("language");
    expect(typeof result.greeting).toBe("string");
    expect(typeof result.language).toBe("string");
  }, 30000);
});

describe("Integration: Agent Loop", () => {
  if (!hasEndpoint) {
    it.skip("skipped — set LLM_BASE_URL to enable", () => {})
    return
  }
  const baseUrl = process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1";
  const apiKey = process.env.LLM_API_KEY || "";
  const model = process.env.LLM_MODEL || "gpt-oss";

  const config = {
    baseUrl,
    model,
    apiKey,
    maxTokens: 256,
    temperature: 0.1,
  };

  it("should execute tools and loop until stop", async () => {
    const echoTool: AgentTool = {
      name: "echo",
      description: "Echo the input message",
      jsonSchema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
      execute: (params: any) => Effect.succeed(`Echo: ${params.message}`),
    };

    const result = await Effect.runPromise(
      runAgent({
        config,
        messages: [{ role: "user", content: "Call echo with message 'hello world'" }],
        tools: [echoTool],
        maxSteps: 5,
      }),
    );

    expect(result.rounds).toBeGreaterThan(0);
    expect(result.toolCallCount).toBeGreaterThan(0);
    expect(result.response.content.length).toBeGreaterThan(0);
    const text = result.response.content.find((p) => p.type === "text") as Extract<typeof p, { type: "text" }> | undefined;
    expect(text?.text.toLowerCase()).toContain("hello world");
  }, 30000);

  it("should stop when stopWhen predicate returns true", async () => {
    let callCount = 0;
    const tool: AgentTool = {
      name: "counter",
      description: "Count calls",
      jsonSchema: { type: "object", properties: {}, required: [] },
      execute: () => { callCount++; return Effect.succeed(callCount); },
    };

    const result = await Effect.runPromise(
      runAgent({
        config,
        messages: [{ role: "user", content: "Keep calling counter" }],
        tools: [tool],
        stopWhen: (state) => state.toolCallCount >= 2,
        maxSteps: 10,
      }),
    );

    expect(result.stopReason).toBe("stopWhen");
    expect(result.toolCallCount).toBeGreaterThanOrEqual(2);
  }, 30000);

  it("should stop at maxSteps", async () => {
    const tool: AgentTool = {
      name: "loop",
      description: "Keep looping",
      jsonSchema: { type: "object", properties: {}, required: [] },
      execute: () => Effect.succeed("looped"),
    };

    const result = await Effect.runPromise(
      runAgent({
        config,
        messages: [{ role: "user", content: "Keep calling loop" }],
        tools: [tool],
        toolChoice: "required",
        maxSteps: 2,
      }),
    );

    expect(result.rounds).toBeLessThanOrEqual(2);
  }, 30000);
});

describe("Integration: Agent Loop - Streaming", () => {
  if (!hasEndpoint) {
    it.skip("skipped — set LLM_BASE_URL to enable", () => {})
    return
  }
  const baseUrl = process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1";
  const apiKey = process.env.LLM_API_KEY || "";
  const model = process.env.LLM_MODEL || "gpt-oss";

  const config = {
    baseUrl,
    model,
    apiKey,
    maxTokens: 256,
    temperature: 0.1,
  };

  it("should stream text and tool calls interleaved", async () => {
    const echoTool: AgentTool = {
      name: "echo",
      description: "Echo the input message",
      jsonSchema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
      execute: (params: any) => Effect.succeed(`Echo: ${params.message}`),
    };

    const events: LLMEvent[] = [];
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const loop = yield* Effect.provide(AgentLoopLayer)(AgentLoop);
        return yield* loop.stream({
          config,
          messages: [{ role: "user", content: "Call echo with message 'hello world'" }],
          tools: [echoTool],
          maxSteps: 5,
        }).pipe(Stream.runCollect);
      }),
    );

    const eventTypes = [...result].map((e) => e.type);
    expect(eventTypes).toContain("text-delta");
    expect(eventTypes).toContain("tool-call");
    expect(eventTypes).toContain("tool-result");
    expect(eventTypes).toContain("finish");
  }, 30000);

  it("should stop when stopWhen predicate returns true", async () => {
    let callCount = 0;
    const tool: AgentTool = {
      name: "counter",
      description: "Count calls",
      jsonSchema: { type: "object", properties: {}, required: [] },
      execute: () => { callCount++; return Effect.succeed(callCount); },
    };

    const events: LLMEvent[] = [];
    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const loop = yield* Effect.provide(AgentLoopLayer)(AgentLoop);
        return yield* loop.stream({
          config,
          messages: [{ role: "user", content: "Keep calling counter" }],
          tools: [tool],
          stopWhen: (state) => state.toolCallCount >= 2,
          maxSteps: 10,
        }).pipe(Stream.runCollect);
      }),
    );

    const toolCallCount = [...result].filter((e) => e.type === "tool-call").length;
    expect(toolCallCount).toBeGreaterThanOrEqual(2);
  }, 30000);
});

