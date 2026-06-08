# AGENTS.md

This document explains how to work in the `@opencode-harness/llm` codebase — a standalone LLM client extracted from opencode's `packages/llm`.

## What This Package Provides

A minimal LLM client for building agent loops with local-first inference:

1. **LLMEvent** — Unified event contract (`text-delta`, `tool-call`, `step-finish`, etc.)
2. **LLMClient** — `stream()`, `generate()`, `generateObject()` services
3. **Tool system** — `ToolExecutor`, `ToolFailure`, `ToolExecuteContext`
4. **OpenAI Chat protocol** — `buildOpenAIChatBody()` for `chat/completions` JSON
5. **SSE stream parser** — `streamFromURL()` producing `Stream<LLMEvent>`
6. **Schema layer** — `LLMRequest`, `LLMResponse`, `Message`, `ToolDefinition`, `Model`, `Usage`, errors
7. **Caching** — In-memory `Cache` service

## Architecture

```
src/
├── index.ts              - Main exports
├── client.ts             - LLMClient service (stream, generate, generateObject)
├── tool.ts               - ToolExecutor, ToolFailure, makeDynamicTool
├── cache.ts              - Cache service
├── schema/               - Type definitions
│   ├── ids.ts            - ProviderID, ToolCallID, FinishReason, etc.
│   ├── messages.ts       - Message, ToolDefinition, ToolChoice, LLMRequest, Model
│   ├── events.ts         - LLMEvent union (text, tool, reasoning, step events)
│   ├── events-usage.ts   - Usage class with token tracking
│   ├── errors.ts         - LLMError, APIError, AbortError, etc.
│   ├── options.ts        - GenerationOptions, HttpOptions, CachePolicy
│   └── index.ts          - Re-exports all schema types
├── protocols/            - Protocol implementations
│   ├── openai-chat.ts    - buildOpenAIChatBody, buildOpenAIChatURL
│   └── sse-parser.ts     - streamFromURL: SSE → Stream<LLMEvent>
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

**Stream.fromAsyncIterable** (v4 doesn't have `Stream.async`):
```typescript
return Stream.fromAsyncIterable(asyncGen(), (error) => new Error(String(error)))
```

**Layer.provide** (provide layers to services):
```typescript
export const LLMClientLayer = makeLLMClient.pipe(Layer.provide(CacheLayer))
```

## Development Workflow

```bash
pnpm install
pnpm build      # TypeScript compilation
pnpm test       # 18 unit tests
```

### Environment Variables (for integration tests)

- `LLM_BASE_URL` — LLM endpoint (default: `http://10.106.1.89:8080/v1`)
- `LLM_API_KEY` — API key (optional for local models)

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

## Testing

```bash
pnpm test                    # All unit tests (18 passing)
pnpm test test/tool.test.ts  # Tool execution tests
pnpm test test/client.test.ts # Client request building tests
```

## References

- Effect v4 docs: https://effect.website/docs
- OpenAI API: https://platform.openai.com/docs/api-reference/chat
- Source extracted from: `/Users/av4nda/Code/opencode/packages/llm/`
