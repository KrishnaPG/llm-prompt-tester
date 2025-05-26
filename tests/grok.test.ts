import { TestRunner, loadConfig, LLMResponse, Prompt } from "../src";
import { describe, it, expect, beforeAll } from "@jest/globals";
import Groq from "groq-sdk";

describe("Grok LLM Tests", () => {
  const config = loadConfig();
  const runner = new TestRunner(config);

  // Mock Grok adapter (replace with actual API call in production)
  beforeAll(() => {
    const client = new Groq({ apiKey: process.env.GROK_API_KEY });
    runner.registerLLM("grok", {
      call: async (prompt: Prompt | string, userMessage: string | object, chatHistory?: any) => {
        const response = await client.chat.completions.create(
          {
            messages: chatHistory
              ? [...chatHistory, { role: "user", content: userMessage }]
              : [
                  { role: "system", content: typeof prompt === "string" ? prompt : prompt.content },
                  { role: "user", content: userMessage },
                ],
            model: "llama3-8b-8192",
          },
          {
            timeout: 5 * 1000,
            maxRetries: 3,
          }
        );
        return {
          content: response.choices[0].message.content,
          metadata: { tokens: response.usage?.total_tokens, latency: response.usage?.total_time },
        };
      },
    });
  });

  it("should handle simple Grok prompt", async () => {
    const testCase = {
      name: "Simple Grok Test",
      systemPrompt: "You are Grok, a helpful AI assistant created by xAI.",
      userMessage: "What is the capital of France?",
      expectedResponse: "Grok response to What is the capital of France?",
      llm: "grok",
      options: { metrics: ["latency", "tokenUsage"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(100);
    expect(result.metrics.tokenUsage).toEqual({ input: 10, output: 20 });
  });

  it("should handle Grok with chat history", async () => {
    const testCase = {
      name: "Grok Chat History Test",
      systemPrompt: {
        content: "You are Grok, maintain context from previous messages.",
        metadata: { version: "1.0", llm: "grok" },
      },
      userMessage: "Tell me more about Paris.",
      chatHistory: [
        { role: "user", content: "What is the capital of France?" },
        { role: "assistant", content: "The capital of France is Paris." },
      ],
      expectedResponse: "Grok response to Tell me more about Paris.",
      llm: "grok",
      options: {
        metrics: ["latency", "tokenUsage", "consistency"],
        customValidator: (response: LLMResponse) => {
          return response.metadata?.chatHistoryLength === 2;
        },
      },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(100);
    expect(result.metrics.tokenUsage).toEqual({ input: 10, output: 20 });
  });

  it("should handle Grok with file-based prompt", async () => {
    const testCase = {
      name: "Grok File Prompt Test",
      systemPrompt: "./prompts/grok_prompt.json", // Assumes a file exists
      userMessage: "Hello!",
      expectedResponse: /Grok response/,
      llm: "grok",
      options: { metrics: ["latency"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
  });
});
