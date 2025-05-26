import { TestRunner } from "../src";
import { loadConfig } from "../src/config";

describe("Simple LLM Prompt Tests", () => {
  const config = loadConfig();
  const runner = new TestRunner(config);

  // Mock LLM adapter (user-provided)
  runner.registerLLM("mockLLM", {
    call: async (prompt, userMessage) => ({
      content: `Response to ${userMessage}`,
      metadata: { tokens: { input: 10, output: 20 }, latency: 100 },
    }),
  });

  it("should handle simple prompt test", async () => {
    const testCase = {
      name: "Simple Greeting",
      systemPrompt: "You are a friendly assistant.",
      userMessage: "Hello!",
      expectedResponse: "Response to Hello!",
      llm: "mockLLM",
      options: { metrics: ["latency", "tokenUsage"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(100);
    expect(result.metrics.tokenUsage).toEqual({ input: 10, output: 20 });
  });
});
