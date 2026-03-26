import { NextResponse } from "next/server"

const STT_TIMEOUT = 20000

export async function POST(req) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio')

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    const buffer = await audioFile.arrayBuffer()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), STT_TIMEOUT)

    try {
      const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true", {
        method: "POST",
        headers: {
          "Authorization": `Token ${process.env.DEEPGRAM_API_KEY}`,
          "Content-Type": "audio/webm"
        },
        body: buffer,
        signal: controller.signal
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Deepgram STT error:", response.status, errorText)
        return NextResponse.json({ error: "Transcription failed", details: errorText }, { status: 500 })
      }

      const result = await response.json()
      const text = result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || ""

      console.log("[STT] Transcribed:", text)
      return NextResponse.json({ text })

    } catch (fetchErr) {
      clearTimeout(timeout)
      console.error("STT fetch error:", fetchErr.message)
      return NextResponse.json({ error: "Transcription timeout or failed", details: fetchErr.message }, { status: 500 })
    }

  } catch (error) {
    console.error("Deepgram STT error:", error)
    return NextResponse.json({ error: "Transcription failed", details: error.message }, { status: 500 })
  }
}
