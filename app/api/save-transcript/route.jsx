import { NextResponse } from "next/server"
import { supabase } from "@/services/supabaseClient"

export async function POST(req) {
  try {
    const {
      interviewId,
      candidateName,
      candidateEmail,
      jobPosition,
      transcript,
      duration,
      startedAt,
      endedAt,
    } = await req.json()

    console.log("[SaveTranscript] Saving for:", candidateName, "| interview:", interviewId)

    const { data, error } = await supabase
      .from("interview_transcripts")
      .insert({
        interview_id:    interviewId    || "unknown",
        candidate_name:  candidateName  || "Unknown Candidate",
        candidate_email: candidateEmail || null,
        job_position:    jobPosition    || null,
        transcript:      transcript     || [],
        duration:        duration       || null,
        started_at:      startedAt      || null,
        ended_at:        endedAt        || new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[SaveTranscript] DB error:", error)
      return NextResponse.json({ error: "Failed to save transcript" }, { status: 500 })
    }

    console.log("[SaveTranscript] Saved, id:", data.id)
    return NextResponse.json({ success: true, transcriptId: data.id, transcript: data })

  } catch (e) {
    console.error("[SaveTranscript] Error:", e)
    return NextResponse.json({ error: "Failed to save transcript" }, { status: 500 })
  }
}
