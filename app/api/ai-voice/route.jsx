import OpenAI from "openai"
import { NextResponse } from "next/server"

const MODELS = [
  "openai/gpt-3.5-turbo",
  "google/gemini-2.0-flash-001",
  "anthropic/claude-3-haiku",
]

const FALLBACK_RESPONSES = [
  "Thank you for sharing that. Let me move to the next question.",
  "I appreciate your answer. Let's continue with the next question.",
  "That's helpful. Next question coming up.",
  "Great response! Let's move on.",
]

export async function POST(req) {
  try {
    const { messages, systemPrompt } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 })
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    let lastError = null

    for (const model of MODELS) {
      try {
        console.log(`[AI] Trying: ${model}`)
        const completion = await openai.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemPrompt || "You are a professional AI interviewer." },
            ...messages.slice(-8),
          ],
          max_tokens: 150,
          temperature: 0.7,
        })

        const message = completion.choices[0]?.message?.content?.trim()
        if (message && message.length >= 5) {
          console.log(`[AI] Success: ${model}`)
          return NextResponse.json({ message })
        }
      } catch (err) {
        console.warn(`[AI] ${model} failed:`, err?.status)
        lastError = err
        continue
      }
    }

    const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]
    return NextResponse.json({ message: fallback })

  } catch (error) {
    console.error("[AI] Error:", error)
    return NextResponse.json({ message: "Thank you. Next question please." })
  }
}
