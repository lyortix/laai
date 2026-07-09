import OpenAI from "openai";
import { env } from "@/lib/env";
import type { AiProvider } from "@/lib/ai/provider";

const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!env.openaiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }
  client ??= new OpenAI({
    apiKey: env.openaiApiKey,
    baseURL: env.openaiBaseUrl,
  });
  return client;
}

/**
 * Alternative provider: any OpenAI-compatible chat completions API
 * (OpenAI, Groq, Together, OpenRouter, Azure, Ollama, …) selected via
 * OPENAI_BASE_URL. Falls back to prompt-only JSON when the provider
 * rejects response_format.
 */
export function createOpenAiProvider(): AiProvider {
  const model = env.aiModel || DEFAULT_OPENAI_MODEL;

  async function complete(system: string, user: string, useJsonMode: boolean) {
    const completion = await getClient().chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 6_000,
      ...(useJsonMode ? { response_format: { type: "json_object" as const } } : {}),
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });
    return completion.choices[0]?.message?.content ?? "";
  }

  return {
    name: "openai",
    model,
    async generateJson({ system, user }) {
      try {
        return await complete(system, user, true);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/response_format/i.test(message)) {
          return complete(system, user, false);
        }
        throw err;
      }
    },
  };
}
