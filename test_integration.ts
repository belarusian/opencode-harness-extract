/**
 * Final integration test - end-to-end verification
 */

import { LLMClient, LLMClientLayer, tool, generateStream } from "./src/index.js";
import * as Effect from "effect/Effect";

const finalTest = Effect.gen(function* () {
  const config = {
    baseUrl: process.env.LLM_BASE_URL || "http://10.106.1.89:8080/v1",
    model: "gpt-oss",
    apiKey: process.env.LLM_API_KEY || "foo",
    maxTokens: 1000,
    temperature: 0.1,
  };

  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);

  console.log("\n=== Final Integration Test ===\n");

  // Test 1: Generate text
  console.log("[1/5] Testing generate()...");
  const textResult = yield* client.generate(config, [
    { role: "user", content: "What is the capital of France? Answer in one word." },
  ]);
  console.log(`    Result: ${textResult}\n`);

  // Test 2: Generate JSON
  console.log("[2/5] Testing generateObject()...");
  const objResult = yield* client.generateObject(
    config,
    [{ role: "user", content: 'Return { "country": "France", "population": 67000000 }' }],
    { type: "object" }
  );
  console.log(`    Result:`, objResult, "\n");

  // Test 3: Streaming
  console.log("[3/5] Testing generateStream()...");
  const generator = yield* client.generateStream(config, [
    { role: "user", content: "List 3 colors in one sentence" },
  ]);
  const streamResult = yield* Effect.tryPromise({
    try: async () => {
      let fullResponse = "";
      for await (const chunk of generator) {
        fullResponse += chunk;
      }
      return fullResponse;
    },
    catch: (error) => new Error(`Stream error: ${error}`),
  });
  console.log(`    Result: ${streamResult}\n`);

  // Test 4: Tool execution
  console.log("[4/5] Testing executeTool()...");
  const calculator = tool<{ a: number; b: number; op: string }>(
    "calculate",
    "Calculate result of operation",
    ({ a, b, op }: { a: number; b: number; op: string }) => {
      const result = op === "add" ? a + b : a * b;
      return Effect.succeed({ result });
    }
  );
  const toolResult = yield* client.executeTool(calculator, { a: 5, b: 3, op: "add" });
  console.log(`    Result:`, toolResult, "\n");

  // Test 5: Parallel tools
  console.log("[5/5] Testing executeTools()...");
  const tools = [
    { tool: calculator, input: { a: 2, b: 3, op: "add" } },
    { tool: calculator, input: { a: 4, b: 5, op: "multiply" } },
  ];
  const parallelResults = yield* client.executeTools(tools);
  console.log("    Results:", parallelResults, "\n");

  console.log("=== All Integration Tests Passed! ===\n");

  return 0;
});

Effect.runPromise(finalTest)
  .then((code) => {
    console.log(`Final test completed with code ${code}`);
    process.exit(code);
  })
  .catch((error) => {
    console.error("Final test failed:", error);
    process.exit(1);
  });
