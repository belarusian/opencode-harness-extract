import { describe, it, expect } from "vitest";
import { Cache, CacheLayer } from "./src/cache.js";
import * as Effect from "effect/Effect";

describe("Cache", () => {
  describe("basic operations", () => {
    it("should set and get values", async () => {
      const program = Effect.gen(function* () {
        const cache = yield* Cache;
        yield* cache.set("key1", "value1");
        const result = yield* cache.get<string>("key1");
        return result;
      });

      const result = await Effect.runPromise(Effect.provide(CacheLayer)(program));
      expect(result).toBe("value1");
    });

    it("should return undefined for missing key", async () => {
      const program = Effect.gen(function* () {
        const cache = yield* Cache;
        const result = yield* cache.get<string>("nonexistent");
        return result;
      });

      const result = await Effect.runPromise(Effect.provide(CacheLayer)(program));
      expect(result).toBeUndefined();
    });

    it("should clear all values", async () => {
      const program = Effect.gen(function* () {
        const cache = yield* Cache;
        yield* cache.set("key1", "value1");
        yield* cache.set("key2", "value2");
        yield* cache.clear();
        const result1 = yield* cache.get<string>("key1");
        const result2 = yield* cache.get<string>("key2");
        return { result1, result2 };
      });

      const { result1, result2 } = await Effect.runPromise(Effect.provide(CacheLayer)(program));
      expect(result1).toBeUndefined();
      expect(result2).toBeUndefined();
    });
  });
});
