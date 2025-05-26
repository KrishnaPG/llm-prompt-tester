import config from "config";

export function loadConfig() {
  return {
    logger: {
      type: config.get("logger.type") || "console",
      options: config.get("logger.options") || {},
    },
    testOptions: {
      retries: config.get("testOptions.retries") || 0,
      timeout: config.get("testOptions.timeout") || 30000,
      rateLimit: config.get("testOptions.rateLimit") || { requestsPerMinute: 60 },
      metrics: config.get("testOptions.metrics") || ["latency", "tokenUsage"],
    },
  };
}
