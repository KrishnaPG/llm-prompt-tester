import { LLMAdapter, LLMResponse, Prompt } from "./types";

export class LLMClient {
  private adapters: Map<string, LLMAdapter> = new Map();

  registerAdapter(llmName: string, adapter: LLMAdapter) {
    this.adapters.set(llmName, adapter);
  }

  async call(
    llmName: string,
    prompt: Prompt | string,
    userMessage: string | object,
    chatHistory?: any
  ): Promise<LLMResponse> {
    const adapter = this.adapters.get(llmName);
    if (!adapter) {
      throw new Error(`No adapter registered for LLM: ${llmName}`);
    }
    const startTime = Date.now();
    const response = await adapter.call(prompt, userMessage, chatHistory);
    response.metadata = response.metadata || {};
    response.metadata.latency = Date.now() - startTime;
    return response;
  }
}
