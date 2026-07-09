import { env } from "@/lib/env";
import { createGeminiProvider } from "@/lib/ai/providers/gemini";
import { createOpenAiProvider } from "@/lib/ai/providers/openai";

/**
 * Minimal provider contract: given a system + user prompt, return a raw JSON
 * string. Everything above this layer (prompting, parsing, validation,
 * retries) is provider-agnostic.
 */
export interface AiProvider {
  readonly name: string;
  readonly model: string;
  generateJson(input: { system: string; user: string }): Promise<string>;
}

/**
 * Provider selection:
 * 1. AI_PROVIDER env var wins when set ("gemini" | "openai").
 * 2. Otherwise Gemini is the default whenever GEMINI_API_KEY is present.
 * 3. Otherwise fall back to any configured OpenAI-compatible provider.
 *
 * (MOCK_AI is handled upstream in run.ts and never reaches this layer.)
 */
export function resolveProvider(): AiProvider {
  switch (env.aiProvider) {
    case "gemini":
      return createGeminiProvider();
    case "openai":
      return createOpenAiProvider();
    case "":
      break;
    default:
      throw new Error(
        `Unknown AI_PROVIDER "${env.aiProvider}". Use "gemini" or "openai".`
      );
  }

  if (env.geminiApiKey) return createGeminiProvider();
  if (env.openaiApiKey) return createOpenAiProvider();

  throw new Error(
    "No AI provider configured. Set GEMINI_API_KEY (recommended), OPENAI_API_KEY, or MOCK_AI=true."
  );
}
