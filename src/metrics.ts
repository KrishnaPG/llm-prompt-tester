import { LLMResponse, Metrics } from "./types";
import { LLMClient } from "./llm-adapter";
import { SentenceTransformer } from "sentence-transformers"; // Hypothetical TS wrapper for SentenceTransformers
import { levenshtein } from "fast-levenshtein";

export class MetricsCalculator {
  private transformer: SentenceTransformer;

  constructor() {
    this.transformer = new SentenceTransformer("all-MiniLM-L6-v2");
  }

  async calculate(testCase: any, response: LLMResponse, previousResponses: LLMResponse[] = []): Promise<Metrics> {
    const metrics: Metrics = {};

    if (testCase.options?.metrics.includes("latency")) {
      metrics.latency = response.metadata?.latency;
    }

    if (testCase.options?.metrics.includes("tokenUsage")) {
      metrics.tokenUsage = response.metadata?.tokens;
    }

    if (testCase.options?.metrics.includes("consistency") && previousResponses.length > 0) {
      const embeddings = await this.transformer.encode([response.content, ...previousResponses.map((r) => r.content)]);
      const similarity = this.cosineSimilarity(embeddings[0], embeddings.slice(1));
      metrics.consistency = similarity.reduce((a, b) => a + b, 0) / similarity.length;
    }

    if (testCase.options?.metrics.includes("deviation") && typeof testCase.expectedResponse === "string") {
      metrics.deviation = levenshtein.get(response.content, testCase.expectedResponse);
    }

    if (testCase.options?.metrics.includes("instructionFollowing")) {
      metrics.instructionFollowing = this.scoreInstructionFollowing(
        response.content,
        testCase.systemPrompt?.content || ""
      );
    }

    if (testCase.options?.metrics.includes("regression") && previousResponses.length > 0) {
      const prevMetrics = await this.calculate(testCase, previousResponses[0]);
      metrics.regression = Math.abs((metrics.deviation || 0) - (prevMetrics.deviation || 0));
    }

    return metrics;
  }

  private cosineSimilarity(embedding: number[], others: number[][]): number[] {
    return others.map((other) => {
      const dot = embedding.reduce((sum, val, i) => sum + val * other[i], 0);
      const normA = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(other.reduce((sum, val) => sum + val * val, 0));
      return dot / (normA * normB);
    });
  }

  private scoreInstructionFollowing(response: string, prompt: string): number {
    // Simplified scoring based on keyword overlap
    const promptWords = new Set(prompt.toLowerCase().split(/\s+/));
    const responseWords = response.toLowerCase().split(/\s+/);
    const overlap = responseWords.filter((word) => promptWords.has(word)).length;
    return overlap / promptWords.size;
  }
}
