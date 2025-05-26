import { TestRunner, loadConfig, LLMResponse, Prompt } from "../src";
import { describe, it, expect, beforeAll } from "@jest/globals";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

describe("Vercel AI SDK Tests", () => {
  const config = loadConfig();
  const runner = new TestRunner(config);

  // Mock Vercel AI adapter (replace with actual Vercel AI SDK call)
  beforeAll(() => {
    const google = createGoogleGenerativeAI({
      apiKey:
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        "AIzaSyCKZnR4Appzta9UGi83IX6jKF6LQ8lILO8" ||
        "AIzaSyAXsBaWUcdgegVJVzC0a8fkxGBtAKZKQCQ",
    });
    const model =google("models/gemini-2.0-flash-001");

    runner.registerLLM("vercel-ai", {
      call: async (prompt: Prompt | string, userMessage: string | object, chatHistory?: any) => {
        const t1 = performance.now();
        const response = await generateText({
          model,
          system:  typeof prompt === "string" ? prompt : prompt.content,
          messages: [
            ...(chatHistory || []),
            { role: "user", content: typeof userMessage === "string" ? userMessage : userMessage },
          ],
        });
        const t2 = performance.now();
        return {
          content: response.text,
          metadata: { tokens: response.usage.totalTokens, latency: t2-t1 },
        };
      },
    });
  });

  it("should handle simple Vercel AI prompt", async () => {
    const testCase = {
      name: "Simple Vercel AI Test",
      systemPrompt: "You are a helpful assistant using Vercel AI SDK.",
      userMessage: "What is 2 + 2?",
      expectedResponse: "Vercel AI response to What is 2 + 2?",
      llm: "vercel-ai",
      options: { metrics: ["latency", "tokenUsage"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(120);
    expect(result.metrics.tokenUsage).toEqual({ input: 15, output: 25 });
  });

  it("should handle Vercel AI with chat history", async () => {
    const testCase = {
      name: "Vercel AI Chat History Test",
      systemPrompt: {
        content: "You are a math tutor.",
        metadata: { version: "1.0", llm: "vercel-ai" },
      },
      userMessage: { content: "What is 3 + 3?" }, // Vercel AI SDK may expect object
      chatHistory: [
        { role: "user", content: "What is 2 + 2?" },
        { role: "assistant", content: "2 + 2 is 4." },
      ],
      expectedResponse: 'Vercel AI response to {"content":"What is 3 + 3?"}',
      llm: "vercel-ai",
      options: {
        metrics: ["latency", "tokenUsage", "instructionFollowing"],
      },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
    expect(result.metrics.latency).toBe(120);
    expect(result.metrics.instructionFollowing).toBeGreaterThan(0);
  });

  it("should handle Vercel AI with regex validation", async () => {
    const testCase = {
      name: "Vercel AI Regex Test",
      systemPrompt: "Provide a short greeting.",
      userMessage: "Say hello!",
      expectedResponse: /Vercel AI response/,
      llm: "vercel-ai",
      options: { metrics: ["latency"] },
    };

    const result = await runner.runTest(testCase);
    expect(result.isValid).toBe(true);
  });
});
