import { NextResponse } from "next/server";

export async function GET() {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const apiKey  = process.env.ELEVENLABS_API_KEY;

  console.log('[ElevenLabs Route] Agent ID:', agentId)
  console.log('[ElevenLabs Route] API Key prefix:', apiKey?.slice(0, 8))

  if (!agentId || !apiKey) {
    return NextResponse.json(
      { error: "Missing env variables", agentId: !!agentId, apiKey: !!apiKey },
      { status: 500 }
    )
  }

  try {
    const url = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`
    
    const response = await fetch(url, {
      method: "GET",
      headers: { "xi-api-key": apiKey },
    })

    const data = await response.json()
    console.log('[ElevenLabs Route] Status:', response.status)
    console.log('[ElevenLabs Route] Data:', data)

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "ElevenLabs API error", raw: data },
        { status: response.status }
      )
    }

    return NextResponse.json({ signedUrl: data.signed_url })
  } catch (err) {
    console.error('[ElevenLabs Route] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}