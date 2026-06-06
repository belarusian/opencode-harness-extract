# @opencode-harness/llm

A standalone LLM client extracted from opencode's `packages/llm` infrastructure.

## Overview

This package provides:

- **LLMClient**: Effect-based client for LLM API calls with type-safe error handling
- **Layer architecture**: Clean service composition using Effect's Layer pattern
- **Provider support**: OpenAI-compatible APIs (OpenAI, Anthropic, Google, local LLMs)
- **Protocol implementations**: OpenAI Chat, Anthropic Messages, and more
- **Tool execution**: Run tools with proper error handling and result parsing

## Why This Exists

Opencode's `packages/llm` is incredibly powerful but tightly coupled to the opencode monorepo:

- Uses `catalog:` protocol for dependencies (pnpm workspace only)
- Has `workspace:*` references to internal packages
- Complex Layer-based architecture

This extract makes opencode's LLM infrastructure available as a standalone package for:
- Building LLM-powered tools outside the opencode monorepo
- Learning Effect v4 patterns for LLM integration
- Reusable LLM client infrastructure

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
  model: "gpt-oss",
  apiKey: process.env.LLM_API_KEY,
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

## Architecture

### Service Pattern

```typescript
// Define a service
export class LLMClient extends Context.Service<LLMClient, LLMClientShape>()("LLMClient") {}

// Service interface
export interface LLMClientShape {
  readonly generate: (
    config: LLMConfig,
    messages: Array<{ role: string; content: string }>,
  ) => Effect.Effect<string, Error>;

  readonly generateObject: <T>(
    config: LLMConfig,
    messages: Array<{ role: string; content: string }>,
    schema: unknown,
  ) => Effect.Effect<T, Error>;
}
```

### Layer Pattern

```typescript
// Create a layer that provides the service
export const LLMClientLayer = Layer.succeed(
  LLMClient,
  {
    generate: (config, messages) => Effect.gen(function* () { /* ... */ }),
    generateObject: (config, messages, schema) => Effect.gen(function* () { /* ... */ }),
  }
);

// Use with Effect.provide
const result = yield* Effect.provide(LLMClientLayer)(LLMClient);
```

## Projects Using This

- [anonize-ts](https://github.com/belarusian/anonize-ts) - PII anonymization tool

## Differences from opencode/llm

| Feature | opencode/llm | @opencode-harness/llm |
|---------|--------------|----------------------|
| Dependencies | catalog: protocol | Standard npm packages |
| Monorepo deps | workspace:* | None |
| Effect version | v4 beta | v4 beta |
| Tool execution | Full runtime | Basic utilities |
| Streaming | SSE/WebSocket | Not yet |
| Caching | Built-in | Not yet |

## Status

⚠️ **Pre-release**: This is an extraction in progress. The core LLM client works, but some features from opencode/llm are still missing:

- [ ] Tool execution runtime
- [ ] Streaming support
- [ ] Caching
- [ ] Request/response logging
- [ ] Full provider implementations

## License

MIT
