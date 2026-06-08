# @opencode-harness/llm

A standalone LLM client extracted from opencode's `packages/llm`. Provides the core infrastructure for agent loops: unified `LLMEvent` streams, tool execution, and OpenAI-compatible API support.

## Overview

This package provides:

- **LLMEvent** — Unified event contract for LLM streams (text, tools, reasoning, usage, errors)
- **LLMClient** — Effect-based client with `stream()`, `generate()`, `generateObject()`
- **Tool system** — `Tool`, `ToolExecutor`, `ToolFailure`, `ToolExecuteContext`, `formatToolResult()`
- **OpenAI Chat protocol** — `buildOpenAIChatBody()` converts `LLMRequest` to `chat/completions` JSON
- **SSE stream parser** — `streamFromURL()` converts OpenAI SSE → `Stream<LLMEvent>`
- **Schema layer** — `LLMRequest`, `LLMResponse`, `Message`, `ToolDefinition`, `Model`, `Usage`, errors
- **Caching** — In-memory `Cache` service

## Installation

```bash
pnpm add github:belarusian/opencode-harness-extract effect
```

## Quick Start

### Streaming with LLMEvents

```typescript
import { LLMClient, LLMClientLayer, simpleRequest } from "@opencode-harness/llm";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

const config = {
  baseUrl: "http://localhost:8080/v1",
  model: "llama-cpp/qwen3-coder-next-q8",
  apiKey: "your-key",
  maxTokens: 1000,
  temperature: 0.1,
};

const program = Effect.gen(function* () {
  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);

  // Build a request
  const request = simpleRequest(config, [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ]);

  // Stream as LLMEvents
  const stream = client.stream(request);

  // Process events
  yield* stream.pipe(
    Stream.tap((event) => {
      if (event.type === "text-delta") {
        process.stdout.write(event.text);
      }
    }),
    Stream.runDrain,
  );
});

Effect.runPromise(program);
```

### JSON Output

```typescript
const program = Effect.gen(function* () {
  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);

  const request = simpleRequest(config, [
    { role: "user", content: 'Return { "name": "Alice", "age": 30 }' },
  ], { responseFormat: "json" });

  const result = yield* client.generateObject<{ name: string; age: number }>(request);
  console.log(result); // { name: "Alice", age: 30 }
});
```

### Tool Execution

```typescript
import { ToolExecutor, ToolExecutorLayer, makeDynamicTool } from "@opencode-harness/llm";

const program = Effect.gen(function* () {
  const executor = yield* Effect.provide(ToolExecutorLayer)(ToolExecutor);

  const echoTool = makeDynamicTool(
    "echo",
    "Echoes the input",
    { type: "object", properties: { message: { type: "string" } } },
    (input: { message: string }) => Effect.succeed({ echoed: input.message })
  );

  const result = yield* executor.execute(echoTool, { message: "Hello" }, {
    id: "call-1",
    name: "echo",
  });
  console.log(result); // { type: "json", value: { echoed: "Hello" } }
});
```

## API

### LLMClient Service

```typescript
class LLMClient extends Context.Service<LLMClient, LLMClientShape>()("opencode-harness/LLMClient") {}

interface LLMClientShape {
  readonly stream: (request: LLMRequest) => Stream.Stream<LLMEvent, LLMError>;
  readonly generate: (request: LLMRequest) => Effect.Effect<LLMResponse, LLMError>;
  readonly generateObject: <T>(request: LLMRequest) => Effect.Effect<T, LLMError>;
}
```

### LLMEvent Types

The unified event contract produced by `stream()`:

```typescript
// Text events
{ type: "text-start"; id: string }
{ type: "text-delta"; id: string; text: string }
{ type: "text-end"; id: string }

// Reasoning events (for models with hidden reasoning)
{ type: "reasoning-start"; id: string }
{ type: "reasoning-delta"; id: string; text: string }
{ type: "reasoning-end"; id: string }

// Tool call events
{ type: "tool-input-start"; id: string; name: string }
{ type: "tool-input-delta"; id: string; name: string; text: string }
{ type: "tool-input-end"; id: string; name: string }
{ type: "tool-call"; id: string; name: string; input: unknown }
{ type: "tool-result"; id: string; name: string; result: ToolResultValue }
{ type: "tool-error"; id: string; name: string; message: string }

// Lifecycle events
{ type: "step-start"; index: number }
{ type: "step-finish"; index: number; reason: FinishReason; usage?: Usage }
{ type: "finish"; reason: FinishReason; usage?: Usage }
{ type: "provider-error"; message: string; retryable?: boolean }
```

### Tool System

```typescript
// Create a tool with JSON Schema
const tool = makeDynamicTool(
  "tool_name",
  "Tool description",
  { type: "object", properties: { ... } },
  (input: unknown) => Effect.succeed(result)
);

// Execute
yield* executor.execute(tool, input, { id: "call-id", name: "tool_name" });

// Execute multiple in parallel
yield* executor.executeTools([
  { tool, input, context: { id, name } },
  { tool, input, context: { id, name } },
]);
```

### Protocol Helpers

```typescript
// Build chat/completions body from LLMRequest
import { buildOpenAIChatBody, buildOpenAIChatURL, buildOpenAIChatHeaders } from "@opencode-harness/llm";

// Parse SSE stream into LLMEvent stream
import { streamFromURL } from "@opencode-harness/llm";
```

### Caching

```typescript
import { Cache, CacheLayer } from "@opencode-harness/llm";

const program = Effect.gen(function* () {
  const client = yield* Effect.provide(CacheLayer)(LLMClient);
  // Cache is provided automatically through LLMClientLayer
});
```

## Architecture

The harness provides the components opencode's agent loop needs:

1. **Schema layer** — `LLMEvent`, `LLMRequest`, `Message`, `ToolDefinition`, `Model`, `Usage`, errors
2. **Protocol** — OpenAI Chat body builder (`buildOpenAIChatBody`)
3. **Transport** — SSE stream parser (`streamFromURL`) producing `Stream<LLMEvent>`
4. **Client** — `LLMClient` service wrapping stream/generate/generateObject
5. **Tools** — `ToolExecutor` with parallel execution and error handling

## Projects Using This

- [anonize-ts](https://github.com/belarusian/anonize-ts) — PII anonymization CLI
- [resume-scanner-ts](https://github.com/belarusian/resume-scanner-ts) — Resume parsing

## License

MIT
