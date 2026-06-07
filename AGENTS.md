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

### Priority 1: Integrate Streaming into LLMClient
The `generateStream` function exists in `streaming.ts` but isn't integrated into `LLMClient`:
1. Update `LLMClientShape.generateStream` to return `Stream.Stream<string, Error>` (from `effect/Stream`)
2. Import and use the `generateStream` function from `./streaming.js`
3. Convert async generator to Effect using `Stream.fromAsyncGenerator`
4. Handle errors during streaming

### Priority 2: Integrate Caching into LLMClient
The `Cache` service exists but LLMClient methods don't use it:
1. Import `Cache` service in `client.ts`
2. Add cache key generation (based on config.baseUrl + config.model + JSON.stringify(messages))
3. For `generate()` and `generateObject()`:
   - Check cache first (cache hit → return cached response)
   - On cache miss → call LLM, store result in cache
4. Handle cache errors gracefully (fallback to direct LLM call)

### Priority 3: Tool Execution Enhancements
The basic tool execution works, but could be improved:
1. **Tool result caching** - Cache tool execution results to avoid re-computation
2. **Tool schema validation** - Validate tool input against schema before execution
3. **Tool execution retry** - Retry failed tool calls with exponential backoff
4. **Parallel tool execution** - Support running multiple tools in parallel
5. **Tool result parsing** - Parse and validate tool output

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
