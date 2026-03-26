import { NextResponse } from "next/server"

export async function POST(req) {
  try {
    const { text } = await req.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    const truncatedText = text.length > 2000 ? text.substring(0, 2000) : text

    // Try Deepgram first (for better quality)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)

      const dgResponse = await fetch("https://api.deepgram.com/v1/speak?model=aura-2-thalia-en&encoding=mp3", {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text: truncatedText }),
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (dgResponse.ok) {
        const buffer = await dgResponse.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        
        return NextResponse.json({
          audio: `data:audio/mp3;base64,${base64}`,
          provider: 'deepgram'
        })
      }
    } catch (err) {
      console.warn("[TTS] Deepgram failed, using browser TTS")
    }

    // Fallback: Return text for browser speech synthesis
    return NextResponse.json({
      text: truncatedText,
      useBrowserTTS: true
    })

  } catch (error) {
    console.error("[TTS] Error:", error)
    return NextResponse.json(
      { text: "Sorry, I couldn't generate speech", useBrowserTTS: true },
      { status: 200 }
    )
  }
}
