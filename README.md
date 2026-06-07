# opencode-harness-extract

> A minimal, local-first LLM harness extracted from opencode's infrastructure

## Overview

This package provides a streamlined LLM client for building local inference applications:

- **LLMClient**: Effect-based client for OpenAI-compatible APIs
- **Local-first**: Works with llama.cpp, ollama, vllm, or any OpenAI-compatible endpoint
- **Tool execution**: Run tools with proper error handling and result parsing
- **Streaming**: Support for SSE streaming responses
- **Caching**: Request/response caching for efficiency

## Why This Exists

Opencode's `packages/llm` is powerful but tightly coupled to the monorepo. This extract makes it usable as a standalone package while staying focused on:

1. **Local inference** - llama.cpp, ollama, vllm, etc.
2. **OpenAI-compatible API** - No need for provider-specific clients
3. **Real features** - Tool execution, streaming, caching

## Extraction Summary

| Component | From opencode | In This Package | Status |
|-----------|---------------|-----------------|--------|
| LLMClient | `packages/llm/src/llm/client.ts` | ✅ `src/client.ts` | ✅ Done |
| Tool Executor | `packages/llm/src/tool-execution/` | ✅ `src/tool.ts` | ✅ Done |
| Streaming | `packages/llm/src/streaming/` | ✅ `src/streaming.ts` | ✅ Done |
| Caching | `packages/llm/src/cache/` | ✅ `src/cache.ts` | ✅ Done |
| Provider Clients | `packages/llm/src/providers/` | ❌ Not needed | N/A |
| Protocol Implementations | `packages/llm/src/protocols/` | ❌ Not needed | N/A |

## Installation

```bash
pnpm add @opencode-harness/llm effect
```

## Quick Start

```typescript
import { LLMClient, LLMClientLayer } from "@opencode-harness/llm";
import * as Effect from "effect/Effect";

const config = {
  baseUrl: "http://localhost:8080/v1",
  model: "llama-cpp/qwen3-coder-next-q8",
  maxTokens: 1000,
  temperature: 0.1,
};

const program = Effect.gen(function* () {
  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);

  // Generate text
  const result = yield* client.generate(config, [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Hello!" },
  ]);
  console.log(result);

  // Generate JSON object
  const obj = yield* client.generateObject(
    config,
    [{ role: "user", content: 'Return { "name": "Alice", "age": 30 }' }],
    { type: "object" }
  );
  console.log(obj);
});

Effect.runPromise(program);
```

## API

### LLMClient

The core service for LLM interactions.

```typescript
class LLMClient extends Context.Service<LLMClient, LLMClientShape>()("opencode-harness/LLMClient") {}

interface LLMClientShape {
  readonly generate: (
    config: LLMConfig,
    messages: Array<{ role: string; content: string }>,
  ) => Effect.Effect<string, Error>;

  readonly generateObject: <T>(
    config: LLMConfig,
    messages: Array<{ role: string; content: string }>,
    schema: unknown,
  ) => Effect.Effect<T, Error>;

  readonly generateStream: (
    config: LLMConfig,
    messages: Array<{ role: string; content: string }>,
  ) => AsyncGenerator<string, void, unknown>;

  readonly executeTool: <T>(
    tool: Tool<T>,
    input: T,
  ) => Effect.Effect<unknown, Error>;
}
```

### Tool Execution

Define and execute tools:

```typescript
import { tool, Tool } from "@opencode-harness/llm";
import * as Effect from "effect/Effect";

// Define a tool
const getCurrentWeather = tool<{
  location: string;
  unit: "celsius" | "fahrenheit";
}>(
  "get_current_weather",
  "Get the current weather for a location",
  ({ location, unit }) => {
    // Tool execution logic
    return Effect.succeed({ temperature: 22, unit });
  }
);

// Execute with client
const program = Effect.gen(function* () {
  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
  const result = yield* client.executeTool(getCurrentWeather, {
    location: "San Francisco",
    unit: "celsius",
  });
  console.log(result); // { temperature: 22, unit: "celsius" }
});
```

### Streaming

Stream responses as they arrive:

```typescript
const program = Effect.gen(function* () {
  const client = yield* Effect.provide(LLMClientLayer)(LLMClient);
  
  for await (const chunk of client.generateStream(config, [
    { role: "user", content: "Write a haiku about coding" },
  ])) {
    process.stdout.write(chunk);
  }
});
```

### Caching

Cache responses to avoid repeated API calls:

```typescript
import { Cache, CacheLayer } from "@opencode-harness/llm";

const program = Effect.gen(function* () {
  // Provide both cache and LLM client
  const client = yield* Effect.provide(CacheLayer)(LLMClient);
  
  // First call - cache miss, calls LLM
  const result1 = yield* client.generate(config, [{ role: "user", content: "Hello" }]);
  
  // Second call - cache hit, returns cached response
  const result2 = yield* client.generate(config, [{ role: "user", content: "Hello" }]);
});
```

## Architecture

### Service Pattern

```typescript
export class LLMClient extends Context.Service<LLMClient, LLMClientShape>()("opencode-harness/LLMClient") {}
```

### Layer Pattern

```typescript
// Provide the LLM client
export const LLMClientLayer = Layer.succeed(LLMClient, {
  generate: (config, messages) => Effect.gen(function* () { /* ... */ }),
  generateObject: (config, messages, schema) => Effect.gen(function* () { /* ... */ }),
  generateStream: (config, messages) => { /* ... */ },
  executeTool: (tool, input) => { /* ... */ },
});

// Provide caching
export const CacheLayer = Layer.succeed(Cache, {
  get: (key) => Effect.succeed(cachedData),
  set: (key, value) => Effect.void,
});
```

## Projects Using This

- [anonize-ts](https://github.com/belarusian/anonize-ts) - PII anonymization tool

## Status

| Feature | Status |
|---------|--------|
| LLMClient (generate/generateObject) | ✅ Done |
| Tool execution runtime | ✅ Done (ToolExecutor with logging) |
| Tool schema validation | ✅ Done |
| Tool execution retry | ✅ Done |
| SSE streaming support | ✅ Done (generateStream function) |
| Caching layer | ✅ Done (Cache service) |
| OpenAI-compatible provider | ✅ Done |

## License

MIT

## License

MIT
