import OpenAI from "openai";
import { env } from "@/lib/env";

let client: OpenAI | null = null;

/**
 * OpenAI-compatible client. Point OPENAI_BASE_URL at any provider that
 * implements the chat completions protocol (OpenAI, Groq, Together,
 * OpenRouter, Azure, Ollama, …).
 */
export function getAiClient(): OpenAI {
  if (!env.openaiApiKey) {
    throw new Error(
      "OPENAI_API_KEY is not configured. Set it (or MOCK_AI=true) to run audits."
    );
  }
  client ??= new OpenAI({
    apiKey: env.openaiApiKey,
    baseURL: env.openaiBaseUrl,
  });
  return client;
}
