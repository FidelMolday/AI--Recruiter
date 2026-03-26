import OpenAI from "openai";
import { NextResponse } from "next/server";
import { supabase } from "@/services/supabaseClient";

export async function POST(req) {
  try {
    const { prompt, candidateName, candidateEmail, jobPosition, interviewId, duration, answers } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "google/gemma-3-4b-it:free",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    });

    const aiContent = completion.choices[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Parse the JSON response
    let feedbackData;
    try {
      // Extract JSON from response (in case AI adds extra text)
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        feedbackData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse feedback JSON:", parseError);
      return NextResponse.json({ error: "Invalid JSON in AI response" }, { status: 500 });
    }

    // Save to database
    const { data, error } = await supabase
      .from("interview_feedback")
      .insert({
        interview_id: interviewId || "unknown",
        job_position: jobPosition,
        candidate_name: candidateName,
        candidate_email: candidateEmail || null,
        duration: duration,
        category_scores: feedbackData.categoryScores || {},
        overall_feedback: feedbackData.overallFeedback || "",
        strengths: feedbackData.strengths || [],
        improvements: feedbackData.improvements || [],
        answers: answers || [],
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      feedback: data,
    });
  } catch (e) {
    console.error("Feedback generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate feedback" },
      { status: 500 }
    );
  }
}
