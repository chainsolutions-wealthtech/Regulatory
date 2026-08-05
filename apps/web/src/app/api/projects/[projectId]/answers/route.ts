import { NextResponse } from "next/server";
import { getQuestionById } from "@/domain/regulatory-catalog";
import { getQuestionsByGroup } from "@/domain/questionnaire";
import { saveAnswer } from "@/server/project-store";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const [{ projectId }, body] = await Promise.all([
    params,
    request.json().catch(() => null) as Promise<Record<string, unknown> | null>,
  ]);
  if (!body || typeof body.questionId !== "string") {
    return NextResponse.json({ error: "questionId est obligatoire." }, { status: 422 });
  }
  const question = getQuestionById(body.questionId);
  if (!question || question.interactive === false) {
    return NextResponse.json({ error: "Question inconnue ou non interactive." }, { status: 422 });
  }
  try {
    const project = await saveAnswer({
      projectId,
      questionId: body.questionId,
      value: body.value,
    });
    return NextResponse.json({ project, groups: getQuestionsByGroup(project) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur d’enregistrement." },
      { status: 400 },
    );
  }
}
