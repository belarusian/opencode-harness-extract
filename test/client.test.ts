import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { LLMClient, LLMClientLayer, generateStream } from "./src/index.js";
import * as Effect from "effect/Effect";

describe("LLMClient", () => {
  const config = {
    baseUrl: process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1",
    model: "gpt-oss",
    apiKey: process.env.LLM_API_KEY || "foo",
    maxTokens: 1000,
    temperature: 0.1,
  };

  describe("generate", () => {
    it("should generate text", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        return yield* client.generate(config, [
          { role: "user", content: "Say hello" },
        ]);
      });

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
      expect(result.length).toBeGreaterThan(0);
    });

    it("should return cached result on second call", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        
        // First call
        const result1 = yield* client.generate(config, [
          { role: "user", content: "What is 1+1?" },
        ]);
        
        // Second call (should be cached)
        const result2 = yield* client.generate(config, [
          { role: "user", content: "What is 1+1?" },
        ]);
        
        return { result1, result2 };
      });

      const { result1, result2 } = await Effect.runPromise(program);
      expect(result1).toBe(result2);
    });
  });

  describe("generateObject", () => {
    it("should generate JSON object", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        return yield* client.generateObject(
          config,
          [{ role: "user", content: 'Return { "name": "Test", "age": 25 }' }],
          { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } }
        );
      });

      const result = await Effect.runPromise(program);
      expect(result).toEqual({ name: "Test", age: 25 });
    });

    it("should parse complex JSON", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        return yield* client.generateObject(
          config,
          [{ role: "user", content: 'Return { "users": [{ "name": "Alice", "active": true }, { "name": "Bob", "active": false }] }' }],
          { type: "object" }
        );
      });

      const result = await Effect.runPromise(program);
      expect(result).toHaveProperty("users");
      expect(Array.isArray(result.users)).toBe(true);
    });
  });

  describe("generateStream", () => {
    it("should return async generator", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        return yield* client.generateStream(config, [
          { role: "user", content: "Say hello in 3 words" },
        ]);
      });

      const generator = await Effect.runPromise(program);
      
      // Verify it's an async generator
      const chunks = [];
      for await (const chunk of generator) {
        chunks.push(chunk);
      }
      
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join("")).toContain("Hello");
    });
  });

  describe("executeTool", () => {
    it("should execute a simple tool", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        return yield* client.executeTool(
          {
            schema: {
              name: "echo",
              description: "Echoes the input",
              execute: ({ message }: { message: string }) => Effect.succeed({ echoed: message }),
            },
          },
          { message: "Hello" }
        );
      });

      const result = await Effect.runPromise(program);
      expect(result).toEqual({ echoed: "Hello" });
    });
  });

  describe("executeTools (parallel)", () => {
    it("should execute multiple tools in parallel", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        const tools = [
          {
            tool: {
              schema: {
                name: "add",
                description: "Add two numbers",
                execute: ({ a, b }: { a: number; b: number }) => Effect.succeed(a + b),
              },
            },
            input: { a: 1, b: 2 },
          },
          {
            tool: {
              schema: {
                name: "multiply",
                description: "Multiply two numbers",
                execute: ({ a, b }: { a: number; b: number }) => Effect.succeed(a * b),
              },
            },
            input: { a: 3, b: 4 },
          },
        ];
        return yield* client.executeTools(tools);
      });

      const results = await Effect.runPromise(program);
      expect(results.length).toBe(2);
      
      const addResult = results.find((r) => r.tool === "add");
      const multiplyResult = results.find((r) => r.tool === "multiply");
      
      expect(addResult?.success).toBe(true);
      expect(addResult?.result).toBe(3);
      
      expect(multiplyResult?.success).toBe(true);
      expect(multiplyResult?.result).toBe(12);
    });

    it("should track failures with structured results", async () => {
      const program = Effect.gen(function* () {
        const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
        const tools = [
          {
            tool: {
              schema: {
                name: "success",
                description: "Always succeeds",
                execute: () => Effect.succeed("ok"),
              },
            },
            input: {},
          },
          {
            tool: {
              schema: {
                name: "failure",
                description: "Always fails",
                execute: () => Effect.fail(new Error("Intentional failure")),
              },
            },
            input: {},
          },
        ];
        return yield* client.executeTools(tools);
      });

      const results = await Effect.runPromise(program);
      expect(results.length).toBe(2);
      
      const successResult = results.find((r) => r.tool === "success");
      const failureResult = results.find((r) => r.tool === "failure");
      
      expect(successResult?.success).toBe(true);
      expect(failureResult?.success).toBe(false);
    });
  });
});
