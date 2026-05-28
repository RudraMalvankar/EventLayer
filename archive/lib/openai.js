import { generateText } from "../src/shared/clients/gemini";

export const openai = null;

export async function chatCompletion(systemPrompt, userMessage) {
  return generateText(systemPrompt, userMessage);
}
