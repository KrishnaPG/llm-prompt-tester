import { LLMClient } from "./llm-adapter";
import { PromptLoader } from "./prompt-loader";
import { MetricsCalculator } from "./metrics";
import { Validator } from "./validators";
import { getLogger, TLogger } from "./logger";
import { LLMResponse, Metrics, TestCase, TestOptions } from "./types";
import { RateLimiter } from "limiter";

export type TestResult = {
  isValid: boolean;
  response: LLMResponse;
  metrics: Metrics
};

export class TestRunner {
  private llmClient: LLMClient;
  private promptLoader: PromptLoader;
  private metricsCalculator: MetricsCalculator;
  private logger: TLogger;
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor(config: any) {
    this.llmClient = new LLMClient();
    this.promptLoader = new PromptLoader();
    this.metricsCalculator = new MetricsCalculator();
    this.logger = getLogger(config.logger?.type, config.logger?.options);
  }

  registerLLM(llmName: string, adapter: any) {
    this.llmClient.registerAdapter(llmName, adapter);
  }

  registerPromptParser(extension: string, parser: any) {
    this.promptLoader.registerParser(extension, parser);
  }

  async runTest(testCase: TestCase) {
    const { llm, systemPrompt, userMessage, chatHistory, options } = testCase;
    const prompt = await this.promptLoader.load(systemPrompt || "");

    // Apply rate limiting
    if (options?.rateLimit) {
      let limiter = this.rateLimiters.get(llm);
      if (!limiter) {
        limiter = new RateLimiter({ tokensPerInterval: options.rateLimit.requestsPerMinute, interval: "minute" });
        this.rateLimiters.set(llm, limiter);
      }
      await limiter.removeTokens(1);
    }

    // Execute LLM call with retries
    const retries = options?.retries || 0;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await this.llmClient.call(llm, prompt, userMessage, chatHistory).then((response) => {
          return Promise.all([
            // Validate the response
            Validator.validate(response, testCase),
            // Calculate the metrics
            this.metricsCalculator.calculate(testCase, response),
          ]).then(([isValid, metrics]) => {
            this.logger.info(`Test ${testCase.name}: ${isValid ? "PASSED" : "FAILED"}`, { response });
            this.logger.debug(`Metrics for ${testCase.name}`, metrics);
            return { isValid, response, metrics };
          });
        });
        return result;
      } catch (error) {
        this.logger.error(`Attempt ${attempt + 1} failed for ${testCase.name}`, error);
        if (attempt === retries) throw error;
      }
    }
  }
}
