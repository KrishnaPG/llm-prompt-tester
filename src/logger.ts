import pino from "pino";

export function getLogger(type: "pino" | "console" = "console", options: any = {})
{
  return type === 'pino' ? pino(options) : console;
}

export type TLogger = ReturnType<typeof getLogger>;