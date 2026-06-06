/**
 * Test script for opencode-harness-llm
 */

import { LLMClient, LLMClientLayer } from "./src/index.js";
import * as Effect from "effect/Effect";

const testLLMClient = Effect.gen(function* () {
  const config = {
    baseUrl: process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1",
    model: "gpt-oss",
    apiKey: process.env.LLM_API_KEY || "foo",
    maxTokens: 1000,
    temperature: 0.1,
  };

  // Provide the LLMClient layer
  const llmClient = yield* Effect.provide(LLMClientLayer)(LLMClient);

  console.log("[Test] Testing generate()...");
  const result1 = yield* llmClient.generate(config, [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Say hello!" },
  ]);
  console.log(`[Test] generate() result: ${result1.substring(0, 50)}...`);

  console.log("[Test] Testing generateObject()...");
  const result2 = yield* llmClient.generateObject(
    config,
    [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: 'Return a JSON object with name and age. Name: "Alice", Age: 30' },
    ],
    { type: "object", properties: { name: { type: "string" }, age: { type: "number" } } }
  );
  console.log(`[Test] generateObject() result:`, result2);

  console.log("[Test] Testing executeTool()...");
  const result3 = yield* llmClient.executeTool(
    {
      schema: {
        name: "test_tool",
        description: "A test tool",
        execute: () => Effect.succeed("Tool executed successfully"),
      },
    },
    {}
  );
  console.log(`[Test] executeTool() result:`, result3);

  return 0;
});

// Run the test
Effect.runPromise(testLLMClient)
  .then((code) => {
    console.log(`[Test] Test completed with code ${code}`);
    process.exit(code);
  })
  .catch((error) => {
    console.error("[Test] Test failed:", error);
    process.exit(1);
  });
