import { LLMResponse, Metrics, TestCase } from "./types";
import { pipeline, env } from "@huggingface/transformers";
import { levenshtein } from "fast-levenshtein";

// Configure environment for Hugging Face transformers
env.allowLocalModels = true; // Allow local model loading if needed
env.allowRemoteModels = true; // Allow remote model loading

export class MetricsCalculator {
  private transformer: any; // Pipeline for sentence embeddings

  constructor() {
    // Initialize the Hugging Face transformer pipeline for feature extraction
    this.transformer = pipeline("feature-extraction", "sentence-transformers/all-MiniLM-L6-v2");
  }

  async calculate(testCase: TestCase, response: LLMResponse, previousResponses: LLMResponse[] = []): Promise<Metrics> {
    const metrics: Metrics = {};

    // Latency metric
    if (testCase.options?.metrics.includes("latency")) {
      metrics.latency = response.metadata?.latency;
    }

    // Token usage metric
    if (testCase.options?.metrics.includes("tokenUsage")) {
      metrics.tokenUsage = response.metadata?.tokens;
    }

    // Consistency metric using Hugging Face transformers
    if (testCase.options?.metrics.includes("consistency") && previousResponses.length > 0) {
      const texts = [response.content, ...previousResponses.map((r) => r.content)];
      const embeddings = await this.getEmbeddings(texts);
      const similarity = this.cosineSimilarity(embeddings[0], embeddings.slice(1));
      metrics.consistency = similarity.reduce((a, b) => a + b, 0) / similarity.length;
    }

    // Deviation metric
    if (testCase.options?.metrics.includes("deviation") && typeof testCase.expectedResponse === "string") {
      metrics.deviation = levenshtein.get(response.content, testCase.expectedResponse);
    }

    // Instruction following metric
    if (testCase.options?.metrics.includes("instructionFollowing")) {
      metrics.instructionFollowing = this.scoreInstructionFollowing(
        response.content,
        typeof testCase.systemPrompt === "string" ? testCase.systemPrompt : testCase.systemPrompt?.content || ""
      );
    }

    // Regression metric
    if (testCase.options?.metrics.includes("regression") && previousResponses.length > 0) {
      const prevMetrics = await this.calculate(testCase, previousResponses[0]);
      metrics.regression = Math.abs((metrics.deviation || 0) - (prevMetrics.deviation || 0));
    }

    return metrics;
  }

  private async getEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      // Use Hugging Face pipeline to get embeddings
      const output = await this.transformer(text, { pooling: "mean", normalize: true });
      // Convert tensor output to array
      const embedding: number[] = Array.from(output.data);
      embeddings.push(embedding);
    }
    return embeddings;
  }

  private cosineSimilarity(embedding: number[], others: number[][]): number[] {
    return others.map((other) => {
      const dot = embedding.reduce((sum, val, i) => sum + val * other[i], 0);
      const normA = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(other.reduce((sum, val) => sum + val * val, 0));
      return dot / (normA * normB || 1); // Avoid division by zero
    });
  }

  private scoreInstructionFollowing(response: string, prompt: string): number {
    // Simplified scoring based on keyword overlap
    const promptWords = new Set(prompt.toLowerCase().split(/\s+/));
    const responseWords = response.toLowerCase().split(/\s+/);
    const overlap = responseWords.filter((word) => promptWords.has(word)).length;
    return overlap / (promptWords.size || 1); // Avoid division by zero
  }
}
