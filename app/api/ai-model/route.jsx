import OpenAI from "openai";
import { QUESTIONS_PROMPT } from "../../../services/Constants";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { jobPosition, jobDescription, duration, type } = await req.json();

    if (!jobPosition || jobPosition.trim().length < 2) {
      return NextResponse.json({ error: "Job position is required" }, { status: 400 });
    }

    if (!jobDescription || jobDescription.trim().length < 10) {
      return NextResponse.json({ error: "Job description must be at least 10 characters" }, { status: 400 });
    }

    if (!duration) {
      return NextResponse.json({ error: "Interview duration is required" }, { status: 400 });
    }

    if (!type || !Array.isArray(type) || type.length === 0) {
      return NextResponse.json({ error: "At least one interview type is required" }, { status: 400 });
    }

    const FINAL_PROMPT = QUESTIONS_PROMPT
      .replace("{{jobTitle}}", jobPosition)
      .replace("{{jobDescription}}", jobDescription)
      .replace("{{duration}}", duration)
      .replace("{{type}}", type.join(", "));

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "google/gemma-3-4b-it:free",
      messages: [{ role: "user", content: FINAL_PROMPT }],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const aiContent = completion.choices[0]?.message?.content;

    if (!aiContent) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    return NextResponse.json({ content: aiContent });
  } catch (e) {
    console.error("AI Generation Error:", e);
    return NextResponse.json({ error: "Failed to generate questions: " + (e.message || "Unknown error") }, { status: 500 });
  }
}
