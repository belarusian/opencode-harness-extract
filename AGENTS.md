# AGENTS.md

This document explains how to work in the opencode-harness-extract codebase - a local-first LLM harness extracted from opencode's infrastructure.

## Project Overview

**opencode-harness-extract** is a standalone LLM client library that provides:

1. **LLMClient** - Effect-based client for OpenAI-compatible APIs
2. **Tool execution** - Run tools with proper error handling
3. **Streaming** - Support for SSE streaming responses
4. **Caching** - Request/response caching

### Key Design Principles

1. **Zero External LLM Dependencies** - We don't use `@opencode-ai/llm` or any workspace-specific packages. Instead, we use direct `fetch` HTTP calls to the LLM API endpoint.

2. **Effect for Control Flow** - We use `Effect.gen` for structured error handling, logging, and composition.

3. **Local-First** - Works with llama.cpp, ollama, vllm, or any OpenAI-compatible endpoint. No provider-specific clients needed.

4. **No Context Service Pattern** - Configuration is passed directly to the LLMClient.

## Architecture

```
src/
├── index.ts       - Main exports
├── client.ts      - LLMClient class with HTTP calls
├── tool.ts        - Tool execution utilities
├── cache.ts       - Caching layer
├── streaming.ts   - Streaming support
└── config.ts      - Configuration types
```

### Effect Patterns Used

#### 1. Effect.gen for Structured Concurrency
```typescript
return Effect.gen(function* () {
  const result = yield* someEffect;
  return result;
});
```

#### 2. Type-Safe Errors
```typescript
generate(text: string): Effect.Effect<string, Error> {
  // Returns Effect<SuccessType, ErrorType, Requirements>
}
```

#### 3. Promise Interop
```typescript
const response = yield* Effect.tryPromise({
  try: async () => {
    const res = await fetch(url, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  catch: (error) => new Error(`Request failed: ${error}`),
});
```

#### 4. Async Generator for Streaming
```typescript
async function* generateStream(config, messages) {
  const response = await fetch(url, { ... });
  const reader = response.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    yield parseChunk(chunk);
  }
}
```

#### 5. Layer Pattern for Services
```typescript
export const LLMClientLayer = Layer.succeed(LLMClient, {
  generate: (config, messages) => Effect.gen(function* () { /* ... */ }),
  generateObject: (config, messages, schema) => Effect.gen(function* () { /* ... */ }),
});
```

## Development Workflow

### Setup
```bash
pnpm install
pnpm build
pnpm start
```

### Environment Variables
- `LLM_BASE_URL` - LLM API endpoint (default: `http://localhost:8080/v1`)
- `LLM_MODEL` - Model name (default: `llama-cpp/qwen3-coder-next-q8`)
- `LLM_API_KEY` - API key for authentication (optional)
- `LLM_MAX_TOKENS` - Maximum tokens (default: `1000`)
- `LLM_TEMPERATURE` - Temperature (default: `0.1`)

### Running
```bash
# Basic usage
pnpm start

# With custom endpoint
LLM_BASE_URL=http://localhost:11434/v1 pnpm start
```

## Implementation Guide

### To add a new HTTP endpoint:
1. Add method to `LLMClientShape` interface in `client.ts`
2. Implement the method in `makeLLMClient`
3. Add error handling in `Effect.tryPromise`
4. Update type signatures as needed

### To add tool execution:
1. Define tool schema in `tool.ts`
2. Implement `executeTool` in `LLMClient`
3. Add result parsing and error handling

### To add streaming:
1. Implement `generateStream` using async generator
2. Parse SSE response chunks
3. Handle stream errors gracefully

### To add caching:
1. Create cache service in `cache.ts`
2. Implement `get`/`set` methods
3. Integrate with LLMClient methods

## Debugging

```bash
# Check types
pnpm run typecheck

# Build
pnpm run build

# Test with local LLM
export LLM_BASE_URL="http://localhost:8080/v1"
export LLM_API_KEY=""
pnpm start
```

## References

- Effect documentation: https://effect.website/docs
- OpenAI API: https://platform.openai.com/docs/api-reference/chat
- llama.cpp: https://github.com/ggerganov/llama.cpp
- ollama: https://ollama.com/
