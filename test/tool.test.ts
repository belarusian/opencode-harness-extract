import { describe, it, expect } from "vitest";
import { ToolExecutor, ToolExecutorLayer, makeDynamicTool, formatToolResult } from "../src/tool.js";
import * as Effect from "effect/Effect";

describe("Tool Execution", () => {
  describe("formatToolResult", () => {
    it("should format string result as text", () => {
      const result = formatToolResult("hello");
      expect(result).toEqual({ type: "text", value: "hello" });
    });

    it("should format object with output field as text", () => {
      const result = formatToolResult({ output: "world", extra: "ignored" });
      expect(result).toEqual({ type: "text", value: "world" });
    });

    it("should format plain object as json", () => {
      const result = formatToolResult({ key: "value" });
      expect(result.type).toBe("json");
      expect((result as any).value).toEqual({ key: "value" });
    });

    it("should handle null/undefined", () => {
      expect(formatToolResult(null)).toEqual({ type: "text", value: "" });
      expect(formatToolResult(undefined)).toEqual({ type: "text", value: "" });
    });
  });

  describe("execute", () => {
    it("should execute a simple tool", async () => {
      const program = Effect.gen(function* () {
        const executor = yield* Effect.provide(ToolExecutorLayer)(ToolExecutor);
        
        const echoTool = makeDynamicTool(
          "echo",
          "Echoes the input",
          { type: "object", properties: { message: { type: "string" } } },
          (input: { message: string }) => Effect.succeed({ echoed: input.message })
        );
        
        return yield* executor.execute(echoTool, { message: "Hello" }, { id: "call-1", name: "echo" });
      });

      const result = await Effect.runPromise(program);
      // Object results are formatted as json
      expect(result.type).toBe("json");
      expect((result as any).value).toEqual({ echoed: "Hello" });
    });

    it("should handle tool without execute handler", async () => {
      const program = Effect.gen(function* () {
        const executor = yield* Effect.provide(ToolExecutorLayer)(ToolExecutor);
        
        const noExecTool = makeDynamicTool(
          "no-exec",
          "No execute handler",
          {}
        );
        
        return yield* executor.execute(noExecTool, {}, { id: "call-2", name: "no-exec" });
      });

      const result = await Effect.runPromise(program);
      expect(result.type).toBe("text");
      expect((result as any).value).toContain("has no execute handler");
    });
  });

  describe("executeTools (parallel)", () => {
    it("should execute multiple tools in parallel", async () => {
      const program = Effect.gen(function* () {
        const executor = yield* Effect.provide(ToolExecutorLayer)(ToolExecutor);
        
        const addTool = makeDynamicTool(
          "add",
          "Add two numbers",
          { type: "object", properties: { a: { type: "number" }, b: { type: "number" } } },
          (input: { a: number; b: number }) => Effect.succeed(input.a + input.b)
        );
        
        const multiplyTool = makeDynamicTool(
          "multiply",
          "Multiply two numbers",
          { type: "object", properties: { a: { type: "number" }, b: { type: "number" } } },
          (input: { a: number; b: number }) => Effect.succeed(input.a * input.b)
        );
        
        return yield* executor.executeTools([
          { tool: addTool, input: { a: 1, b: 2 }, context: { id: "c1", name: "add" } },
          { tool: multiplyTool, input: { a: 3, b: 4 }, context: { id: "c2", name: "multiply" } },
        ]);
      });

      const results = await Effect.runPromise(program);
      expect(results.length).toBe(2);
      
      const addResult = results.find((r) => r.name === "add");
      const multiplyResult = results.find((r) => r.name === "multiply");
      
      expect(addResult?.success).toBe(true);
      // Number results are formatted as json
      expect(addResult?.result?.type).toBe("json");
      
      expect(multiplyResult?.success).toBe(true);
     // Number results are formatted as json
     expect(multiplyResult?.result?.type).toBe("json");
    });

    it("should track failures with structured results", async () => {
      const program = Effect.gen(function* () {
        const executor = yield* Effect.provide(ToolExecutorLayer)(ToolExecutor);
        
        const successTool = makeDynamicTool(
          "success",
          "Always succeeds",
          {},
          () => Effect.succeed("ok")
        );
        
        const failTool = makeDynamicTool(
          "failure",
          "Always fails",
          {},
          () => Effect.fail(new Error("Intentional failure"))
        );
        
        return yield* executor.executeTools([
          { tool: successTool, input: {}, context: { id: "c1", name: "success" } },
          { tool: failTool, input: {}, context: { id: "c2", name: "failure" } },
        ]);
      });

      const results = await Effect.runPromise(program);
      expect(results.length).toBe(2);
      
      const successResult = results.find((r) => r.name === "success");
      const failureResult = results.find((r) => r.name === "failure");
      
      expect(successResult?.success).toBe(true);
      expect(failureResult?.success).toBe(false);
      expect(failureResult?.error).toBeDefined();
    });
  });
});
