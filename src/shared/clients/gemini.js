import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env.js";

const model = "gemini-2.0-flash";
const client = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null;

export function isGeminiConfigured() {
  return Boolean(client && env.geminiApiKey);
}

export async function generateText(systemPrompt, userPrompt, options = {}) {
  try {
    if (!client) return null;
    const response = await client.models.generateContent({
      model: options.model || model,
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
        },
      ],
      config: options.json
        ? { responseMimeType: "application/json" }
        : undefined,
    });
    return response.text?.trim() || null;
  } catch (err) {
    console.error("Gemini error:", err?.message || err);
    return null;
  }
}
