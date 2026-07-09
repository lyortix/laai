import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import type { AiProvider } from "@/lib/ai/provider";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!env.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }
  client ??= new GoogleGenAI({ apiKey: env.geminiApiKey });
  return client;
}

/**
 * Default provider: Google Gemini via the official @google/genai SDK.
 * Native JSON output mode; thinking disabled to keep audits well inside
 * the 60-second budget.
 */
export function createGeminiProvider(): AiProvider {
  const model = env.aiModel || DEFAULT_GEMINI_MODEL;

  return {
    name: "gemini",
    model,
    async generateJson({ system, user }) {
      const response = await getClient().models.generateContent({
        model,
        contents: user,
        config: {
          systemInstruction: system,
          temperature: 0.4,
          maxOutputTokens: 8_192,
          responseMimeType: "application/json",
          thinkingConfig: { thinkingBudget: 0 },
        },
      });
      return response.text ?? "";
    },
  };
}
