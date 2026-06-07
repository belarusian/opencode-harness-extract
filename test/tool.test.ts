import { describe, it, expect } from "vitest";
import { tool, validateToolInput, ToolExecutor, ToolExecutorLayer } from "./src/tool.js";
import * as Effect from "effect/Effect";

describe("Tool Execution", () => {
  describe("validateToolInput", () => {
    it("should accept input without schema", async () => {
      const program = Effect.gen(function* () {
        return yield* validateToolInput({ foo: "bar" }, undefined);
      });

      const result = await Effect.runPromise(program);
      expect(result).toEqual({ foo: "bar" });
    });

    it("should validate string type", async () => {
      const program = Effect.gen(function* () {
        return yield* validateToolInput("hello", { type: "string" });
      });

      const result = await Effect.runPromise(program);
      expect(result).toBe("hello");
    });

    it("should reject wrong type", async () => {
      const program = Effect.gen(function* () {
        return yield* validateToolInput(123, { type: "string" });
      });

      await expect(Effect.runPromise(program)).rejects.toThrow("Tool input validation failed");
    });
  });

  describe("executeWithRetry", () => {
    it("should retry and succeed on second attempt", async () => {
      let attemptCount = 0;
      const program = Effect.gen(function* () {
        const executor = yield* Effect.provide(ToolExecutorLayer)(ToolExecutor);
        
        const failingTool = tool(
          "flaky",
          "Fails first then succeeds",
          ({ count }: { count: number }) => {
            attemptCount++;
            if (attemptCount < 3) {
              return Effect.fail(new Error("Simulated failure"));
            }
            return Effect.succeed({ success: true, attempts: attemptCount });
          }
        );
        
        return yield* executor.executeWithRetry(failingTool, { count: 1 }, 5, 0);
      });

      const result = await Effect.runPromise(program);
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });

    it("should fail after max retries", async () => {
      const program = Effect.gen(function* () {
        const executor = yield* Effect.provide(ToolExecutorLayer)(ToolExecutor);
        
        const alwaysFailingTool = tool(
          "always-fail",
          "Always fails",
          () => Effect.fail(new Error("Always fails"))
        );
        
        return yield* executor.executeWithRetry(alwaysFailingTool, {}, 3, 0);
      });

      await expect(Effect.runPromise(program)).rejects.toThrow("Always fails");
    });
  });
});
