import { readFile } from "fs/promises";
import { parse } from "yaml";
import { Prompt, PromptParser } from "./types";

export class PromptLoader {
  private parsers: Map<string, PromptParser> = new Map();

  constructor() {
    // Default parsers for JSON and YAML
    this.registerParser("json", {
      parse: async (filePath: string): Promise<Prompt> => {
        const content = await readFile(filePath, "utf-8");
        const data = JSON.parse(content);
        return {
          content: data.content,
          metadata: {
            version: data.version || "1.0",
            llm: data.llm,
            description: data.description,
          },
        };
      },
    });
    this.registerParser("yaml", {
      parse: async (filePath: string): Promise<Prompt> => {
        const content = await readFile(filePath, "utf-8");
        const data = parse(content);
        return {
          content: data.content,
          metadata: {
            version: data.version || "1.0",
            llm: data.llm,
            description: data.description,
          },
        };
      },
    });
    this.registerParser("txt", {
      parse: async (filePath: string): Promise<Prompt> => {
        const content = await readFile(filePath, "utf-8");
        return {
          content,
          metadata: { version: "1.0" },
        };
      },
    });
  }

  registerParser(extension: string, parser: PromptParser) {
    this.parsers.set(extension, parser);
  }

  async load(filePathOrPrompt: string | Prompt): Promise<Prompt> {
    if (typeof filePathOrPrompt === "string") {
      if (filePathOrPrompt.match(/\.(json|yaml|txt)$/)) {
        const ext = filePathOrPrompt.split(".").pop()!;
        const parser = this.parsers.get(ext);
        if (!parser) {
          throw new Error(`No parser for file extension: ${ext}`);
        }
        return parser.parse(filePathOrPrompt);
      }
      return { content: filePathOrPrompt, metadata: { version: "1.0" } };
    }
    return filePathOrPrompt;
  }
}
