# @opencode-harness/llm

A standalone LLM client extracted from opencode's `packages/llm`. Provides the core infrastructure for agent loops with **two execution paths**:

1. **Synchronous (`runAgent`)** — "Call it, get a result" — collects all events per round, returns `AgentLoopResult`
2. **Reactive (`streamAgent`)** — Real-time streaming — returns `Stream<LLMEvent>` with text deltas, tool calls, tool results, and more text deltas all interleaved across rounds

## Overview

This package provides:

- **LLMEvent** — Unified event contract for LLM streams (text, tools, reasoning, usage, errors)
- **LLMClient** — Effect-based client with `stream()`, `generate()`, `generateObject()`
- **Tool system** — `Tool`, `ToolExecutor`, `ToolFailure`, `ToolExecuteContext`, `formatToolResult()`
- **OpenAI Chat protocol** — `buildOpenAIChatBody()` (streaming) and `buildOpenAIChatStreamBody()` (non-streaming) for `chat/completions` JSON
- **SSE stream parser** — `streamFromURL()` converts OpenAI SSE → `Stream<LLMEvent>`
- **Schema layer** — `LLMRequest`, `LLMResponse`, `Message`, `ToolDefinition`, `Model`, `Usage`, errors
- **Caching** — In-memory `Cache` service
- **Agent Loop** — `runAgent()` (synchronous) and `streamAgent()` (reactive) for multi-step tool execution

## Installation

```bash
pnpm add github:belarusian/opencode-harness-extract effect
```

## Quick Start

### Streaming with LLMEvents (LLMClient)

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

Effect.runPromise(program);
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

Effect.runPromise(program);
```

### Synchronous Agent Loop (`runAgent`)

```typescript
import { runAgent, AgentTool } from "@opencode-harness/llm";
import * as Effect from "effect/Effect";

const echoTool: AgentTool = {
  name: "echo",
  description: "Echo the input message",
  jsonSchema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
  execute: (params: any, context) => Effect.succeed(`Echo: ${params.message} (step ${context.step}, round ${context.round})`),
};

const result = await Effect.runPromise(
  runAgent({
    config,
    messages: [{ role: "user", content: "Call echo with message 'hello world'" }],
    tools: [echoTool],
    maxSteps: 5,
  }),
);

console.log(result.response.content); // Final response
console.log(result.rounds); // Number of rounds executed
console.log(result.toolCallCount); // Total tool calls made
console.log(result.messages); // Full conversation history
console.log(result.stopReason); // "stop" | "maxSteps" | "stopWhen"
```

### Reactive Agent Loop (`streamAgent`)

```typescript
import { streamAgent, AgentTool, LLMEvent } from "@opencode-harness/llm";
import * as Effect from "effect/Effect";
import * as Stream from "effect/Stream";

const echoTool: AgentTool = {
  name: "echo",
  description: "Echo the input message",
  jsonSchema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] },
  execute: (params: any, context) => Effect.succeed(`Echo: ${params.message} (step ${context.step}, round ${context.round})`),
};

const program = Effect.gen(function* () {
  const events = yield* streamAgent({
    config,
    messages: [{ role: "user", content: "Call echo with message 'hello world'" }],
    tools: [echoTool],
    maxSteps: 5,
  }).pipe(Stream.runCollect);

  // Events include: text-delta, tool-call, tool-result, text-delta, finish, etc.
  const eventTypes = [...events].map((e) => e.type);
  console.log(eventTypes);
  // ["step-start", "text-delta", "text-delta", "tool-call", "tool-result", "step-finish", "finish"]
});

Effect.runPromise(program);
```

### Custom Stop Condition

```typescript
import { runAgent, AgentTool, stepCountIs } from "@opencode-harness/llm";
import * as Effect from "effect/Effect";

const tool: AgentTool = {
  name: "counter",
  description: "Count calls",
  jsonSchema: { type: "object", properties: {}, required: [] },
  execute: () => Effect.succeed("counted"),
};

// Use the built-in stepCountIs helper
const result1 = await Effect.runPromise(
  runAgent({
    config,
    messages: [{ role: "user", content: "Keep calling counter" }],
    tools: [tool],
    stopWhen: stepCountIs(5), // Stop after 5 rounds
  }),
);

// Or define your own stop condition
const result2 = await Effect.runPromise(
  runAgent({
    config,
    messages: [{ role: "user", content: "Keep calling counter" }],
    tools: [tool],
    stopWhen: (state) => state.toolCallCount >= 3, // Stop after 3 tool calls
  }),
);
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

### AgentLoop Service

```typescript
class AgentLoop extends Context.Service<AgentLoop, AgentLoopShape>()("opencode-harness/AgentLoop") {}

interface AgentLoopShape {
  readonly run: (input: AgentLoopInput) => Effect.Effect<AgentLoopResult, Error>;
  readonly stream: (input: AgentLoopInput) => Stream.Stream<LLMEvent, Error>;
}
```

### Convenience Functions

```typescript
// Synchronous
runAgent(input: AgentLoopInput): Effect.Effect<AgentLoopResult, Error>

// Reactive
streamAgent(input: AgentLoopInput): Stream.Stream<LLMEvent, Error>

// Stop condition helper
stepCountIs(maxSteps: number): StopWhen
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

### AgentTool Context

Tools receive `AgentToolContext` which extends `ToolExecuteContext`:

```typescript
interface AgentToolContext extends ToolExecuteContext {
  readonly step: number; // Current step in the round
  readonly round: number; // Current round number (1-indexed)
}
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
6. **Agent Loop** — `AgentLoop` service with `run()` and `stream()` methods

### Two Paths

| Path | Returns | Use Case |
|---|---|---|
| `runAgent()` | `AgentLoopResult` | "Call it, get a result" — simple synchronous usage |
| `streamAgent()` | `Stream<LLMEvent>` | Real-time streaming — UI updates, progress indicators |

## Projects Using This

- [anonize-ts](https://github.com/belarusian/anonize-ts) — PII anonymization CLI
- [resume-scanner-ts](https://github.com/belarusian/resume-scanner-ts) — Resume parsing

## License

MIT
