import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { LLMClient, LLMClientLayer, simpleRequest } from "../src/client.js";
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
