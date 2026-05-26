import { GoogleGenAI } from '@google/genai'
import { env } from '../config/env'

const model = 'gemini-2.5-flash'
const client = env.geminiApiKey ? new GoogleGenAI({ apiKey: env.geminiApiKey }) : null

export async function generateText(systemPrompt, userPrompt) {
  try {
    if (!client) return null
    const response = await client.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
    })
    return response.text?.trim() || null
  } catch {
    return null
  }
}

