import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabase } from "@/services/supabaseClient";

const MODELS = [
  "meta-llama/llama-3.3-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemma-3-4b-it:free",
  "microsoft/phi-3-mini-128k-instruct:free",
]

async function callAIWithFallback(openai, prompt) {
  for (const model of MODELS) {
    try {
      console.log(`[Evaluate] Trying: ${model}`)
      const completion = await openai.chat.completions.create({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 3000,
      })
      const content = completion.choices[0]?.message?.content
      if (content) {
        console.log(`[Evaluate] Success: ${model}`)
        return content
      }
    } catch (err) {
      console.warn(`[Evaluate] ${model} failed: ${err?.status} ${err?.message}`)
      continue
    }
  }
  throw new Error("All AI models failed")
}

export async function POST(req) {
  try {
    const {
      transcriptId,
      transcript,
      candidateName,
      candidateEmail,
      jobPosition,
      jobDescription,
      questionList,
      interviewId,
    } = await req.json();

    if (!transcript || transcript.length === 0) {
      console.warn("[Evaluate] No transcript — saving placeholder")
      const { data } = await supabase
        .from("interview_evaluations")
        .insert({
          transcript_id: transcriptId ?? null,
          interview_id:  interviewId  ?? "unknown",
          candidate_name: candidateName ?? "Unknown",
          candidate_email: candidateEmail ?? null,
          job_position: jobPosition ?? null,
          overall_score: 0,
          communication_score: 0,
          technical_knowledge_score: 0,
          confidence_score: 0,
          problem_solving_score: 0,
          recommendation: "Consider",
          recommendation_reason: "No transcript was captured for this session.",
          qualification_status: "pending",
          detailed_feedback: "No transcript captured. The candidate may have had audio issues.",
          overall_feedback: "No transcript captured.",
          strengths: [],
          improvements: [],
          question_scores: [],
          category_scores: {},
          status: "incomplete",
          email_sent: false,
        })
        .select().single()
      return NextResponse.json({ error: "No transcript", evaluation: data }, { status: 400 })
    }

    const formattedTranscript = transcript
      .map(t => `${t.speaker === 'agent' ? 'AI Recruiter' : 'Candidate'}: ${t.text}`)
      .join('\n\n')

    const formattedQuestions = Array.isArray(questionList) && questionList.length > 0
      ? questionList.map((q, i) => `${i + 1}. ${q?.question ?? q}`).join('\n')
      : 'Not provided'

    const prompt = `You are a senior HR expert. Analyze this job interview and return a JSON evaluation.

Job Position: ${jobPosition || 'Not specified'}
Job Description: ${jobDescription || 'Not provided'}

Interview Questions:
${formattedQuestions}

Interview Transcript:
${formattedTranscript}

Return ONLY valid JSON with NO markdown, NO code fences, NO explanation:
{
  "overall_score": <0-100>,
  "communication_score": <0-100>,
  "technical_knowledge_score": <0-100>,
  "confidence_score": <0-100>,
  "problem_solving_score": <0-100>,
  "recommendation": "Hire",
  "recommendation_reason": "<1-2 sentences>",
  "detailed_feedback": "<3-4 paragraphs>",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "question_scores": [
    { "question": "<text>", "score": <0-100>, "feedback": "<1-2 sentences>" }
  ]
}

recommendation must be exactly: "Hire" (score>=75), "Consider" (50-74), or "Reject" (<50)`

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    })

    const aiContent = await callAIWithFallback(openai, prompt)

    let evaluation
    try {
      const cleaned = aiContent.replace(/```json/g, '').replace(/```/g, '').trim()
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error("No JSON found")
      evaluation = JSON.parse(match[0])
    } catch (e) {
      console.error("[Evaluate] JSON parse error:", e, "\nRaw:", aiContent)
      return NextResponse.json({ error: "Invalid JSON from AI" }, { status: 500 })
    }

    if (evaluation.overall_score === undefined || !evaluation.recommendation) {
      return NextResponse.json({ error: "Incomplete evaluation" }, { status: 500 })
    }

    const rec = evaluation.recommendation?.toLowerCase()
    const normalizedRec = rec === 'hire' ? 'Hire' : rec === 'reject' ? 'Reject' : 'Consider'
    const qualStatus = normalizedRec === 'Hire' ? 'qualified' : normalizedRec === 'Reject' ? 'not_qualified' : 'pending'

    const { data, error: dbError } = await supabase
      .from("interview_evaluations")
      .insert({
        transcript_id:             transcriptId ?? null,
        interview_id:              interviewId  ?? "unknown",
        candidate_name:            candidateName,
        candidate_email:           candidateEmail ?? null,
        job_position:              jobPosition    ?? null,
        overall_score:             evaluation.overall_score,
        communication_score:       evaluation.communication_score,
        technical_knowledge_score: evaluation.technical_knowledge_score,
        confidence_score:          evaluation.confidence_score,
        problem_solving_score:     evaluation.problem_solving_score,
        recommendation:            normalizedRec,
        recommendation_reason:     evaluation.recommendation_reason ?? null,
        qualification_status:      qualStatus,
        detailed_feedback:         evaluation.detailed_feedback,
        overall_feedback:          evaluation.detailed_feedback,
        strengths:                 evaluation.strengths   ?? [],
        improvements:              evaluation.improvements ?? [],
        question_scores:           evaluation.question_scores ?? [],
        category_scores: {
          "Technical Skills": evaluation.technical_knowledge_score,
          "Communication":    evaluation.communication_score,
          "Confidence":        evaluation.confidence_score,
          "Problem Solving":   evaluation.problem_solving_score,
        },
        status:     'completed',
        email_sent: false,
      })
      .select().single()

    if (dbError) {
      console.error("[Evaluate] DB error:", dbError)
      return NextResponse.json({ error: "Failed to save to database" }, { status: 500 })
    }

    return NextResponse.json({ success: true, evaluation: data })

  } catch (e) {
    console.error("[Evaluate] Route error:", e)
    return NextResponse.json({ error: e.message || "Failed to evaluate" }, { status: 500 })
  }
}
