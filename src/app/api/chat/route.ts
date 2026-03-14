import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPatientProfile } from "@/lib/queries/portal";

type PatientResultContext = {
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  isAbnormal: boolean;
};

type ChatRequestBody = {
  messages: { role: "user" | "assistant"; content: string }[];
  patientContext: {
    patientName: string;
    results: PatientResultContext[];
  };
};

function buildSystemPrompt(
  patientName: string,
  results: PatientResultContext[]
): string {
  let prompt = `You are a friendly health assistant for LabFlow Pro's Patient Portal. You help patients understand their laboratory test results and prepare for upcoming tests.

IMPORTANT GUIDELINES:
- You are NOT a doctor. Always recommend consulting their healthcare provider for medical advice.
- Explain what tests measure and what results generally mean in simple language.
- Provide general test preparation tips when asked.
- Never diagnose conditions or recommend treatments.
- Be empathetic, clear, and supportive.
- If the patient has results, reference their specific values when relevant.
- Address the patient as ${patientName}.`;

  if (results.length > 0) {
    prompt += `\n\nThe patient's recent lab results:\n`;
    for (const r of results) {
      const status = r.isAbnormal ? "OUT OF RANGE" : "Normal";
      prompt += `- ${r.testName}: ${r.value}${r.unit ? ` ${r.unit}` : ""}`;
      if (r.referenceRange) {
        prompt += ` (Reference: ${r.referenceRange})`;
      }
      prompt += ` [${status}]\n`;
    }
  }

  return prompt;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new NextResponse(
      "The AI chat assistant is not available right now. The OPENAI_API_KEY environment variable has not been configured. Please contact your administrator.",
      { status: 503 }
    );
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabaseClient();
      const profile = await getPatientProfile(supabase);

      if (profile.role !== "patient") {
        return new NextResponse("Access denied. This endpoint is for patients only.", {
          status: 403,
        });
      }
    } catch {
      return new NextResponse("Authentication required.", { status: 401 });
    }
  }

  let body: ChatRequestBody;
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid request body.", { status: 400 });
  }

  const { messages, patientContext } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return new NextResponse("Messages are required.", { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(
    patientContext?.patientName ?? "there",
    patientContext?.results ?? []
  );

  const client = new OpenAI({ apiKey });

  try {
    const stream = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) {
              const data = JSON.stringify({ text });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to connect to AI service";
    return new NextResponse(
      `Sorry, I was unable to process your request: ${message}`,
      { status: 500 }
    );
  }
}
