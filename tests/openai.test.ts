import { TestRunner, loadConfig, LLMResponse, Prompt } from "../src";
import { describe, it, expect, beforeAll } from "@jest/globals";
import { performance } from "node:perf_hooks";
import OpenAI from "openai";

describe("OpenAI Tests", () => {
  const config = loadConfig();
  const runner = new TestRunner(config);

  // Mock OpenAI adapter (replace with actual OpenAI API call)
  beforeAll(() => {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    runner.registerLLM("openai", {
      call: async (prompt: Prompt | string, userMessage: string | object, chatHistory?: any) => {
        const t1 = performance.now();
        const response = await client.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: typeof prompt === "string" ? prompt : prompt.content },
            ...(chatHistory || []),
            { role: "user", content: typeof userMessage === "string" ? userMessage : JSON.stringify(userMessage) },
          ],
        });
        const t2 = performance.now();
        return {
          content: response.choices[0].message.content,
          metadata: { tokens: response.usage?.total_tokens, latency: t2 - t1 },
        };
      },
    });
  });

  it("should handle simple OpenAI prompt", async () => {
    const testCase = {
      name: "Simple OpenAI Test",
      systemPrompt: "You are a helpful assistant powered by OpenAI.",
      userMessage: "What is the weather like today?",
      expectedResponse: "OpenAI response to What is the weather like today?",
      llm: "openai",
      options: { metrics: ["latency", "tokenUsage"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(150);
    expect(result.metrics.tokenUsage).toEqual({ input: 20, output: 30 });
  });

  it("should handle OpenAI with chat history", async () => {
    const testCase = {
      name: "OpenAI Chat History Test",
      systemPrompt: {
        content: "You are a history expert.",
        metadata: { version: "1.0", llm: "openai" },
      },
      userMessage: "Tell me about the Renaissance.",
      chatHistory: [
        { role: "user", content: "What was the Middle Ages?" },
        { role: "assistant", content: "The Middle Ages was a period from the 5th to the 15th century." },
      ],
      expectedResponse: "OpenAI response to Tell me about the Renaissance.",
      llm: "openai",
      options: {
        metrics: ["latency", "tokenUsage", "consistency"],
        customValidator: (response: LLMResponse) => {
          return response.metadata?.model === "gpt-4";
        },
      },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(150);
  });

  it("should handle OpenAI with custom validation", async () => {
    const testCase = {
      name: "OpenAI Custom Validation Test",
      systemPrompt: "Respond with a positive tone.",
      userMessage: "How are you?",
      expectedResponse: (response: LLMResponse) => response.content.includes("OpenAI response"),
      llm: "openai",
      options: { metrics: ["latency"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
  });
});
