import { TestRunner } from "../src";
import { loadConfig } from "../src/config";

describe("Complex LLM Prompt Tests", () => {
  const config = loadConfig();
  const runner = new TestRunner(config);

  runner.registerLLM("mockLLM", {
    call: async (prompt, userMessage, chatHistory) => ({
      content: `Response based on history: ${chatHistory?.length || 0}`,
      metadata: { tokens: { input: 15, output: 25 }, latency: 150 },
    }),
  });

  it("should handle chat history", async () => {
    const testCase = {
      name: "Chat History Test",
      systemPrompt: { content: "You are a contextual assistant.", metadata: { version: "1.0" } },
      userMessage: "Continue the conversation.",
      chatHistory: [
        { role: "user", content: "Hi" },
        { role: "assistant", content: "Hello!" },
      ],
      expectedResponse: "Response based on history: 2",
      llm: "mockLLM",
      options: { metrics: ["consistency", "latency"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(150);
  });
});
