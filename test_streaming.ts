/**
 * Test script for opencode-harness-llm streaming
 */

import { LLMClient, LLMClientLayer } from "./src/index.js";
import * as Effect from "effect/Effect";

const testStreaming = Effect.gen(function* () {
  const config = {
    baseUrl: process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1",
    model: "gpt-oss",
    apiKey: process.env.LLM_API_KEY || "foo",
    maxTokens: 1000,
    temperature: 0.1,
  };

  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);

  console.log("[Test] Testing generateStream()...");
  const generator = yield* client.generateStream(config, [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Say hello in 5 words" },
  ]);

  console.log("[Test] Streaming response:");
  
  // Consume the async generator
  const consumeAsyncGen = Effect.tryPromise({
    try: async () => {
      let fullResponse = "";
      for await (const chunk of generator) {
        fullResponse += chunk;
        process.stdout.write(chunk);
      }
      return fullResponse;
    },
    catch: (error) => new Error(`Failed to consume stream: ${error}`),
  });
  
  yield* consumeAsyncGen;
  
  console.log("\n[Test] Streaming complete");

  return 0;
});

Effect.runPromise(testStreaming)
  .then((code) => {
    console.log(`[Test] Test completed with code ${code}`);
    process.exit(code);
  })
  .catch((error) => {
    console.error("[Test] Test failed:", error);
    process.exit(1);
  });
