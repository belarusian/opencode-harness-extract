# opencode-harness-extract

## Problem Scope

### The Challenge

Opencode has a sophisticated LLM client infrastructure in `packages/llm` that provides:
- Multiple LLM provider integrations (OpenAI, Anthropic, Google, etc.)
- Protocol implementations for different LLM APIs
- Request/response framing and encoding
- Caching policies
- Tool execution runtime
- Error handling and retry logic
- Streaming support
- Rich type safety with Effect

However, this codebase is tightly integrated with opencode's monorepo structure:
- Uses `catalog:` protocol for dependencies (pnpm workspace catalog)
- Has `workspace:*` references to internal packages like `@opencode-ai/http-recorder`
- Uses Effect v4.0.0-beta.66 with unstable APIs
- Has complex Layer-based architecture that's hard to extract

### Why Extract?

The LLM client infrastructure is **incredibly valuable** and could be:
1. A standalone package for the community
2. A reusable harness for building LLM-powered tools
3. A reference implementation for Effect + LLM integration

## Goals

1. **Create a standalone package** that extracts opencode/llm's core functionality
2. **Make it work outside the monorepo** by:
   - Resolving `catalog:` dependencies to actual npm packages
   - Replacing `workspace:*` references with published packages or local copies
   - Fixing any breaking API changes between Effect versions
3. **Document the extraction process** so others can understand:
   - How opencode/llm works
   - How to use Effect v4 with LLMs
   - How to structure LLM client code
4. **Create a test harness** to verify the extracted code works with real LLMs

## Approach

### Step 1: Understand the Dependencies

```bash
# Check what opencode/llm actually needs
cd /Users/av4nda/Code/opencode/packages/llm
cat package.json

# Check the catalog
cd /Users/av4nda/Code/opencode
cat package.json | grep -A 50 '"catalog"'
```

### Step 2: Create the Extracted Package

```
opencode-harness-extract/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # Main exports
│   ├── client.ts         # LLMClient wrapper
│   ├── providers/        # Provider implementations
│   │   ├── openai-compatible.ts
│   │   └── ...
│   ├── protocols/        # Protocol implementations
│   │   ├── openai-chat.ts
│   │   └── ...
│   ├── schema.ts         # Type definitions
│   └── utils.ts          # Helper functions
└── README.md
```

### Step 3: Resolve Dependencies

| Dependency | Source | Version |
|------------|--------|---------|
| effect | effect-smol | 4.0.0-beta.70 |
| @smithy/eventstream-codec | npm | 4.2.14 |
| @smithy/util-utf8 | npm | 4.2.2 |
| aws4fetch | npm | 1.0.20 |

### Step 4: Fix Breaking Changes

Effect v4 has breaking changes from v3:
- `Context.Tag()` → `Context.Service()`
- Layer construction changed
- Effect.provide signature changed

### Step 5: Test with Real LLMs

Use the UnSloth endpoint to verify:
- JSON mode works
- Free text mode works
- Error handling works
- Auth works

## Success Criteria

- [ ] Package builds without errors
- [ ] Tests pass with real LLM calls
- [ ] Documentation explains how to use it
- [ ] No references to opencode monorepo internals

## Notes

- This is about **learning** and **documentation**, not production use
- We want to understand opencode's patterns to apply them elsewhere
- The extracted code should be simpler than the full opencode/llm
