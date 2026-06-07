# AGENTS.md

This document explains how to work in the opencode-harness-extract codebase - a local-first LLM harness extracted from opencode's infrastructure.

## Extraction History

### How This Was Built

**Step 1: Understand the Dependencies**
```bash
cd /Users/av4nda/Code/opencode/packages/llm
cat package.json
cat ../../package.json | grep -A 50 '"catalog"'
```

**Step 2: Create the Package**
- Initialized with `pnpm init`
- Added dependencies: `effect@4.0.0-beta.70`, `@smithy/*`, `aws4fetch`
- Created minimal `src/client.ts` with LLMClient using Effect v4

**Step 3: Fix Breaking Changes**
Effect v4 has breaking changes from v3:
- `Context.Tag("Id")` → `Context.Service<Self, Shape>()("Id")`
- `Layer.provide(layers)(effect)` → `Layer.succeed(service, resource)`
- `Effect.provide(layer)(effect)` → `Effect.provide(layer)(effect)`

**Step 4: Extract Features One by One**
- First: Basic LLMClient (generate/generateObject)
- Second: Tool execution with ToolExecutor
- Third: Caching with Cache service
- Fourth: Streaming support

**Step 5: Test with Real LLM**
- Used UnSloth endpoint at `http://10.106.1.89:8080/v1`
- Verified JSON mode, free text, tool execution all work

### Why Extract?
Opencode's `packages/llm` is powerful but tightly coupled to the monorepo:
- Uses `catalog:` protocol for dependencies (pnpm workspace only)
- Has `workspace:*` references to internal packages
- Complex Layer-based architecture

This extract makes opencode's LLM infrastructure available as a standalone package while:
1. Using only standard npm packages (no catalog protocol)
2. Removing all opencode monorepo dependencies
3. Fixing Effect v4 breaking changes (Context.Tag → Context.Service)
4. Keeping only features we actually need

### What Was Extracted (v1 - Current)
- ✅ LLMClient with HTTP calls to OpenAI-compatible APIs
- ✅ Tool execution runtime with logging
- ✅ SSE streaming support
- ✅ In-memory caching layer
- ✅ Clean Effect v4 patterns

### What Was Left Behind (For Now)
- Provider-specific clients (OpenAI, Anthropic, Google, etc.) - Not needed, we use OpenAI-compatible API
- Protocol implementations (Anthropic Messages, Bedrock Converse, Gemini) - Not needed

### Files from opencode to Compare
- `/Users/av4nda/Code/opencode/packages/llm/src/` - Original source
- `/Users/av4nda/Code/opencode/packages/llm/package.json` - Original dependencies

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

## What to Implement Next

### Priority 1: Fix Streaming Implementation
The current `generateStream` in `client.ts` returns `Effect.void` as a placeholder. To complete streaming:
1. Update `LLMClientShape.generateStream` to return `Stream.Stream<string, Error>` (from `effect/Stream`)
2. Implement proper SSE streaming in `generateStream` function
3. Parse chunked responses and yield content
4. Handle errors during streaming

### Priority 2: Caching Integration
The cache service exists but isn't integrated with LLMClient yet:
1. Integrate `Cache` into `LLMClient` methods
2. Add cache key generation (based on config + messages)
3. Handle cache misses (call LLM, store result)
4. Handle cache hits (return cached response)

### Priority 3: Tool Execution Enhancements
The basic tool execution is working, but could be improved:
1. Add tool result caching (cache tool execution results)
2. Implement tool schema validation
3. Add tool execution retry logic
4. Support parallel tool execution

### Lower Priority
- Provider abstraction (optional - OpenAI-compatible is enough)
- Protocol implementations (Anthropic, Bedrock, etc.)
- Advanced caching policies (TTL, eviction)

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
