import { generateText } from "../../shared/clients/gemini.js";

/**
 * Generates a concise, engaging TL;DR summary for an event.
 * @param {Object} event - The event object
 * @param {string} rawText - The raw scraped text/HTML
 * @returns {Promise<string|null>} A 1-2 sentence summary or null on failure
 */
export async function generateEventSummary(event, rawText) {
  if (!rawText) return null;

  const systemPrompt = `You are a professional event curator. Your task is to create a "TL;DR" summary for a tech event.
Rules:
- Maximum 2 sentences.
- Focus on the "Why attend" (the value proposition).
- Use an engaging, professional, yet exciting tone.
- Avoid generic phrases like "Join us for" or "This event is about".
- Be specific about the tech stack or the goal of the event.
- Return ONLY the summary text.`;

  const userPrompt = `Event Title: ${event.title}
Description: ${String(rawText).slice(0, 4000)}`;

  try {
    const summary = await generateText(systemPrompt, userPrompt);
    return summary ? summary.trim() : null;
  } catch (err) {
    console.error("Summary generation failed:", err.message || err);
    return null;
  }
}