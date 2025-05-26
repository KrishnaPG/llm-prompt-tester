export interface Prompt {
  content: string;
  metadata?: {
    version: string;
    llm?: string;
    description?: string;
  };
}

export interface LLMResponse {
  content: string;
  metadata?: {
    tokens?: { input: number; output: number };
    latency?: number;
    [key: string]: any;
  };
}

export interface TestCase {
  name: string;
  systemPrompt?: Prompt | string;
  userMessage: string | object;
  chatHistory?: any; // Flexible chat history
  expectedResponse: string | RegExp | ((response: LLMResponse) => boolean);
  llm: string;
  options?: TestOptions;
}

export interface TestOptions {
  retries?: number;
  timeout?: number;
  rateLimit?: { requestsPerMinute: number };
  metrics?: string[];
  customValidator?: (response: LLMResponse, expected: any) => boolean;
}

export interface LLMAdapter {
  call: (prompt: Prompt | string, userMessage: string | object, chatHistory?: any) => Promise<LLMResponse>;
}

export interface Metrics {
  consistency?: number; // 0-1, based on semantic similarity
  deviation?: number; // Edit distance or semantic distance
  instructionFollowing?: number; // 0-1, based on scoring
  regression?: number; // Difference across versions
  latency?: number; // ms
  tokenUsage?: { input: number; output: number };
}

export interface Logger {
  info: (msg: string, obj?: any) => void;
  error: (msg: string, obj?: any) => void;
  debug: (msg: string, obj?: any) => void;
}

export interface PromptParser {
  parse: (filePath: string) => Promise<Prompt>;
}
