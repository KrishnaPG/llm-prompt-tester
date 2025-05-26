# llm-prompt-tester
A reusable `npm` package for testing LLM prompt responses across different LLMs and prompt versions, with support for simple and complex test cases, pluggable LLM integrations, metrics, and logging.

## Installation
```bash
npm install llm-prompt-tester
```

### Key Features:
  - Pluggable LLM integration via user-provided functions.
  - Prompt management via strings or files (JSON/YAML with metadata).
  - Flexible chat history support with no imposed structure.
  - Built-in metrics (consistency, deviation, instruction following, regression, latency, token usage) using open-source tools like SentenceTransformers.
  - Pluggable logging with pino and console.
  - Rate limiting and parallel execution support.
  - Configuration via config npm package.
  - Custom validation logic with built-in validators.

Assumptions:
  - Chat history is passed as-is to the LLM, supporting formats like Vercel AI, OpenAI, and Grok.
  - JSON prompt files include metadata (version, LLM, description).
  - Metrics use SentenceTransformers for semantic similarity and custom scoring for instruction following.
  - Rate limiting is user-configurable via options.
  - Tests are run in parallel using Jest’s built-in capabilities.


### Notes
- **LLM Integration**: Users provide adapters for LLMs, supporting formats like Vercel AI, OpenAI, or Grok. The package forwards chat history as-is.
- **Prompt Loading**: Supports JSON, YAML, and plain text, with metadata (version, LLM, description). Users can register custom parsers.
- **Metrics**: Uses SentenceTransformers for consistency and deviation, with a simple keyword-based scorer for instruction following. Regression compares deviation across versions.
- **Logging**: Supports `pino` and `console`, with pluggable options.
- **Rate Limiting**: Uses `limiter` for user-configurable rate limiting.
- **Parallel Execution**: Jest handles parallel test execution natively.
- **Validation**: Built-in validators (exact match, regex, custom function) with user-provided custom validators.

This implementation is based on battle-tested open-source tools (`pino`, `config`, `sentence-transformers`, `fast-levenshtein`) and designed for extensibility and reusability.