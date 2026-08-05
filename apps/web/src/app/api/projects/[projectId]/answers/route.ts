import { NextResponse } from "next/server";
import { QUESTIONS } from "@/domain/question-catalog";
import { saveAnswer } from "@/server/project-store";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const [{ projectId }, body] = await Promise.all([params, request.json().catch(() => null) as Promise<Record<string, unknown> | null>]);
  if (!body || typeof body.questionId !== "string") return NextResponse.json({ error: "questionId est obligatoire." }, { status: 422 });
  if (!QUESTIONS.some((question) => question.id === body.questionId)) return NextResponse.json({ error: "Question inconnue." }, { status: 422 });
  try {
    const project = await saveAnswer({ projectId, questionId: body.questionId, value: body.value });
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erreur d’enregistrement." }, { status: 400 });
  }
}
