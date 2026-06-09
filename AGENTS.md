# AGENTS.md

This document explains how to work in the `@opencode-harness/llm` codebase — a standalone LLM client extracted from opencode's `packages/llm`.

## What This Package Provides

A minimal LLM client for building agent loops with local-first inference:

1. **LLMEvent** — Unified event contract (`text-delta`, `tool-call`, `step-finish`, etc.)
2. **LLMClient** — `stream()`, `generate()`, `generateObject()` services
3. **Tool system** — `ToolExecutor`, `ToolFailure`, `ToolExecuteContext`
4. **OpenAI Chat protocol** — `buildOpenAIChatBody()` (streaming) and `buildOpenAIChatStreamBody()` (non-streaming) for `chat/completions` JSON
5. **SSE stream parser** — `streamFromURL()` producing `Stream<LLMEvent>`
6. **Schema layer** — `LLMRequest`, `LLMResponse`, `Message`, `ToolDefinition`, `Model`, `Usage`, errors
7. **Caching** — In-memory `Cache` service
8. **Agent Loop** — `runAgent()` (synchronous) and `streamAgent()` (reactive) for multi-step tool execution

## Architecture

```
src/
├── index.ts              - Main exports
├── client.ts             - LLMClient service (stream, generate, generateObject)
├── tool.ts               - ToolExecutor, ToolFailure, makeDynamicTool
├── cache.ts              - Cache service
├── agent.ts              - AgentLoop service (runAgent, streamAgent)
├── schema/               - Type definitions
│   ├── ids.ts            - ProviderID, ToolCallID, FinishReason, etc.
│   ├── messages.ts       - Message, ToolDefinition, ToolChoice, LLMRequest, Model
│   ├── events.ts         - LLMEvent union (text, tool, reasoning, step events)
│   ├── events-usage.ts   - Usage class with token tracking
│   ├── errors.ts         - LLMError, APIError, AbortError, etc.
│   ├── options.ts        - GenerationOptions, HttpOptions, CachePolicy
│   └── index.ts          - Re-exports all schema types
├── protocols/            - Protocol implementations
│   ├── openai-chat.ts    - buildOpenAIChatBody, buildOpenAIChatStreamBody, buildOpenAIChatURL, buildOpenAIChatHeaders
│   └── sse-parser.ts     - streamFromURL, streamFromBody: SSE → Stream<LLMEvent>
└── utils/
    └── record.ts         - isRecord helper
```

### Effect v4 Patterns Used

**Service pattern** (v4 uses `Context.Service`, not `Context.Tag`):
```typescript
export class LLMClient extends Context.Service<LLMClient, LLMClientShape>()("opencode-harness/LLMClient") {}
```

**Class declarations** (v4 requires `class X extends Schema.Class<X>("Id")({...}) {}`):
```typescript
export class LLMRequest extends Schema.Class<LLMRequest>("LLM.Request")({
  model: Model,
  messages: Schema.Array(Message),
  // ...
}) {}
```

**Tagged errors** (v4 uses `TaggedErrorClass<Self>()("Tag", fields)` with parentheses):
```typescript
export class APIError extends TaggedErrorClass<APIError>()("APIError", {
  message: string,
  isRetryable: boolean,
  metadata: Record<string, unknown>,
}) {}
```

**Stream.fromAsyncIterable** (v4 doesn't have `Stream.async`):
```typescript
return Stream.fromAsyncIterable(asyncGen(), (error) => new Error(String(error)))
```

**Layer.provide** (provide layers to services):
```typescript
export const LLMClientLayer = makeLLMClient.pipe(Layer.provide(CacheLayer))
```

**Effect.catch** (v4 uses `catch`, not `catchAll`):
```typescript
effect.pipe(Effect.catch((error) => handle(error)))
```

**Collect iteration** (v4 `Collect` uses spread, not `.toArray()`):
```typescript
const items = [...collection] // not collection.toArray()
```

## Development Workflow

```bash
pnpm install
pnpm build      # TypeScript compilation
pnpm test       # 25 unit tests, 5 integration tests (skipped without LLM_BASE_URL)
```

### Environment Variables (for integration tests)

- `LLM_BASE_URL` — LLM endpoint (default: `http://10.106.1.89:8080/v1`)
- `LLM_API_KEY` — API key (optional for local models)

### Integration Tests

Integration tests are **skipped by default**. Enable with:

```bash
LLM_BASE_URL="http://localhost:8080/v1" LLM_API_KEY="your-key" npx vitest run test/integration.test.ts
```

## Current State

### Streaming (`stream()`)
- Produces `Stream<LLMEvent>` from any OpenAI-compatible SSE endpoint
- Handles: text deltas, tool calls, reasoning content, usage, errors
- SSE parser: `streamFromURL(url, headers, body)` and `streamFromBody(url, headers, body)`
- Uses `async function*` nested generators to yield events properly

### Non-Streaming (`generate()`)
- Direct HTTP POST to `chat/completions` without `stream: true`
- Parses JSON response into `LLMResponse` with proper `Usage` construction
- Handles: text content, tool calls, reasoning content

### JSON Output (`generateObject()`)
- Uses `response_format: { type: "json_object" }`
- Parses JSON from response text, strips markdown code fences

### Agent Loop
- **Synchronous (`runAgent`)** — Collects events per round, executes tools, returns `AgentLoopResult`
- **Reactive (`streamAgent`)** — Returns `Stream<LLMEvent>` with all events interleaved across rounds
- Both paths share the same loop logic
- `AgentToolContext` provides `step` and `round` to tool handlers
- `stepCountIs()` helper for stop conditions

### Known Issues / Future Work
- `generateObject()` error handling for empty responses
- SSE parser: `content_filter` finish_reason with empty delta
- No protocol abstraction layer yet (only OpenAI Chat)

## Adding Features

### To add a new LLMEvent type:
1. Add schema in `src/schema/events.ts`
2. Add to the `llmEventTagged` union
3. Update SSE parser in `src/protocols/sse-parser.ts` to emit the event

### To add a new protocol:
1. Create `src/protocols/<name>.ts` with body builder and stream parser
2. Export from `src/protocols/index.ts`
3. Add to `LLMClient` if needed

### To add a new tool:
1. Use `makeDynamicTool(name, description, jsonSchema, execute)` in consuming code
2. Execute via `ToolExecutor.execute(tool, input, context)`

### To add a new agent loop feature:
1. Add types to `src/agent.ts`
2. Implement in `makeAgentLoop` (both `run` and `stream` methods)
3. Export from `src/index.ts`
4. Add integration tests in `test/integration.test.ts`

## Testing

```bash
pnpm test                    # All unit tests (25 passing)
pnpm test test/tool.test.ts  # Tool execution tests
pnpm test test/client.test.ts # Client request building tests
pnpm test test/cache.test.ts # Cache tests
```

## Critical Context

### Effect v4 API
- `class X extends Schema.Class<X>("Id")({...}) {}` for classes
- `Schema.TaggedErrorClass<X>()("Tag", fields)` for errors (note parentheses)
- `Stream.fromAsyncIterable(asyncGen(), onError)` — requires error handler as 2nd arg
- `Effect.catch` (not `catchAll`) for error handling
- `Layer.provide(CacheLayer)` not `Layer.provide(Cache)`
- `InstanceType<typeof X>` for Schema.Class types
- `Collect` uses spread `[...collection]`, not `.toArray()`

### Schema layer
- `LLMRequest` stores `baseUrl` and `apiKey` in `model.native` so `makeLLMClient` can construct the correct URL
- `Usage` requires: `inputTokens`, `outputTokens`, `totalTokens`, `reasoningTokens`, `cacheReadInputTokens`
- `LLMResponse` requires: `content`, `finish`, `usage`

### SSE Parser
- OpenAI API returns `choices` (plural), NOT `choice`
- `parseChunk` processes `delta.content`, `delta.reasoning_content`, `delta.tool_calls`
- `flushState` emits `text-end`, `reasoning-end`, `tool-input-end`, `tool-call`, `step-finish`, `finish`
- Events must be yielded from the async generator, not iterated silently

### Client
- `buildOpenAIChatBody()` → streaming request (sets `stream: true`)
- `buildOpenAIChatStreamBody()` → non-streaming request (no `stream` field)
- `buildOpenAIChatURL(baseUrl)` → appends `/chat/completions`
- `stream()` uses `streamFromBody(url, headers, body)`
- `generate()` uses direct `fetch` + JSON parsing
- `generateObject()` uses direct `fetch` + JSON parsing + markdown stripping

### Agent Loop
- `runAgent()` — synchronous path: collects events per round, returns `AgentLoopResult`
- `streamAgent()` — reactive path: returns `Stream<LLMEvent>` with all events interleaved
- Both share the same loop logic; difference is whether events are collected or forwarded
- `AgentToolContext.step`/`round` injected via `toTool()` wrapper

## References

- Effect v4 docs: https://effect.website/docs
- OpenAI API: https://platform.ai/docs/api-reference/chat
- @opencode-harness/llm: https://github.com/belarusian/opencode-harness-extract
- Source extracted from: `/Users/av4nda/Code/opencode/packages/llm/`
- Original opencode repository: https://github.com/anomalyco/opencode
