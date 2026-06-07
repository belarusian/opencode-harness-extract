/**
 * Test script for opencode-harness-llm caching
 */

import { LLMClient, LLMClientLayer, Cache, CacheLayer } from "./src/index.js";
import * as Effect from "effect/Effect";

const testCaching = Effect.gen(function* () {
  const config = {
    baseUrl: process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1",
    model: "gpt-oss",
    apiKey: process.env.LLM_API_KEY || "foo",
    maxTokens: 1000,
    temperature: 0.1,
  };

  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);

  console.log("[Test] Testing caching...");
  
  // First call - should be cache miss
  console.log("[Test] First call (cache miss expected):");
  const result1 = yield* client.generate(config, [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Say hello in 3 words" },
  ]);
  console.log(`[Test] Result: ${result1}`);

  // Second call - should be cache hit
  console.log("\n[Test] Second call (cache hit expected):");
  const result2 = yield* client.generate(config, [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Say hello in 3 words" },
  ]);
  console.log(`[Test] Result: ${result2}`);

  // Verify results are the same
  if (result1 === result2) {
    console.log("\n[Test] Cache working correctly - results match");
  } else {
    console.log("\n[Test] ERROR: Results don't match!");
  }

  return 0;
});

Effect.runPromise(testCaching)
  .then((code) => {
    console.log(`[Test] Test completed with code ${code}`);
    process.exit(code);
  })
  .catch((error) => {
    console.error("[Test] Test failed:", error);
    process.exit(1);
  });
