import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/env";
import type { AiProvider } from "@/lib/ai/provider";

// Rolling alias that always resolves to the current stable Flash model, so a
// model being retired for new users can't break us again. Pin a specific
// version via AI_MODEL if you need reproducibility.
const DEFAULT_GEMINI_MODEL = "gemini-flash-latest";
/** Tried automatically when the primary model returns 503 "high demand". */
const FALLBACK_GEMINI_MODEL = "gemini-flash-lite-latest";

/** Google-side capacity/transient failures worth retrying elsewhere. */
export function isTransientProviderError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /UNAVAILABLE|high demand|overloaded|RESOURCE_EXHAUSTED|"code":\s*(503|429)|\b503\b|\b429\b/i.test(
    message
  );
}

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
  // Only auto-fallback when running on our default; a pinned AI_MODEL is an
  // explicit operator choice we must respect.
  const canFallback = !env.aiModel;

  async function complete(useModel: string, system: string, user: string) {
    const response = await getClient().models.generateContent({
      model: useModel,
      contents: user,
      config: {
        systemInstruction: system,
        temperature: 0.4,
        // Concise prompt keeps the real report ~2.5-3k tokens; this ceiling
        // guards against runaway generation without risking truncation.
        maxOutputTokens: 6_144,
        responseMimeType: "application/json",
        // Disable "thinking" so Flash spends its time writing, not reasoning
        // silently — critical for staying under the function time limit.
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
    return response.text ?? "";
  }

  return {
    name: "gemini",
    model,
    async generateJson({ system, user }) {
      try {
        return await complete(model, system, user);
      } catch (err) {
        if (canFallback && isTransientProviderError(err)) {
          console.warn(`[gemini] ${model} unavailable, falling back to ${FALLBACK_GEMINI_MODEL}`);
          return complete(FALLBACK_GEMINI_MODEL, system, user);
        }
        throw err;
      }
    },
  };
}
