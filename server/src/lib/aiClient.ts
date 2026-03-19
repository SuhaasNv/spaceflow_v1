/**
 * Shared AI client for SpaceFlow.
 * Provider chain: Gemini 2.5 Flash → OpenAI GPT-4o → null (caller uses rule-based fallback)
 *
 * Usage:
 *   const result = await callAI(prompt);
 *   if (!result) { // use rule-based fallback }
 */

export interface AiCallResult {
  text: string;
  provider: "gemini" | "openai";
  model: string;
  promptTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
}

export async function callAI(prompt: string): Promise<AiCallResult | null> {
  // ── Attempt 1: Gemini ─────────────────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const { GoogleGenerativeAI } =
        (await import("@google/generative-ai")) as typeof import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(geminiKey);
      const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      const usage = result.response.usageMetadata;
      return {
        text,
        provider: "gemini",
        model: modelName,
        promptTokens: usage?.promptTokenCount,
        responseTokens: usage?.candidatesTokenCount,
        totalTokens: usage?.totalTokenCount,
      };
    } catch (err) {
      console.warn("[AI] Gemini failed, trying OpenAI fallback:", (err as Error).message);
    }
  }

  // ── Attempt 2: OpenAI GPT-4o-mini ────────────────────────────────────────
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: openaiKey });
      const modelName = process.env.OPENAI_MODEL ?? "gpt-4o";
      const completion = await client.chat.completions.create({
        model: modelName,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      });
      const text = completion.choices[0]?.message?.content?.trim() ?? "";
      const usage = completion.usage;
      return {
        text,
        provider: "openai",
        model: modelName,
        promptTokens: usage?.prompt_tokens,
        responseTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
      };
    } catch (err) {
      console.warn("[AI] OpenAI fallback also failed:", (err as Error).message);
    }
  }

  // ── No provider available ─────────────────────────────────────────────────
  return null;
}

/** Strip markdown code fences from AI JSON responses */
export function stripJsonFences(text: string): string {
  return text.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "").trim();
}
