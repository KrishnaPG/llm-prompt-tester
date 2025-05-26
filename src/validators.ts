import { LLMResponse, TestCase } from "./types";

export class Validator {
  static async validate(response: LLMResponse, testCase: TestCase): Promise<boolean> {
    if (testCase.options?.customValidator) {
      return testCase.options.customValidator(response, testCase.expectedResponse);
    }

    if (typeof testCase.expectedResponse === "string") {
      return response.content === testCase.expectedResponse;
    }

    if (testCase.expectedResponse instanceof RegExp) {
      return testCase.expectedResponse.test(response.content);
    }

    if (typeof testCase.expectedResponse === "function") {
      return testCase.expectedResponse(response);
    }

    throw new Error("Invalid expected response type");
  }
}
